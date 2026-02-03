import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("site_sections").withIndex("by_sort").collect();
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("site_sections")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    key: v.string(),
    enabled: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("site_sections")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const now = Date.now();
    if (!existing) {
      return await ctx.db.insert("site_sections", {
        key: args.key,
        enabled: args.enabled ?? true,
        sort_order: args.sort_order ?? now,
        data: args.data ?? {},
        updated_at: now,
      });
    }
    await ctx.db.patch(existing._id, {
      enabled: args.enabled ?? existing.enabled,
      sort_order: args.sort_order ?? existing.sort_order,
      data: args.data ?? existing.data,
      updated_at: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("site_sections"),
    enabled: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const update: any = { updated_at: Date.now() };
    if (args.enabled !== undefined) update.enabled = args.enabled;
    if (args.sort_order !== undefined) update.sort_order = args.sort_order;
    if (args.data !== undefined) update.data = args.data;
    await ctx.db.patch(args.id, update);
  },
});
