import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

function toShippingAddress(address: any) {
  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country,
  };
}

async function upsertProfileDefaultAddress(ctx: any, userId: any, addressId: any, address: any) {
  const existing = await ctx.db
    .query("user_profiles")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .unique();
  const now = Date.now();
  if (!existing) {
    await ctx.db.insert("user_profiles", {
      user_id: userId,
      default_address_id: addressId,
      shipping_address: toShippingAddress(address),
      updated_at: now,
    });
    return;
  }
  await ctx.db.patch(existing._id, {
    default_address_id: addressId,
    shipping_address: toShippingAddress(address),
    updated_at: now,
  });
}

export const listForUser = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .unique();
    const addresses = await ctx.db
      .query("user_addresses")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();

    const defaultId = profile?.default_address_id ?? null;
    const sorted = addresses.sort((a: any, b: any) => {
      const aDefault = defaultId && a._id === defaultId ? 1 : 0;
      const bDefault = defaultId && b._id === defaultId ? 1 : 0;
      if (aDefault !== bDefault) return bDefault - aDefault;
      return (b.updated_at ?? 0) - (a.updated_at ?? 0);
    });

    return { addresses: sorted, default_address_id: defaultId };
  },
});

export const create = mutation({
  args: {
    label: v.optional(v.string()),
    recipient_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    postal_code: v.optional(v.string()),
    country: v.string(),
    make_default: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const addressId = await ctx.db.insert("user_addresses", {
      user_id: userId,
      label: args.label,
      recipient_name: args.recipient_name,
      phone: args.phone,
      line1: args.line1,
      line2: args.line2,
      city: args.city,
      state: args.state,
      postal_code: args.postal_code,
      country: args.country,
      created_at: now,
      updated_at: now,
    });

    if (args.make_default) {
      const address = await ctx.db.get(addressId);
      if (address) {
        await upsertProfileDefaultAddress(ctx, userId, addressId, address);
      }
    }

    return addressId;
  },
});

export const update = mutation({
  args: {
    id: v.id("user_addresses"),
    label: v.optional(v.string()),
    recipient_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    line1: v.optional(v.string()),
    line2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postal_code: v.optional(v.string()),
    country: v.optional(v.string()),
    make_default: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    if (existing.user_id !== userId) {
      throw new Error("Unauthorized");
    }

    const update: any = { updated_at: Date.now() };
    for (const key of [
      "label",
      "recipient_name",
      "phone",
      "line1",
      "line2",
      "city",
      "state",
      "postal_code",
      "country",
    ]) {
      const value = (args as any)[key];
      if (value !== undefined) update[key] = value;
    }

    await ctx.db.patch(args.id, update);

    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .unique();

    const isDefault = profile?.default_address_id && profile.default_address_id === args.id;
    if (args.make_default || isDefault) {
      const address = await ctx.db.get(args.id);
      if (address) {
        await upsertProfileDefaultAddress(ctx, userId, args.id, address);
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("user_addresses") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    if (existing.user_id !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);

    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .unique();
    if (profile?.default_address_id === args.id) {
      await ctx.db.patch(profile._id, {
        default_address_id: undefined,
        shipping_address: undefined,
        updated_at: Date.now(),
      });
    }
  },
});

export const setDefault = mutation({
  args: { id: v.id("user_addresses") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const address = await ctx.db.get(args.id);
    if (!address) {
      throw new Error("Address not found");
    }
    if (address.user_id !== userId) {
      throw new Error("Unauthorized");
    }
    await upsertProfileDefaultAddress(ctx, userId, args.id, address);
  },
});

