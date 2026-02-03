import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import {
  seedCategories,
  seedProducts,
  seedTestimonials,
  seedPressQuotes,
  seedSections,
  seedSettings,
  seedPaymentMethods,
} from "./seedData";
import { slugify } from "./lib/slugify";

export const seed = mutation({
  handler: async (ctx) => {
    const existingAdminUsers = await ctx.db.query("admin_users").take(1);
    if (existingAdminUsers.length > 0) {
      await requireAdmin(ctx);
    }
    const existingCategories = await ctx.db.query("categories").take(1);
    const existingPayments = await ctx.db.query("payment_methods").take(1);
    const existingSections = await ctx.db.query("site_sections").take(1);

    if (existingCategories.length === 0) {
      const now = Date.now();
      for (let i = 0; i < seedCategories.length; i++) {
        const category = seedCategories[i];
        await ctx.db.insert("categories", {
          name: category.name,
          slug: slugify(category.name),
          image_url: category.image_url,
          sort_order: i,
          created_at: now,
          updated_at: now,
        });
      }
    }

    const categories = await ctx.db.query("categories").collect();
    const categoryByName = new Map(categories.map((c) => [c.name, c]));

    if (existingPayments.length === 0) {
      for (let i = 0; i < seedPaymentMethods.length; i++) {
        const method = seedPaymentMethods[i];
        await ctx.db.insert("payment_methods", {
          key: method.key,
          label: method.label,
          instructions: method.instructions,
          active: method.active,
          sort_order: i,
        });
      }
    }

    const paymentMethods = await ctx.db.query("payment_methods").collect();

    const existingProducts = await ctx.db.query("products").take(1);
    if (existingProducts.length === 0) {
      for (const product of seedProducts) {
        const category = categoryByName.get(product.category);
        if (!category) continue;
        const now = Date.now();
        const productId = await ctx.db.insert("products", {
          name: product.name,
          price: product.price,
          primary_image_url: product.image,
          image_urls: product.images,
          category_id: category._id,
          description: product.description,
          fabric: product.fabric,
          work: product.work,
          includes: product.includes,
          dimensions: product.dimensions,
          care: product.care,
          sizes: product.sizes,
          sku: product.sku,
          in_stock: product.inStock,
          is_new_arrival: product.isNew,
          spotlight_rank: product.spotlight ? 1 : undefined,
          created_at: now,
          updated_at: now,
        });
        for (const method of paymentMethods) {
          await ctx.db.insert("product_payment_methods", {
            product_id: productId,
            payment_method_id: method._id,
          });
        }
      }
    }

    const existingTestimonials = await ctx.db.query("testimonials").take(1);
    if (existingTestimonials.length === 0) {
      for (let i = 0; i < seedTestimonials.length; i++) {
        const item = seedTestimonials[i];
        await ctx.db.insert("testimonials", {
          text: item.text,
          author: item.author,
          enabled: true,
          sort_order: i,
        });
      }
    }

    const existingPress = await ctx.db.query("press_quotes").take(1);
    if (existingPress.length === 0) {
      for (let i = 0; i < seedPressQuotes.length; i++) {
        const item = seedPressQuotes[i];
        await ctx.db.insert("press_quotes", {
          text: item.text,
          source: item.source,
          enabled: true,
          sort_order: i,
        });
      }
    }

    if (existingSections.length === 0) {
      for (let i = 0; i < seedSections.length; i++) {
        const section = seedSections[i];
        await ctx.db.insert("site_sections", {
          key: section.key,
          enabled: section.enabled,
          sort_order: i,
          data: section.data,
          updated_at: Date.now(),
        });
      }
    }

    const existingSettings = await ctx.db
      .query("site_settings")
      .withIndex("by_key", (q) => q.eq("key", "default"))
      .unique();
    if (!existingSettings) {
      await ctx.db.insert("site_settings", {
        key: "default",
        data: seedSettings,
        updated_at: Date.now(),
      });
    }

    const adminEmail = "alyhasan308@gmail.com";
    const existingAdmin = await ctx.db
      .query("admin_users")
      .withIndex("by_email", (q) => q.eq("email", adminEmail))
      .unique();
    if (!existingAdmin) {
      await ctx.db.insert("admin_users", {
        email: adminEmail,
        role: "admin",
        created_at: Date.now(),
      });
    }

    return { ok: true };
  },
});
