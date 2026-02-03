import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { slugify } from "./lib/slugify";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").withIndex("by_sort").collect();
  },
});

export const listWithCounts = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").withIndex("by_sort").collect();
    const results = [];
    for (const category of categories) {
      const count = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category_id", category._id))
        .collect();
      results.push({ ...category, productCount: count.length });
    }
    return results;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    image_url: v.string(),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const slug = slugify(args.name);
    return await ctx.db.insert("categories", {
      name: args.name,
      slug,
      image_url: args.image_url,
      sort_order: args.sort_order ?? now,
      created_at: now,
      updated_at: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    image_url: v.optional(v.string()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const update: any = { updated_at: Date.now() };
    if (args.name) {
      update.name = args.name;
      update.slug = slugify(args.name);
    }
    if (args.image_url !== undefined) update.image_url = args.image_url;
    if (args.sort_order !== undefined) update.sort_order = args.sort_order;
    await ctx.db.patch(args.id, update);
  },
});

export const remove = mutation({
  args: {
    id: v.id("categories"),
    reassign_to: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.id === args.reassign_to) {
      throw new Error("Reassign category must be different.");
    }
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", args.id))
      .collect();
    for (const product of products) {
      await ctx.db.patch(product._id, {
        category_id: args.reassign_to,
        updated_at: Date.now(),
      });
    }
    await ctx.db.delete(args.id);
  },
});
