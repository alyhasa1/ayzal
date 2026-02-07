import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./lib/auth";
import { getAuthUserId } from "@convex-dev/auth/server";
import { recordAudit } from "./lib/audit";
import { canDeleteOrdersForRole, normalizeAdminRole } from "./lib/orderDeleteAccess";

const STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function generateOrderNumber(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AYZ-${yy}${mm}${dd}-${suffix}`;
}

function assertStatus(value: string) {
  if (!STATUS.includes(value)) {
    throw new Error("Invalid status");
  }
}

async function attachOrderDetails(ctx: any, order: any) {
  const items = await ctx.db
    .query("order_items")
    .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
    .collect();
  const events = await ctx.db
    .query("order_status_events")
    .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
    .collect();
  const paymentMethod = await ctx.db.get(order.payment_method_id);
  return {
    ...order,
    items,
    status_events: events.sort((a: any, b: any) => a.created_at - b.created_at),
    payment_method: paymentMethod,
  };
}

async function getDeleteAccess(ctx: any, adminRole?: string) {
  const adminRows = await ctx.db.query("admin_users").collect();
  return canDeleteOrdersForRole(
    adminRole,
    adminRows.map((row: any) => row.role)
  );
}

async function requireOrderDeleteAccess(ctx: any) {
  const admin = await requireAdmin(ctx);
  const access = await getDeleteAccess(ctx, admin.adminRole);
  if (!access.allowed) {
    throw new Error(access.reason ?? "Forbidden");
  }
  return admin;
}

async function deleteRowsByOrderIndex(ctx: any, table: string, orderId: any) {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_order", (q: any) => q.eq("order_id", orderId))
    .collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
  return rows.length;
}

async function deleteOrderGraph(ctx: any, orderId: any) {
  const order = await ctx.db.get(orderId);
  if (!order) {
    return null;
  }

  const cleanup: Record<string, number> = {};

  cleanup.order_items = await deleteRowsByOrderIndex(ctx, "order_items", orderId);
  cleanup.order_status_events = await deleteRowsByOrderIndex(
    ctx,
    "order_status_events",
    orderId
  );
  cleanup.order_tracking_otps = await deleteRowsByOrderIndex(
    ctx,
    "order_tracking_otps",
    orderId
  );
  cleanup.order_tracking_sessions = await deleteRowsByOrderIndex(
    ctx,
    "order_tracking_sessions",
    orderId
  );
  cleanup.discount_redemptions = await deleteRowsByOrderIndex(
    ctx,
    "discount_redemptions",
    orderId
  );
  cleanup.gift_card_transactions = await deleteRowsByOrderIndex(
    ctx,
    "gift_card_transactions",
    orderId
  );
  cleanup.payment_events = await deleteRowsByOrderIndex(ctx, "payment_events", orderId);
  cleanup.payment_intents = await deleteRowsByOrderIndex(ctx, "payment_intents", orderId);
  cleanup.refunds = await deleteRowsByOrderIndex(ctx, "refunds", orderId);
  cleanup.stock_reservations = await deleteRowsByOrderIndex(
    ctx,
    "stock_reservations",
    orderId
  );
  cleanup.shipment_events = await deleteRowsByOrderIndex(ctx, "shipment_events", orderId);

  const shipments = await ctx.db
    .query("shipments")
    .withIndex("by_order", (q: any) => q.eq("order_id", orderId))
    .collect();
  for (const shipment of shipments) {
    await ctx.db.delete(shipment._id);
  }
  cleanup.shipments = shipments.length;

  const returns = await ctx.db
    .query("returns")
    .withIndex("by_order", (q: any) => q.eq("order_id", orderId))
    .collect();
  let returnItemsDeleted = 0;
  let returnEventsDeleted = 0;
  for (const ret of returns) {
    const items = await ctx.db
      .query("return_items")
      .withIndex("by_return", (q: any) => q.eq("return_id", ret._id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    returnItemsDeleted += items.length;

    const events = await ctx.db
      .query("return_events")
      .withIndex("by_return", (q: any) => q.eq("return_id", ret._id))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    returnEventsDeleted += events.length;

    await ctx.db.delete(ret._id);
  }
  cleanup.returns = returns.length;
  cleanup.return_items = returnItemsDeleted;
  cleanup.return_events = returnEventsDeleted;

  const supportTickets = await ctx.db
    .query("support_tickets")
    .withIndex("by_order", (q: any) => q.eq("order_id", orderId))
    .collect();
  let supportEventsDeleted = 0;
  for (const ticket of supportTickets) {
    const events = await ctx.db
      .query("support_events")
      .withIndex("by_ticket", (q: any) => q.eq("ticket_id", ticket._id))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    supportEventsDeleted += events.length;
    await ctx.db.delete(ticket._id);
  }
  cleanup.support_tickets = supportTickets.length;
  cleanup.support_events = supportEventsDeleted;

  await ctx.db.delete(orderId);

  return {
    order,
    cleanup,
  };
}

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        product_id: v.id("products"),
        quantity: v.number(),
      })
    ),
    payment_method_id: v.id("payment_methods"),
    shipping_address: v.any(),
    contact_email: v.string(),
    contact_phone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const paymentMethod = await ctx.db.get(args.payment_method_id);
    if (!paymentMethod || !paymentMethod.active) {
      throw new Error("Payment method is not available");
    }

    let subtotal = 0;
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      user_id: userId,
      guest_token: undefined,
      order_number: generateOrderNumber(now),
      status: "pending",
      payment_method_id: args.payment_method_id,
      subtotal: 0,
      total: 0,
      currency: "PKR",
      shipping_address: args.shipping_address,
      contact_email: args.contact_email,
      contact_phone: args.contact_phone,
      created_at: now,
      updated_at: now,
    });

    for (const item of args.items) {
      const product = await ctx.db.get(item.product_id);
      if (!product) {
        throw new Error("Product not found");
      }
      const links = await ctx.db
        .query("product_payment_methods")
        .withIndex("by_product", (q: any) => q.eq("product_id", product._id))
        .collect();
      if (links.length > 0) {
        const allowed = links.some((link: any) => link.payment_method_id === args.payment_method_id);
        if (!allowed) {
          throw new Error("Selected payment method is not allowed for all items");
        }
      }
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      await ctx.db.insert("order_items", {
        order_id: orderId,
        product_id: product._id,
        product_name: product.name,
        product_image_url: product.primary_image_url,
        unit_price: product.price,
        quantity: item.quantity,
        line_total: lineTotal,
      });
    }

    await ctx.db.patch(orderId, {
      subtotal,
      total: subtotal,
      updated_at: Date.now(),
    });

    await ctx.db.insert("order_status_events", {
      order_id: orderId,
      status: "pending",
      created_at: Date.now(),
      created_by: userId,
    });

    return orderId;
  },
});

export const listForUser = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    const results = [];
    for (const order of orders.sort((a: any, b: any) => b.created_at - a.created_at)) {
      results.push(await attachOrderDetails(ctx, order));
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    if (order.user_id !== userId) {
      throw new Error("Unauthorized");
    }
    return await attachOrderDetails(ctx, order);
  },
});

export const getByOrderNumber = query({
  args: {
    order_number: v.string(),
    guest_token: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q: any) => q.eq("order_number", args.order_number))
      .unique();
    if (!order) return null;

    const emailMatch =
      args.contact_email &&
      order.contact_email.toLowerCase() === args.contact_email.trim().toLowerCase();
    const phoneMatch =
      args.contact_phone &&
      order.contact_phone.trim() === args.contact_phone.trim();
    const canAccess =
      (authUserId && order.user_id === authUserId) ||
      (args.guest_token && order.guest_token === args.guest_token) ||
      emailMatch ||
      phoneMatch;

    if (!canAccess) {
      return null;
    }

    return await attachOrderDetails(ctx, order);
  },
});

function normalizeEmail(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

export const claimGuestOrder = mutation({
  args: {
    order_id: v.id("orders"),
    guest_token: v.optional(v.string()),
    contact_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    const accountEmail = normalizeEmail(user?.email);
    if (!accountEmail) {
      throw new Error("Account email is required");
    }

    const providedEmail = normalizeEmail(args.contact_email);
    if (providedEmail && providedEmail !== accountEmail) {
      throw new Error("Checkout email does not match the signed-in account");
    }

    const order = await ctx.db.get(args.order_id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.user_id && order.user_id !== userId) {
      throw new Error("Order already belongs to another account");
    }

    if (order.user_id === userId) {
      return { claimed: false, order_id: order._id };
    }

    const orderEmail = normalizeEmail(order.contact_email);
    if (orderEmail !== accountEmail) {
      throw new Error("Order email does not match the signed-in account");
    }

    if (args.guest_token && order.guest_token && order.guest_token !== args.guest_token) {
      throw new Error("Session token does not match this order");
    }

    await ctx.db.patch(order._id, {
      user_id: userId,
      updated_at: Date.now(),
    });

    return { claimed: true, order_id: order._id };
  },
});

export const adminGetById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    return await attachOrderDetails(ctx, order);
  },
});

export const listAll = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("orders").withIndex("by_created").collect();
    const results = [];
    for (const order of orders.sort((a: any, b: any) => b.created_at - a.created_at)) {
      results.push(await attachOrderDetails(ctx, order));
    }
    return results;
  },
});

export const adminDeleteAccess = query({
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const access = await getDeleteAccess(ctx, admin.adminRole);
    return {
      allowed: access.allowed,
      reason: access.reason,
      current_role: normalizeAdminRole(admin.adminRole),
      highest_configured_role: access.highestConfiguredRole,
      requires_privileged_role: access.requiresPrivilegedRole,
    };
  },
});

export const adminDelete = mutation({
  args: {
    id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requireOrderDeleteAccess(ctx);
    const deleted = await deleteOrderGraph(ctx, args.id);
    if (!deleted) {
      return {
        deleted: false,
      };
    }

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "orders.deleted",
      entity_type: "order",
      entity_id: String(args.id),
      before: deleted.order,
      meta: {
        cleanup: deleted.cleanup,
      },
    });

    return {
      deleted: true,
      order_number: deleted.order.order_number,
      cleanup: deleted.cleanup,
    };
  },
});

export const adminDeleteMany = mutation({
  args: {
    ids: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requireOrderDeleteAccess(ctx);

    const uniqueIds: any[] = [];
    const seen = new Set<string>();
    for (const id of args.ids) {
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueIds.push(id);
    }

    if (uniqueIds.length > 50) {
      throw new Error("Delete up to 50 orders at a time.");
    }

    let deleted = 0;
    let missing = 0;
    const orderNumbers: string[] = [];

    for (const id of uniqueIds) {
      const removed = await deleteOrderGraph(ctx, id);
      if (!removed) {
        missing += 1;
        continue;
      }

      deleted += 1;
      if (removed.order.order_number) {
        orderNumbers.push(removed.order.order_number);
      }

      await recordAudit(ctx, {
        actor_user_id: userId,
        actor_email: email,
        action: "orders.deleted",
        entity_type: "order",
        entity_id: String(id),
        before: removed.order,
        meta: {
          cleanup: removed.cleanup,
          bulk: true,
        },
      });
    }

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "orders.deleted.bulk",
      entity_type: "order",
      after: {
        deleted,
        missing,
        order_numbers: orderNumbers,
      },
    });

    return {
      deleted,
      missing,
      requested: uniqueIds.length,
      order_numbers: orderNumbers,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    assertStatus(args.status);
    await ctx.db.patch(args.id, {
      status: args.status,
      updated_at: Date.now(),
    });
    await ctx.db.insert("order_status_events", {
      order_id: args.id,
      status: args.status,
      note: args.note,
      created_at: Date.now(),
      created_by: userId,
    });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("orders"),
    status: v.optional(v.string()),
    note: v.optional(v.string()),
    tracking_carrier: v.optional(v.string()),
    tracking_number: v.optional(v.string()),
    tracking_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) return;

    if (args.status !== undefined) {
      assertStatus(args.status);
    }

    const update: any = { updated_at: Date.now() };
    if (args.status !== undefined) update.status = args.status;
    if (args.tracking_carrier !== undefined) update.tracking_carrier = args.tracking_carrier;
    if (args.tracking_number !== undefined) update.tracking_number = args.tracking_number;
    if (args.tracking_url !== undefined) update.tracking_url = args.tracking_url;

    await ctx.db.patch(args.id, update);

    const hasTrackingChange =
      args.tracking_carrier !== undefined ||
      args.tracking_number !== undefined ||
      args.tracking_url !== undefined;

    const statusForEvent = args.status ?? order.status;
    const noteForEvent =
      args.note ??
      (hasTrackingChange
        ? `Tracking updated${args.tracking_number ? `: ${args.tracking_number}` : ""}`
        : undefined);

    if (args.status !== undefined || args.note !== undefined || hasTrackingChange) {
      await ctx.db.insert("order_status_events", {
        order_id: args.id,
        status: statusForEvent,
        note: noteForEvent,
        created_at: Date.now(),
        created_by: userId,
      });
    }
  },
});
