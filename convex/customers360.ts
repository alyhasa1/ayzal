import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

async function hydrateOrders(ctx: any, userId: any) {
  const orders = await ctx.db
    .query("orders")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .collect();
  const rows = [];
  for (const order of orders.sort((a: any, b: any) => b.created_at - a.created_at)) {
    const items = await ctx.db
      .query("order_items")
      .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
      .collect();
    const events = await ctx.db
      .query("order_status_events")
      .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
      .collect();
    rows.push({
      ...order,
      items,
      events: events.sort((a: any, b: any) => a.created_at - b.created_at),
    });
  }
  return rows;
}

async function hydrateSegments(ctx: any, memberships: any[]) {
  const hydrated = [];
  for (const membership of memberships.sort((a: any, b: any) => b.updated_at - a.updated_at)) {
    const segment = await ctx.db.get(membership.segment_id);
    hydrated.push({
      ...membership,
      segment_name: segment?.name ?? "",
      segment_key: segment?.key ?? "",
      segment_active: segment?.active ?? false,
    });
  }
  return hydrated;
}

function buildNotificationSummary(jobs: any[]) {
  const byStatus: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  let lastAt: number | null = null;
  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    byChannel[job.channel] = (byChannel[job.channel] ?? 0) + 1;
    if (lastAt === null || job.updated_at > lastAt) {
      lastAt = job.updated_at;
    }
  }
  return {
    total: jobs.length,
    by_status: byStatus,
    by_channel: byChannel,
    last_notification_at: lastAt,
  };
}

export const get = query({
  args: {
    user_id: v.optional(v.id("users")),
    email: v.optional(v.string()),
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let user: any = null;
    if (args.user_id) {
      user = await ctx.db.get(args.user_id);
    } else if (args.email) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(
        (candidate: any) =>
          (candidate.email ?? "").toLowerCase() === args.email!.trim().toLowerCase()
      );
    }

    if (user) {
      const profile = await ctx.db
        .query("user_profiles")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .unique();
      const orders = await hydrateOrders(ctx, user._id);
      const returns = await ctx.db
        .query("returns")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const tickets = await ctx.db
        .query("support_tickets")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const timeline = await ctx.db
        .query("customer_timeline_events")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const analytics = await ctx.db
        .query("analytics_events")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const memberships = await ctx.db
        .query("segment_memberships")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const segments = await hydrateSegments(ctx, memberships);
      const notification_preferences = await ctx.db
        .query("notification_preferences")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .unique();
      const notification_jobs = await ctx.db
        .query("notification_jobs")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      const notification_summary = buildNotificationSummary(notification_jobs);

      return {
        user,
        profile,
        orders,
        returns: returns.sort((a: any, b: any) => b.created_at - a.created_at),
        tickets: tickets.sort((a: any, b: any) => b.created_at - a.created_at),
        timeline: timeline.sort((a: any, b: any) => b.created_at - a.created_at),
        analytics: analytics.sort((a: any, b: any) => b.created_at - a.created_at),
        segments,
        notification_preferences,
        notification_jobs: notification_jobs
          .sort((a: any, b: any) => b.updated_at - a.updated_at)
          .slice(0, 40),
        notification_summary,
      };
    }

    if (args.guest_token) {
      const guestOrders = await ctx.db
        .query("orders")
        .withIndex("by_guest", (q: any) => q.eq("guest_token", args.guest_token))
        .collect();
      const guestReturns = await ctx.db
        .query("returns")
        .withIndex("by_guest", (q: any) => q.eq("guest_email", args.guest_token))
        .collect();
      const guestTimeline = await ctx.db
        .query("customer_timeline_events")
        .withIndex("by_guest", (q: any) => q.eq("guest_token", args.guest_token))
        .collect();
      const guestAnalytics = await ctx.db
        .query("analytics_events")
        .withIndex("by_guest", (q: any) => q.eq("guest_token", args.guest_token))
        .collect();
      return {
        user: null,
        profile: null,
        orders: guestOrders,
        returns: guestReturns,
        tickets: [],
        timeline: guestTimeline.sort((a: any, b: any) => b.created_at - a.created_at),
        analytics: guestAnalytics.sort((a: any, b: any) => b.created_at - a.created_at),
        segments: [],
        notification_preferences: null,
        notification_jobs: [],
        notification_summary: {
          total: 0,
          by_status: {},
          by_channel: {},
          last_notification_at: null,
        },
      };
    }

    return null;
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const rows = [];
    for (const user of users) {
      const profile = await ctx.db
        .query("user_profiles")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .unique();
      const orders = await ctx.db
        .query("orders")
        .withIndex("by_user", (q: any) => q.eq("user_id", user._id))
        .collect();
      rows.push({
        user_id: user._id,
        email: user.email,
        name: profile?.full_name ?? "",
        order_count: orders.length,
        last_order_at:
          orders.length > 0
            ? Math.max(...orders.map((order: any) => order.created_at))
            : null,
        created_at: user._creationTime,
      });
    }
    return rows
      .sort((a: any, b: any) => (b.last_order_at ?? b.created_at) - (a.last_order_at ?? a.created_at))
      .slice(0, Math.min(200, Math.max(1, args.limit ?? 50)));
  },
});
