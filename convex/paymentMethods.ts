import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("payment_methods").withIndex("by_sort").collect();
  },
});

export const create = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    instructions: v.optional(v.string()),
    active: v.boolean(),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("payment_methods", {
      key: args.key,
      label: args.label,
      instructions: args.instructions,
      active: args.active,
      sort_order: args.sort_order ?? Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("payment_methods"),
    label: v.optional(v.string()),
    instructions: v.optional(v.string()),
    active: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const update: any = {};
    if (args.label !== undefined) update.label = args.label;
    if (args.instructions !== undefined) update.instructions = args.instructions;
    if (args.active !== undefined) update.active = args.active;
    if (args.sort_order !== undefined) update.sort_order = args.sort_order;
    await ctx.db.patch(args.id, update);
  },
});
