import { query } from "./_generated/server";
import { attachRelations } from "./products";

export const get = query({
  handler: async (ctx) => {
    const sections = await ctx.db.query("site_sections").withIndex("by_sort").collect();
    const settings = await ctx.db
      .query("site_settings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();
    const categories = await ctx.db.query("categories").withIndex("by_sort").collect();
    const testimonials = await ctx.db.query("testimonials").withIndex("by_sort").collect();
    const pressQuotes = await ctx.db.query("press_quotes").withIndex("by_sort").collect();

    const productsRaw = await ctx.db.query("products").collect();
    const products = [];
    for (const product of productsRaw) {
      products.push(await attachRelations(ctx, product));
    }

    const newArrivalsRaw = await ctx.db
      .query("products")
      .withIndex("by_new_arrival", (q) => q.eq("is_new_arrival", true))
      .collect();
    const newArrivals = [];
    for (const product of newArrivalsRaw) {
      newArrivals.push(await attachRelations(ctx, product));
    }

    let spotlight = null;
    const spotlightItems = await ctx.db
      .query("products")
      .withIndex("by_spotlight")
      .collect();
    if (spotlightItems.length > 0) {
      const sorted = spotlightItems
        .filter((item: any) => item.spotlight_rank !== undefined && item.spotlight_rank !== null)
        .sort((a: any, b: any) => (a.spotlight_rank ?? 0) - (b.spotlight_rank ?? 0));
      if (sorted.length > 0) {
        spotlight = await attachRelations(ctx, sorted[0]);
      }
    }
    if (!spotlight && products.length > 0) {
      spotlight = products[0];
    }

    return {
      sections,
      settings: settings?.data ?? {},
      categories,
      testimonials,
      pressQuotes,
      products,
      newArrivals,
      spotlight,
    };
  },
});
