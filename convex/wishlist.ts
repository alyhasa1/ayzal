import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function createShareToken() {
  return Math.random().toString(36).slice(2, 10);
}

async function findWishlist(ctx: any, userId?: string | null, guestToken?: string) {
  if (userId) {
    const byUser = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();
    const first = byUser.sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
    if (first) return first;
  }
  if (guestToken) {
    const byGuest = await ctx.db
      .query("wishlists")
      .withIndex("by_guest", (q: any) => q.eq("guest_token", guestToken))
      .collect();
    const first = byGuest.sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
    if (first) return first;
  }
  return null;
}

async function ensureWishlist(ctx: any, userId?: string | null, guestToken?: string) {
  const existing = await findWishlist(ctx, userId, guestToken);
  if (existing) return existing;
  const now = Date.now();
  const id = await ctx.db.insert("wishlists", {
    user_id: (userId as any) ?? undefined,
    guest_token: guestToken,
    share_token: createShareToken(),
    created_at: now,
    updated_at: now,
  });
  return await ctx.db.get(id);
}

function canAccess(wishlist: any, userId?: string | null, guestToken?: string) {
  if (!wishlist) return false;
  if (userId && wishlist.user_id === userId) return true;
  if (guestToken && wishlist.guest_token === guestToken) return true;
  return false;
}

async function hydrateWishlist(ctx: any, wishlist: any) {
  if (!wishlist) return null;
  const items = await ctx.db
    .query("wishlist_items")
    .withIndex("by_wishlist", (q: any) => q.eq("wishlist_id", wishlist._id))
    .collect();
  const rows = [];
  for (const item of items) {
    const product = await ctx.db.get(item.product_id);
    const variant = item.variant_id ? await ctx.db.get(item.variant_id) : null;
    rows.push({ ...item, product, variant });
  }
  return {
    ...wishlist,
    items: rows.sort((a: any, b: any) => b.added_at - a.added_at),
  };
}

export const getOrCreate = mutation({
  args: {
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const wishlist = await ensureWishlist(ctx, userId, args.guest_token);
    return await hydrateWishlist(ctx, wishlist);
  },
});

export const list = query({
  args: {
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const wishlist = await findWishlist(ctx, userId, args.guest_token);
    if (!wishlist) return null;
    return await hydrateWishlist(ctx, wishlist);
  },
});

export const add = mutation({
  args: {
    guest_token: v.optional(v.string()),
    product_id: v.id("products"),
    variant_id: v.optional(v.id("product_variants")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const product = await ctx.db.get(args.product_id);
    if (!product) throw new Error("Product not found");

    const wishlist = await ensureWishlist(ctx, userId, args.guest_token);
    if (!wishlist) throw new Error("Unable to create wishlist");

    const existing = await ctx.db
      .query("wishlist_items")
      .withIndex("by_wishlist", (q: any) => q.eq("wishlist_id", wishlist._id))
      .collect();
    const found = existing.find(
      (item: any) =>
        item.product_id === args.product_id &&
        (item.variant_id ?? null) === (args.variant_id ?? null)
    );
    if (!found) {
      await ctx.db.insert("wishlist_items", {
        wishlist_id: wishlist._id,
        product_id: args.product_id,
        variant_id: args.variant_id,
        added_at: Date.now(),
      });
    }
    await ctx.db.patch(wishlist._id, { updated_at: Date.now() });
    return await hydrateWishlist(ctx, await ctx.db.get(wishlist._id));
  },
});

export const remove = mutation({
  args: {
    guest_token: v.optional(v.string()),
    item_id: v.id("wishlist_items"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const item = await ctx.db.get(args.item_id);
    if (!item) return null;
    const wishlist = await ctx.db.get(item.wishlist_id);
    if (!canAccess(wishlist, userId, args.guest_token)) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(item._id);
    if (wishlist) {
      await ctx.db.patch(wishlist._id, { updated_at: Date.now() });
      return await hydrateWishlist(ctx, await ctx.db.get(wishlist._id));
    }
    return null;
  },
});

export const share = mutation({
  args: {
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const wishlist = await ensureWishlist(ctx, userId, args.guest_token);
    if (!wishlist) throw new Error("Wishlist not found");
    const shareToken = wishlist.share_token ?? createShareToken();
    await ctx.db.patch(wishlist._id, {
      share_token: shareToken,
      updated_at: Date.now(),
    });
    return shareToken;
  },
});

export const getShared = query({
  args: {
    share_token: v.string(),
  },
  handler: async (ctx, args) => {
    const wishlist = await ctx.db
      .query("wishlists")
      .withIndex("by_share_token", (q: any) => q.eq("share_token", args.share_token))
      .unique();
    if (!wishlist) return null;
    return await hydrateWishlist(ctx, wishlist);
  },
});
