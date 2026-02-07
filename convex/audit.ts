import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";

export const adminList = query({
  args: {
    actor_email: v.optional(v.string()),
    action: v.optional(v.string()),
    entity_type: v.optional(v.string()),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "audit.read");
    const from = args.from ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const to = args.to ?? Date.now();
    const limit = Math.min(500, Math.max(1, args.limit ?? 150));

    const rows = await ctx.db.query("audit_logs").withIndex("by_created").collect();
    const filtered = rows
      .filter((row: any) => row.created_at >= from && row.created_at <= to)
      .filter((row: any) =>
        args.actor_email ? (row.actor_email ?? "").toLowerCase() === args.actor_email.toLowerCase() : true
      )
      .filter((row: any) => (args.action ? row.action === args.action : true))
      .filter((row: any) => (args.entity_type ? row.entity_type === args.entity_type : true))
      .sort((a: any, b: any) => b.created_at - a.created_at)
      .slice(0, limit);

    return filtered;
  },
});

export const adminSummary = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "audit.read");
    const from = args.from ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
    const to = args.to ?? Date.now();
    const rows = await ctx.db.query("audit_logs").withIndex("by_created").collect();
    const filtered = rows.filter((row: any) => row.created_at >= from && row.created_at <= to);

    const actions: Record<string, number> = {};
    const entities: Record<string, number> = {};
    for (const row of filtered) {
      actions[row.action] = (actions[row.action] ?? 0) + 1;
      entities[row.entity_type] = (entities[row.entity_type] ?? 0) + 1;
    }

    return {
      from,
      to,
      total: filtered.length,
      action_breakdown: actions,
      entity_breakdown: entities,
    };
  },
});
