import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

const STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_CUSTOMER: "waiting_customer",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const PRIORITY_TO_SLA_HOURS: Record<string, number> = {
  urgent: 4,
  high: 8,
  normal: 24,
  low: 48,
};

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function getSlaDueAt(startAt: number, priority: string) {
  const hours = PRIORITY_TO_SLA_HOURS[priority] ?? PRIORITY_TO_SLA_HOURS.normal;
  return startAt + hours * 60 * 60 * 1000;
}

function isResolvedStatus(status: string) {
  return status === STATUS.RESOLVED || status === STATUS.CLOSED;
}

function marksFirstResponse(status: string) {
  return (
    status === STATUS.IN_PROGRESS ||
    status === STATUS.WAITING_CUSTOMER ||
    status === STATUS.RESOLVED ||
    status === STATUS.CLOSED
  );
}

function getTimelineGuestToken(ticket: any) {
  if (ticket.user_id) return undefined;
  const email = normalizeEmail(ticket.guest_email);
  return email || undefined;
}

async function recordTimelineEvent(ctx: any, ticket: any, eventType: string, payload?: Record<string, unknown>) {
  const userId = ticket.user_id;
  const guestToken = getTimelineGuestToken(ticket);
  if (!userId && !guestToken) return;

  await ctx.db.insert("customer_timeline_events", {
    user_id: userId,
    guest_token: guestToken,
    event_type: eventType,
    source: "support",
    entity_type: "support_ticket",
    entity_id: String(ticket._id),
    payload,
    created_at: Date.now(),
  });
}

function isCustomerVisibleEvent(event: any) {
  if (event.type === "internal_note") return false;
  if (event.type === "created") return true;
  if (event.type === "customer_note") return true;
  if (event.type === "customer_reply") return true;

  if (event.type === "updated") {
    if (!event.note) return true;
    const visibility = event.payload?.note_visibility ?? event.payload?.visibility;
    return visibility === "customer";
  }

  return true;
}

function toCustomerEvent(event: any) {
  const visibility = event.payload?.note_visibility ?? event.payload?.visibility;
  if (event.type === "updated" && event.note && visibility !== "customer") {
    return {
      ...event,
      note: undefined,
    };
  }
  return event;
}

async function hydrateTicket(
  ctx: any,
  ticket: any,
  options?: { customerView?: boolean }
) {
  const events = await ctx.db
    .query("support_events")
    .withIndex("by_ticket", (q: any) => q.eq("ticket_id", ticket._id))
    .collect();

  const user = ticket.user_id ? await ctx.db.get(ticket.user_id) : null;
  const assignee = ticket.assigned_to ? await ctx.db.get(ticket.assigned_to) : null;
  const order = ticket.order_id ? await ctx.db.get(ticket.order_id) : null;
  const sortedEvents = events.sort((a: any, b: any) => a.created_at - b.created_at);
  const viewEvents = options?.customerView
    ? sortedEvents.filter(isCustomerVisibleEvent).map(toCustomerEvent)
    : sortedEvents;

  const now = Date.now();
  const unresolved = !isResolvedStatus(ticket.status);
  const slaOverdue =
    unresolved && typeof ticket.sla_due_at === "number" ? now > ticket.sla_due_at : false;

  return {
    ...ticket,
    user_email: user?.email,
    assignee_email: assignee?.email,
    order_number: order?.order_number,
    events: viewEvents,
    last_event_at: viewEvents.length > 0 ? viewEvents[viewEvents.length - 1].created_at : null,
    sla_overdue: slaOverdue,
    resolution_time_minutes:
      typeof ticket.resolved_at === "number"
        ? Math.max(0, Math.round((ticket.resolved_at - ticket.created_at) / 60000))
        : undefined,
  };
}

async function resolveTicketForViewer(
  ctx: any,
  args: { ticket_id: string; guest_email?: string }
) {
  const userId = await getAuthUserId(ctx);
  const ticket = await ctx.db.get(args.ticket_id as any);
  if (!ticket) return { ticket: null, userId, authorized: false };

  if (userId) {
    if (ticket.user_id === userId) {
      return { ticket, userId, authorized: true };
    }

    const user = await ctx.db.get(userId);
    if (normalizeEmail(user?.email) && normalizeEmail(user?.email) === normalizeEmail(ticket.guest_email)) {
      return { ticket, userId, authorized: true };
    }
  }

  const guestEmail = normalizeEmail(args.guest_email);
  if (guestEmail && guestEmail === normalizeEmail(ticket.guest_email)) {
    return { ticket, userId, authorized: true };
  }

  return { ticket, userId, authorized: false };
}

