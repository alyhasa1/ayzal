import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireAdmin } from "./lib/auth";

export const adminListAll = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const results = [];
    for (const user of users) {
      const profile = await ctx.db
        .query("user_profiles")
        .withIndex("by_user", (q) => q.eq("user_id", user._id))
        .unique();
      const orders = await ctx.db
        .query("orders")
        .withIndex("by_user", (q) => q.eq("user_id", user._id))
        .collect();
      const totalSpent = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
      const lastOrder = orders.length > 0
        ? Math.max(...orders.map((o) => o.created_at))
        : null;
      results.push({
        _id: user._id,
        email: user.email ?? "",
        name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        orderCount: orders.length,
        totalSpent,
        lastOrderAt: lastOrder,
        createdAt: user._creationTime,
      });
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const adminGetById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .unique();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    const enrichedOrders = [];
    for (const order of orders.sort((a: any, b: any) => b.created_at - a.created_at)) {
      const items = await ctx.db
        .query("order_items")
        .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
        .collect();
      const events = await ctx.db
        .query("order_status_events")
        .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
        .collect();
      const paymentMethod = await ctx.db.get(order.payment_method_id);
      enrichedOrders.push({
        ...order,
        items,
        status_events: events.sort((a: any, b: any) => a.created_at - b.created_at),
        payment_method: paymentMethod,
      });
    }

    const totalSpent = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

    return {
      _id: user._id,
      email: user.email ?? "",
      createdAt: user._creationTime,
      name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      shippingAddress: profile?.shipping_address ?? null,
      orders: enrichedOrders,
      orderCount: orders.length,
      totalSpent,
    };
  },
});

export const get = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    full_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    shipping_address: v.optional(
      v.object({
        line1: v.optional(v.string()),
        line2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique();
    const now = Date.now();
    if (!existing) {
      return await ctx.db.insert("user_profiles", {
        user_id: userId,
        full_name: args.full_name,
        phone: args.phone,
        shipping_address: args.shipping_address,
        updated_at: now,
      });
    }
    await ctx.db.patch(existing._id, {
      full_name: args.full_name ?? existing.full_name,
      phone: args.phone ?? existing.phone,
      shipping_address: args.shipping_address ?? existing.shipping_address,
      updated_at: now,
    });
  },
});
