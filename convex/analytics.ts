import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePermission } from "./lib/auth";

export const track = mutation({
  args: {
    name: v.string(),
    guest_token: v.optional(v.string()),
    session_id: v.optional(v.string()),
    path: v.optional(v.string()),
    referrer: v.optional(v.string()),
    properties: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("analytics_events", {
      name: args.name,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      session_id: args.session_id,
      path: args.path,
      referrer: args.referrer,
      properties: args.properties,
      created_at: now,
    });

    await ctx.db.insert("customer_timeline_events", {
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      event_type: args.name,
      source: "analytics",
      entity_type: "analytics_event",
      entity_id: id,
      payload: args.properties,
      created_at: now,
    });

    return id;
  },
});

export const listForCustomer = query({
  args: {
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(200, Math.max(1, args.limit ?? 50));
    let rows: any[] = [];
    if (args.user_id) {
      rows = await ctx.db
        .query("analytics_events")
        .withIndex("by_user", (q: any) => q.eq("user_id", args.user_id))
        .collect();
    } else if (args.guest_token) {
      rows = await ctx.db
        .query("analytics_events")
        .withIndex("by_guest", (q: any) => q.eq("guest_token", args.guest_token))
        .collect();
    }
    return rows.sort((a: any, b: any) => b.created_at - a.created_at).slice(0, limit);
  },
});

export const adminSummary = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "analytics.read");
    const from = args.from ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const to = args.to ?? Date.now();
    const events = await ctx.db.query("analytics_events").withIndex("by_created").collect();
    const filtered = events.filter((event: any) => event.created_at >= from && event.created_at <= to);

    const counts: Record<string, number> = {};
    for (const event of filtered) {
      counts[event.name] = (counts[event.name] ?? 0) + 1;
    }

    return {
      from,
      to,
      total: filtered.length,
      byEvent: counts,
    };
  },
});

export const adminDashboard = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "analytics.read");
    const from = args.from ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const to = args.to ?? Date.now();
    const events = await ctx.db.query("analytics_events").withIndex("by_created").collect();
    const filtered = events.filter((event: any) => event.created_at >= from && event.created_at <= to);

    const dayBuckets: Record<string, number> = {};
    const pathCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};
    const funnel: Record<string, number> = {
      product_viewed: 0,
      cart_item_added: 0,
      checkout_started: 0,
      checkout_completed: 0,
    };

    for (const event of filtered) {
      const day = new Date(event.created_at).toISOString().slice(0, 10);
      dayBuckets[day] = (dayBuckets[day] ?? 0) + 1;

      if (event.path) {
        pathCounts[event.path] = (pathCounts[event.path] ?? 0) + 1;
      }
      if (event.referrer) {
        referrerCounts[event.referrer] = (referrerCounts[event.referrer] ?? 0) + 1;
      }
      if (event.name in funnel) {
        funnel[event.name] = (funnel[event.name] ?? 0) + 1;
      }
    }

    const top_paths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
    const top_referrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));
    const daily_events = Object.entries(dayBuckets)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }));

    const checkoutStarted = funnel.checkout_started || 0;
    const checkoutCompleted = funnel.checkout_completed || 0;
    const checkout_completion_rate =
      checkoutStarted > 0 ? Number(((checkoutCompleted / checkoutStarted) * 100).toFixed(2)) : 0;

    return {
      from,
      to,
      total_events: filtered.length,
      daily_events,
      top_paths,
      top_referrers,
      funnel,
      checkout_completion_rate,
    };
  },
});