export const createTicket = mutation({
  args: {
    subject: v.string(),
    guest_email: v.optional(v.string()),
    guest_phone: v.optional(v.string()),
    order_id: v.optional(v.id("orders")),
    message: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();
    const priority = "normal";
    const id = await ctx.db.insert("support_tickets", {
      user_id: (userId as any) ?? undefined,
      guest_email: normalizeEmail(args.guest_email) || undefined,
      guest_phone: args.guest_phone,
      order_id: args.order_id,
      subject: args.subject.trim(),
      status: STATUS.OPEN,
      priority,
      channel: args.channel ?? "web",
      assigned_to: undefined,
      first_response_at: undefined,
      resolved_at: undefined,
      sla_due_at: getSlaDueAt(now, priority),
      created_at: now,
      updated_at: now,
    });

    await ctx.db.insert("support_events", {
      ticket_id: id,
      type: "created",
      note: args.message.trim(),
      payload: {
        visibility: "customer",
      },
      actor_user_id: (userId as any) ?? undefined,
      created_at: now,
    });

    const ticket = await ctx.db.get(id);
    if (ticket) {
      await recordTimelineEvent(ctx, ticket, "support_ticket_created", {
        channel: ticket.channel,
        priority: ticket.priority,
      });
    }

    return id;
  },
});

export const listMine = query({
  args: {
    guest_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let rows: any[] = [];

    if (userId) {
      rows = await ctx.db
        .query("support_tickets")
        .withIndex("by_user", (q: any) => q.eq("user_id", userId))
        .collect();
    } else if (args.guest_email) {
      const guestEmail = normalizeEmail(args.guest_email);
      rows = (await ctx.db.query("support_tickets").collect()).filter(
        (ticket: any) => normalizeEmail(ticket.guest_email) === guestEmail
      );
    }

    const hydrated = [];
    for (const row of rows.sort((a: any, b: any) => b.updated_at - a.updated_at)) {
      hydrated.push(await hydrateTicket(ctx, row, { customerView: true }));
    }
    return hydrated;
  },
});

export const getTicketForUser = query({
  args: {
    ticket_id: v.id("support_tickets"),
    guest_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ticket, authorized } = await resolveTicketForViewer(ctx, args as any);
    if (!ticket || !authorized) return null;
    return await hydrateTicket(ctx, ticket, { customerView: true });
  },
});

export const addCustomerReply = mutation({
  args: {
    ticket_id: v.id("support_tickets"),
    message: v.string(),
    guest_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { ticket, userId, authorized } = await resolveTicketForViewer(ctx, args as any);
    if (!ticket || !authorized) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const shouldReopen =
      ticket.status === STATUS.WAITING_CUSTOMER || isResolvedStatus(ticket.status);

    const patch: Record<string, any> = {
      updated_at: now,
    };
    if (shouldReopen) {
      patch.status = STATUS.OPEN;
      patch.resolved_at = undefined;
      patch.sla_due_at = getSlaDueAt(now, ticket.priority);
    }

    await ctx.db.patch(ticket._id, patch);

    await ctx.db.insert("support_events", {
      ticket_id: ticket._id,
      type: "customer_reply",
      note: args.message.trim(),
      payload: {
        visibility: "customer",
        actor: userId ? "user" : "guest",
      },
      actor_user_id: userId ?? undefined,
      created_at: now,
    });

    const updatedTicket = await ctx.db.get(ticket._id);
    if (updatedTicket) {
      await recordTimelineEvent(ctx, updatedTicket, "support_reply_added", {
        reopened: shouldReopen,
      });
    }
  },
});

