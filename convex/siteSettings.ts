import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const SETTINGS_KEY = "default";

export const get = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("site_settings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
      .unique();
    return settings;
  },
});

export const upsert = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("site_settings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
      .unique();
    const now = Date.now();
    if (!existing) {
      return await ctx.db.insert("site_settings", {
        key: SETTINGS_KEY,
        data: args.data,
        updated_at: now,
      });
    }
    await ctx.db.patch(existing._id, {
      data: args.data,
      updated_at: now,
    });
  },
});
