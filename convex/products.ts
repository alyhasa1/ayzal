import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const productFields = {
  name: v.string(),
  price: v.number(),
  primary_image_url: v.string(),
  image_urls: v.optional(v.array(v.string())),
  category_id: v.id("categories"),
  description: v.optional(v.string()),
  fabric: v.optional(v.string()),
  work: v.optional(v.string()),
  includes: v.optional(v.array(v.string())),
  dimensions: v.optional(
    v.object({
      kameez: v.string(),
      dupatta: v.string(),
      shalwar: v.string(),
    })
  ),
  care: v.optional(v.array(v.string())),
  sizes: v.optional(v.array(v.string())),
  sku: v.optional(v.string()),
  in_stock: v.optional(v.boolean()),
  is_new_arrival: v.optional(v.boolean()),
  spotlight_rank: v.optional(v.number()),
};

async function attachRelations(ctx: any, product: any) {
  const category = await ctx.db.get(product.category_id);
  const links = await ctx.db
    .query("product_payment_methods")
    .withIndex("by_product", (q: any) => q.eq("product_id", product._id))
    .collect();
  const paymentMethods = await ctx.db.query("payment_methods").collect();
  const methodById = new Map(paymentMethods.map((m: any) => [m._id, m]));
  const methods = links
    .map((link: any) => methodById.get(link.payment_method_id))
    .filter(Boolean);
  return {
    ...product,
    category_name: category?.name ?? "",
    payment_methods: methods,
  };
}

export const list = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const results = [];
    for (const product of products) {
      results.push(await attachRelations(ctx, product));
    }
    return results;
  },
});

export const listNewArrivals = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_new_arrival", (q) => q.eq("is_new_arrival", true))
      .collect();
    const results = [];
    for (const product of products) {
      results.push(await attachRelations(ctx, product));
    }
    return results;
  },
});

export const listRelated = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", product.category_id))
      .collect();
    const filtered = products.filter((p) => p._id !== args.productId).slice(0, 4);
    const results = [];
    for (const item of filtered) {
      results.push(await attachRelations(ctx, item));
    }
    return results;
  },
});

export const getSpotlight = query({
  handler: async (ctx) => {
    const spotlightItems = await ctx.db
      .query("products")
      .withIndex("by_spotlight")
      .collect();
    if (spotlightItems.length > 0) {
      const sorted = spotlightItems
        .filter((item: any) => item.spotlight_rank !== undefined && item.spotlight_rank !== null)
        .sort((a: any, b: any) => (a.spotlight_rank ?? 0) - (b.spotlight_rank ?? 0));
      if (sorted.length > 0) {
        return await attachRelations(ctx, sorted[0]);
      }
    }
    const fallback = await ctx.db.query("products").collect();
    if (fallback.length === 0) return null;
    return await attachRelations(ctx, fallback[0]);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    return await attachRelations(ctx, product);
  },
});

export const create = mutation({
  args: {
    ...productFields,
    payment_method_ids: v.optional(v.array(v.id("payment_methods"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const productId = await ctx.db.insert("products", {
      name: args.name,
      price: args.price,
      primary_image_url: args.primary_image_url,
      image_urls: args.image_urls,
      category_id: args.category_id,
      description: args.description,
      fabric: args.fabric,
      work: args.work,
      includes: args.includes,
      dimensions: args.dimensions,
      care: args.care,
      sizes: args.sizes,
      sku: args.sku,
      in_stock: args.in_stock ?? true,
      is_new_arrival: args.is_new_arrival ?? false,
      spotlight_rank: args.spotlight_rank,
      created_at: now,
      updated_at: now,
    });
    const paymentIds = args.payment_method_ids ?? [];
    for (const paymentId of paymentIds) {
      await ctx.db.insert("product_payment_methods", {
        product_id: productId,
        payment_method_id: paymentId,
      });
    }
    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    ...Object.fromEntries(
      Object.entries(productFields).map(([key, value]) => [key, v.optional(value as any)])
    ) as any,
    payment_method_ids: v.optional(v.array(v.id("payment_methods"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const update: any = { updated_at: Date.now() };
    for (const key of Object.keys(productFields)) {
      const value = (args as any)[key];
      if (value !== undefined) {
        update[key] = value;
      }
    }
    await ctx.db.patch(args.id, update);
    if (args.payment_method_ids) {
      const existing = await ctx.db
        .query("product_payment_methods")
        .withIndex("by_product", (q) => q.eq("product_id", args.id))
        .collect();
      for (const link of existing) {
        await ctx.db.delete(link._id);
      }
      for (const paymentId of args.payment_method_ids) {
        await ctx.db.insert("product_payment_methods", {
          product_id: args.id,
          payment_method_id: paymentId,
        });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const links = await ctx.db
      .query("product_payment_methods")
      .withIndex("by_product", (q) => q.eq("product_id", args.id))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    await ctx.db.delete(args.id);
  },
});
