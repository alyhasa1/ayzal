import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("press_quotes").withIndex("by_sort").collect();
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    source: v.string(),
    enabled: v.boolean(),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("press_quotes", {
      text: args.text,
      source: args.source,
      enabled: args.enabled,
      sort_order: args.sort_order ?? Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("press_quotes"),
    text: v.optional(v.string()),
    source: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const update: any = {};
    if (args.text !== undefined) update.text = args.text;
    if (args.source !== undefined) update.source = args.source;
    if (args.enabled !== undefined) update.enabled = args.enabled;
    if (args.sort_order !== undefined) update.sort_order = args.sort_order;
    await ctx.db.patch(args.id, update);
  },
});

export const remove = mutation({
  args: { id: v.id("press_quotes") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
