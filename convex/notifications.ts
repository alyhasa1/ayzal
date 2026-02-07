import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission, requireUser } from "./lib/auth";
import { recordAudit } from "./lib/audit";

function buildDefaultPreferences(userId: string, timestamp = 0) {
  return {
    user_id: userId as any,
    email_marketing: false,
    email_order_updates: true,
    email_review_requests: true,
    whatsapp_marketing: false,
    whatsapp_order_updates: true,
    whatsapp_review_requests: false,
    timezone: undefined,
    quiet_hours_start: undefined,
    quiet_hours_end: undefined,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

async function hydrateJobs(ctx: any, rows: any[]) {
  const templateIds = [...new Set(rows.map((row) => String(row.template_id)).filter(Boolean))];
  const userIds = [...new Set(rows.map((row) => String(row.user_id)).filter(Boolean))];
  const runIds = [...new Set(rows.map((row) => String(row.campaign_run_id)).filter(Boolean))];

  const templateById = new Map<string, any>();
  for (const id of templateIds) {
    const template = await ctx.db.get(id);
    if (template) templateById.set(id, template);
  }

  const userById = new Map<string, any>();
  for (const id of userIds) {
    const user = await ctx.db.get(id);
    if (user) userById.set(id, user);
  }

  const runById = new Map<string, any>();
  for (const id of runIds) {
    const run = await ctx.db.get(id);
    if (run) runById.set(id, run);
  }

  const campaignIds = [
    ...new Set(
      [...runById.values()]
        .map((run) => String(run.campaign_id))
        .filter(Boolean)
    ),
  ];
  const campaignById = new Map<string, any>();
  for (const id of campaignIds) {
    const campaign = await ctx.db.get(id);
    if (campaign) campaignById.set(id, campaign);
  }

  const hydrated = [];
  for (const row of rows) {
    const template = row.template_id ? templateById.get(String(row.template_id)) : null;
    const user = row.user_id ? userById.get(String(row.user_id)) : null;
    const run = row.campaign_run_id ? runById.get(String(row.campaign_run_id)) : null;
    const campaign = run ? campaignById.get(String(run.campaign_id)) : null;
    const logs = await ctx.db
      .query("notification_logs")
      .withIndex("by_job", (q: any) => q.eq("job_id", row._id))
      .collect();
    const sortedLogs = logs.sort((a: any, b: any) => b.created_at - a.created_at);
    const latestLog = sortedLogs[0];

    hydrated.push({
      ...row,
      user_email: user?.email,
      recipient: row.guest_contact || user?.email || "unknown recipient",
      template_name: template?.name,
      template_key: template?.key,
      campaign_name: campaign?.name,
      latest_event: latestLog?.event,
      latest_event_at: latestLog?.created_at,
      logs_count: logs.length,
    });
  }

  return hydrated;
}

export const getMine = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("notification_preferences")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .unique();

    if (existing) {
      return { ...existing, exists: true };
    }

    return {
      ...buildDefaultPreferences(userId),
      exists: false,
    };
  },
});

export const updateMine = mutation({
  args: {
    email_marketing: v.optional(v.boolean()),
    email_order_updates: v.optional(v.boolean()),
    email_review_requests: v.optional(v.boolean()),
    whatsapp_marketing: v.optional(v.boolean()),
    whatsapp_order_updates: v.optional(v.boolean()),
    whatsapp_review_requests: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    quiet_hours_start: v.optional(v.string()),
    quiet_hours_end: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("notification_preferences")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .unique();
    const now = Date.now();

    const patch: Record<string, any> = {
      updated_at: now,
    };
    for (const key of [
      "email_marketing",
      "email_order_updates",
      "email_review_requests",
      "whatsapp_marketing",
      "whatsapp_order_updates",
      "whatsapp_review_requests",
    ]) {
      const value = (args as any)[key];
      if (value !== undefined) patch[key] = value;
    }
    if (args.timezone !== undefined) {
      patch.timezone = args.timezone.trim() || undefined;
    }
    if (args.quiet_hours_start !== undefined) {
      patch.quiet_hours_start = args.quiet_hours_start.trim() || undefined;
    }
    if (args.quiet_hours_end !== undefined) {
      patch.quiet_hours_end = args.quiet_hours_end.trim() || undefined;
    }

    if (!existing) {
      const defaults = buildDefaultPreferences(userId, now);
      return await ctx.db.insert("notification_preferences", {
        ...defaults,
        ...patch,
      });
    }

    await ctx.db.patch(existing._id, patch);
    return existing._id;
  },
});