export const adminList = query({
  args: {
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigned_to: v.optional(v.id("users")),
    search: v.optional(v.string()),
    overdue_only: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "support.read");
    let rows: any[] = [];

    if (args.assigned_to) {
      rows = await ctx.db
        .query("support_tickets")
        .withIndex("by_assignee", (q: any) => q.eq("assigned_to", args.assigned_to))
        .collect();
    } else if (args.status) {
      rows = await ctx.db
        .query("support_tickets")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .collect();
    } else if (args.priority) {
      rows = await ctx.db
        .query("support_tickets")
        .withIndex("by_priority", (q: any) => q.eq("priority", args.priority))
        .collect();
    } else {
      rows = await ctx.db.query("support_tickets").collect();
    }

    if (args.status) {
      rows = rows.filter((row: any) => row.status === args.status);
    }
    if (args.priority) {
      rows = rows.filter((row: any) => row.priority === args.priority);
    }

    const hydrated = [];
    const limit = Math.min(400, Math.max(1, args.limit ?? 120));
    for (const row of rows.sort((a: any, b: any) => b.updated_at - a.updated_at)) {
      hydrated.push(await hydrateTicket(ctx, row));
    }

    const search = (args.search ?? "").trim().toLowerCase();
    const filtered = hydrated.filter((ticket: any) => {
      if (args.overdue_only && !ticket.sla_overdue) return false;
      if (!search) return true;

      const haystack = [
        ticket.subject,
        ticket.guest_email,
        ticket.guest_phone,
        ticket.user_email,
        ticket.assignee_email,
        ticket.order_number,
        ticket.status,
        ticket.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
    return filtered.slice(0, limit);
  },
});

export const adminQueueSummary = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "support.read");
    const rows = await ctx.db.query("support_tickets").collect();
    const now = Date.now();
    const summary = {
      total: rows.length,
      unresolved: 0,
      overdue: 0,
      unassigned: 0,
      by_status: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      first_response_median_minutes: null as number | null,
    };
    const firstResponses: number[] = [];

    for (const row of rows) {
      summary.by_status[row.status] = (summary.by_status[row.status] ?? 0) + 1;
      summary.by_priority[row.priority] = (summary.by_priority[row.priority] ?? 0) + 1;

      const unresolved = !isResolvedStatus(row.status);
      if (unresolved) summary.unresolved += 1;
      if (unresolved && !row.assigned_to) summary.unassigned += 1;
      if (unresolved && typeof row.sla_due_at === "number" && now > row.sla_due_at) {
        summary.overdue += 1;
      }
      if (typeof row.first_response_at === "number") {
        firstResponses.push(Math.max(0, Math.round((row.first_response_at - row.created_at) / 60000)));
      }
    }

    if (firstResponses.length > 0) {
      firstResponses.sort((a, b) => a - b);
      const middle = Math.floor(firstResponses.length / 2);
      summary.first_response_median_minutes =
        firstResponses.length % 2 === 0
          ? Math.round((firstResponses[middle - 1] + firstResponses[middle]) / 2)
          : firstResponses[middle];
    }

    return summary;
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("support_tickets"),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigned_to: v.optional(v.union(v.id("users"), v.null())),
    sla_due_at: v.optional(v.number()),
    note: v.optional(v.string()),
    note_visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "support.write");
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    const patch: any = { updated_at: now };
    let nextStatus = ticket.status;
    let nextPriority = ticket.priority;

    if (args.status !== undefined) {
      patch.status = args.status;
      nextStatus = args.status;
    }
    if (args.priority !== undefined) {
      patch.priority = args.priority;
      nextPriority = args.priority;
      if (!isResolvedStatus(nextStatus)) {
        patch.sla_due_at = getSlaDueAt(ticket.created_at, nextPriority);
      }
    }
    if (args.assigned_to !== undefined) {
      patch.assigned_to = args.assigned_to ?? undefined;
    }
    if (args.sla_due_at !== undefined) {
      patch.sla_due_at = args.sla_due_at;
    }

    const shouldMarkFirstResponse =
      !ticket.first_response_at && (args.note !== undefined || marksFirstResponse(nextStatus));
    if (shouldMarkFirstResponse) {
      patch.first_response_at = now;
    }

    if (isResolvedStatus(nextStatus)) {
      patch.resolved_at = ticket.resolved_at ?? now;
    } else if (ticket.resolved_at) {
      patch.resolved_at = undefined;
    }

    await ctx.db.patch(args.id, patch);

    const hasChange =
      args.note ||
      args.status !== undefined ||
      args.priority !== undefined ||
      args.assigned_to !== undefined ||
      args.sla_due_at !== undefined;

    if (hasChange) {
      await ctx.db.insert("support_events", {
        ticket_id: args.id,
        type: "updated",
        note: args.note,
        payload: {
          status: args.status,
          priority: args.priority,
          assigned_to: args.assigned_to,
          sla_due_at: args.sla_due_at,
          note_visibility: args.note_visibility ?? "internal",
        },
        actor_user_id: userId,
        created_at: now,
      });
    }

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "support.ticket.updated",
      entity_type: "support_ticket",
      entity_id: String(args.id),
      before: ticket,
      after,
      meta: {
        note_visibility: args.note_visibility ?? "internal",
      },
    });

    if (after) {
      await recordTimelineEvent(ctx, after, "support_ticket_updated", {
        status: after.status,
        priority: after.priority,
      });
    }
  },
});

export const adminAddNote = mutation({
  args: {
    id: v.id("support_tickets"),
    note: v.string(),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "support.write");
    const ticket = await ctx.db.get(args.id);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    const visibility = args.visibility ?? "internal";
    const patch: Record<string, any> = { updated_at: now };
    if (!ticket.first_response_at) {
      patch.first_response_at = now;
    }
    await ctx.db.patch(args.id, patch);

    await ctx.db.insert("support_events", {
      ticket_id: args.id,
      type: visibility === "customer" ? "customer_note" : "internal_note",
      note: args.note.trim(),
      payload: {
        visibility,
      },
      actor_user_id: userId,
      created_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "support.ticket.note_added",
      entity_type: "support_ticket",
      entity_id: String(args.id),
      meta: {
        visibility,
        note: args.note.trim(),
      },
    });

    const after = await ctx.db.get(args.id);
    if (after && visibility === "customer") {
      await recordTimelineEvent(ctx, after, "support_note_shared", {
        visibility,
      });
    }
  },
});
