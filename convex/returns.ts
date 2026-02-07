import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePermission } from "./lib/auth";

function canGuestAccess(order: any, guestEmail?: string) {
  if (!guestEmail) return false;
  return (order.contact_email ?? "").toLowerCase() === guestEmail.trim().toLowerCase();
}

async function hydrateReturn(ctx: any, ret: any) {
  const items = await ctx.db
    .query("return_items")
    .withIndex("by_return", (q: any) => q.eq("return_id", ret._id))
    .collect();
  const events = await ctx.db
    .query("return_events")
    .withIndex("by_return", (q: any) => q.eq("return_id", ret._id))
    .collect();
  const order = await ctx.db.get(ret.order_id);
  return {
    ...ret,
    order,
    items,
    events: events.sort((a: any, b: any) => a.created_at - b.created_at),
  };
}

export const requestReturn = mutation({
  args: {
    order_id: v.id("orders"),
    guest_email: v.optional(v.string()),
    reason: v.optional(v.string()),
    resolution: v.string(),
    items: v.array(
      v.object({
        order_item_id: v.id("order_items"),
        quantity: v.number(),
        condition: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const order = await ctx.db.get(args.order_id);
    if (!order) throw new Error("Order not found");

    const isOwner = userId && order.user_id === userId;
    const isGuestOwner = canGuestAccess(order, args.guest_email);
    if (!isOwner && !isGuestOwner) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const returnId = await ctx.db.insert("returns", {
      order_id: args.order_id,
      user_id: (userId as any) ?? undefined,
      guest_email: args.guest_email,
      status: "requested",
      reason: args.reason,
      resolution: args.resolution,
      requested_at: now,
      approved_at: undefined,
      completed_at: undefined,
      created_at: now,
      updated_at: now,
    });

    for (const item of args.items) {
      const orderItem = await ctx.db.get(item.order_item_id);
      if (!orderItem || orderItem.order_id !== args.order_id) {
        throw new Error("Invalid return item");
      }
      const qty = Math.max(1, Math.min(item.quantity, orderItem.quantity));
      await ctx.db.insert("return_items", {
        return_id: returnId,
        order_item_id: item.order_item_id,
        quantity: qty,
        condition: item.condition,
        action: args.resolution,
        refund_amount:
          args.resolution === "refund" ? orderItem.unit_price * qty : undefined,
        created_at: now,
        updated_at: now,
      });
    }

    await ctx.db.insert("return_events", {
      return_id: returnId,
      status: "requested",
      note: args.reason,
      actor_user_id: (userId as any) ?? undefined,
      created_at: now,
    });

    await ctx.db.insert("order_status_events", {
      order_id: args.order_id,
      status: order.status,
      note: "Return requested",
      created_at: now,
      created_by: (userId as any) ?? undefined,
    });

    return returnId;
  },
});

export const listForUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const returns = await ctx.db
      .query("returns")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();
    const rows = [];
    for (const ret of returns.sort((a: any, b: any) => b.created_at - a.created_at)) {
      rows.push(await hydrateReturn(ctx, ret));
    }
    return rows;
  },
});

export const getByIdForUser = query({
  args: {
    id: v.id("returns"),
    guest_email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const ret = await ctx.db.get(args.id);
    if (!ret) return null;

    if (userId && ret.user_id === userId) {
      return await hydrateReturn(ctx, ret);
    }
    if (ret.guest_email && args.guest_email) {
      if (ret.guest_email.toLowerCase() === args.guest_email.trim().toLowerCase()) {
        return await hydrateReturn(ctx, ret);
      }
    }
    return null;
  },
});

export const adminList = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "returns.read");
    const returns = await ctx.db
      .query("returns")
      .withIndex("by_requested")
      .collect();
    const rows = [];
    for (const ret of returns.sort((a: any, b: any) => b.requested_at - a.requested_at)) {
      rows.push(await hydrateReturn(ctx, ret));
    }
    return rows;
  },
});

export const approveReturn = mutation({
  args: {
    id: v.id("returns"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "returns.write");
    const ret = await ctx.db.get(args.id);
    if (!ret) throw new Error("Return not found");
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "approved",
      approved_at: now,
      updated_at: now,
    });
    await ctx.db.insert("return_events", {
      return_id: args.id,
      status: "approved",
      note: args.note,
      actor_user_id: userId,
      created_at: now,
    });
  },
});

export const receiveReturn = mutation({
  args: {
    id: v.id("returns"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "returns.write");
    const ret = await ctx.db.get(args.id);
    if (!ret) throw new Error("Return not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "received",
      updated_at: now,
    });
    await ctx.db.insert("return_events", {
      return_id: args.id,
      status: "received",
      note: args.note,
      actor_user_id: userId,
      created_at: now,
    });
  },
});

export const issueRefund = mutation({
  args: {
    id: v.id("returns"),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "returns.write");
    const ret = await ctx.db.get(args.id);
    if (!ret) throw new Error("Return not found");
    const order = await ctx.db.get(ret.order_id);
    if (!order) throw new Error("Order not found");

    const now = Date.now();
    await ctx.db.insert("refunds", {
      order_id: ret.order_id,
      payment_intent_id: undefined,
      amount: args.amount,
      currency: order.currency ?? "PKR",
      reason: args.reason ?? "Return refund",
      status: "processed",
      provider_refund_id: undefined,
      created_at: now,
      updated_at: now,
    });

    await ctx.db.patch(args.id, {
      status: "refunded",
      completed_at: now,
      updated_at: now,
    });

    await ctx.db.insert("return_events", {
      return_id: args.id,
      status: "refunded",
      note: args.reason ?? `Refund issued: ${args.amount}`,
      actor_user_id: userId,
      created_at: now,
    });

    await ctx.db.insert("order_status_events", {
      order_id: ret.order_id,
      status: order.status,
      note: "Refund issued",
      created_at: now,
      created_by: userId,
    });
  },
});