export const listMyActivity = query({
  args: {
    channel: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const limit = Math.min(200, Math.max(1, args.limit ?? 40));
    const rows = await ctx.db
      .query("notification_jobs")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();

    let filtered = rows;
    if (args.channel) {
      filtered = filtered.filter((row: any) => row.channel === args.channel);
    }
    if (args.status) {
      filtered = filtered.filter((row: any) => row.status === args.status);
    }

    const sorted = filtered.sort((a: any, b: any) => b.updated_at - a.updated_at).slice(0, limit);
    return await hydrateJobs(ctx, sorted);
  },
});

export const adminDeliveryOverview = query({
  args: {
    run_id: v.optional(v.id("campaign_runs")),
    channel: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "notifications.read");
    const limit = Math.min(500, Math.max(1, args.limit ?? 120));
    let rows: any[] = [];

    if (args.run_id) {
      rows = await ctx.db
        .query("notification_jobs")
        .withIndex("by_campaign_run", (q: any) => q.eq("campaign_run_id", args.run_id))
        .collect();
    } else if (args.status) {
      rows = await ctx.db
        .query("notification_jobs")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .collect();
    } else if (args.channel) {
      rows = await ctx.db
        .query("notification_jobs")
        .withIndex("by_channel", (q: any) => q.eq("channel", args.channel))
        .collect();
    } else {
      rows = await ctx.db.query("notification_jobs").collect();
    }

    if (args.channel) {
      rows = rows.filter((row: any) => row.channel === args.channel);
    }
    if (args.status) {
      rows = rows.filter((row: any) => row.status === args.status);
    }

    const hydrated = await hydrateJobs(
      ctx,
      rows.sort((a: any, b: any) => b.updated_at - a.updated_at).slice(0, limit * 2)
    );
    const search = (args.search ?? "").trim().toLowerCase();
    const filtered = search
      ? hydrated.filter((row: any) => {
          const haystack = [
            row.recipient,
            row.user_email,
            row.guest_contact,
            row.template_name,
            row.template_key,
            row.campaign_name,
            row.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(search);
        })
      : hydrated;

    return filtered.slice(0, limit);
  },
});

export const adminListJobLogs = query({
  args: {
    job_id: v.id("notification_jobs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "notifications.read");
    const limit = Math.min(200, Math.max(1, args.limit ?? 40));
    const rows = await ctx.db
      .query("notification_logs")
      .withIndex("by_job", (q: any) => q.eq("job_id", args.job_id))
      .collect();
    return rows.sort((a: any, b: any) => b.created_at - a.created_at).slice(0, limit);
  },
});

export const adminUpdateJobStatus = mutation({
  args: {
    job_id: v.id("notification_jobs"),
    status: v.string(),
    event: v.optional(v.string()),
    provider_message_id: v.optional(v.string()),
    provider_payload: v.optional(v.any()),
    next_attempt_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "notifications.write");
    const job = await ctx.db.get(args.job_id);
    if (!job) throw new Error("Notification job not found");

    const now = Date.now();
    await ctx.db.patch(args.job_id, {
      status: args.status,
      provider_message_id: args.provider_message_id ?? job.provider_message_id,
      next_attempt_at: args.next_attempt_at ?? job.next_attempt_at,
      updated_at: now,
    });

    await ctx.db.insert("notification_logs", {
      job_id: args.job_id,
      template_id: job.template_id,
      channel: job.channel,
      event: args.event ?? `admin_${args.status}`,
      provider_payload: {
        ...(args.provider_payload ?? {}),
        actor_email: email,
      },
      created_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "notification.job.status_updated",
      entity_type: "notification_job",
      entity_id: String(args.job_id),
      before: job,
      after: {
        status: args.status,
        provider_message_id: args.provider_message_id ?? job.provider_message_id,
        next_attempt_at: args.next_attempt_at ?? job.next_attempt_at,
      },
    });
  },
});

export const adminRetryJob = mutation({
  args: {
    job_id: v.id("notification_jobs"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "notifications.write");
    const job = await ctx.db.get(args.job_id);
    if (!job) throw new Error("Notification job not found");

    const now = Date.now();
    await ctx.db.patch(args.job_id, {
      status: "queued",
      retries: (job.retries ?? 0) + 1,
      next_attempt_at: now,
      updated_at: now,
    });

    await ctx.db.insert("notification_logs", {
      job_id: args.job_id,
      template_id: job.template_id,
      channel: job.channel,
      event: "admin_requeued",
      provider_payload: {
        actor_email: email,
        note: args.note,
      },
      created_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "notification.job.requeued",
      entity_type: "notification_job",
      entity_id: String(args.job_id),
      before: job,
      after: {
        status: "queued",
        retries: (job.retries ?? 0) + 1,
        next_attempt_at: now,
      },
    });
  },
});
