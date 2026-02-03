import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

export const get = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    full_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    shipping_address: v.optional(
      v.object({
        line1: v.optional(v.string()),
        line2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .unique();
    const now = Date.now();
    if (!existing) {
      return await ctx.db.insert("user_profiles", {
        user_id: userId,
        full_name: args.full_name,
        phone: args.phone,
        shipping_address: args.shipping_address,
        updated_at: now,
      });
    }
    await ctx.db.patch(existing._id, {
      full_name: args.full_name ?? existing.full_name,
      phone: args.phone ?? existing.phone,
      shipping_address: args.shipping_address ?? existing.shipping_address,
      updated_at: now,
    });
  },
});
