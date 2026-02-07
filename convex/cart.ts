import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

function normalizeLocation(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

async function findActiveCart(ctx: any, userId?: string | null, guestToken?: string) {
  if (userId) {
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();
    const userCart = carts
      .filter((cart: any) => cart.status === "active")
      .sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
    if (userCart) return userCart;
  }

  if (guestToken) {
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_guest", (q: any) => q.eq("guest_token", guestToken))
      .collect();
    const guestCart = carts
      .filter((cart: any) => cart.status === "active")
      .sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
    if (guestCart) return guestCart;
  }

  return null;
}

async function ensureCart(ctx: any, userId?: string | null, guestToken?: string) {
  const existing = await findActiveCart(ctx, userId, guestToken);
  if (existing) return existing;
  const now = Date.now();
  const cartId = await ctx.db.insert("carts", {
    user_id: (userId as any) ?? undefined,
    guest_token: guestToken,
    status: "active",
    currency: "PKR",
    subtotal: 0,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 0,
    total: 0,
    applied_code: undefined,
    coupon_snapshot: undefined,
    shipping_method_id: undefined,
    payment_method_id: undefined,
    checkout_context: undefined,
    last_activity_at: now,
    created_at: now,
    updated_at: now,
  });
  return await ctx.db.get(cartId);
}

function isAllowedCart(cart: any, userId?: string | null, guestToken?: string) {
  if (!cart) return false;
  if (userId && cart.user_id === userId) return true;
  if (guestToken && cart.guest_token === guestToken) return true;
  return false;
}

function collectEligibilityIds(source: any, keys: string[]) {
  for (const key of keys) {
    const values = source?.[key];
    if (Array.isArray(values)) {
      return new Set(
        values
          .map((value) => String(value))
          .filter((value) => value.trim().length > 0)
      );
    }
  }
  return new Set<string>();
}

async function resolveEligibleSubtotal(ctx: any, discount: any, cartItems: any[]) {
  const subtotal = cartItems.reduce(
    (sum: number, item: any) =>
      sum + (item.line_subtotal ?? item.unit_price * item.quantity),
    0
  );
  const eligibility = discount?.eligibility;
  if (!eligibility || typeof eligibility !== "object") {
    return { eligibleSubtotal: subtotal, hasFilters: false, matched: true };
  }

  const productIds = collectEligibilityIds(eligibility, [
    "product_ids",
    "productIds",
    "products",
  ]);
  const categoryIds = collectEligibilityIds(eligibility, [
    "category_ids",
    "categoryIds",
    "categories",
  ]);

  if (productIds.size === 0 && categoryIds.size === 0) {
    return { eligibleSubtotal: subtotal, hasFilters: false, matched: true };
  }

  const productById = new Map<string, any>();
  let eligibleSubtotal = 0;
  let matched = false;
  for (const item of cartItems) {
    const lineSubtotal = item.line_subtotal ?? item.unit_price * item.quantity;
    const itemProductId = String(item.product_id);
    let eligible = productIds.has(itemProductId);

    if (!eligible && categoryIds.size > 0) {
      let product = productById.get(itemProductId);
      if (product === undefined) {
        product = await ctx.db.get(item.product_id);
        productById.set(itemProductId, product ?? null);
      }
      const categoryId = product?.category_id ? String(product.category_id) : "";
      eligible = categoryIds.has(categoryId);
    }

    if (eligible) {
      matched = true;
      eligibleSubtotal += lineSubtotal;
    }
  }

  return {
    eligibleSubtotal: Math.max(0, eligibleSubtotal),
    hasFilters: true,
    matched,
  };
}

async function resolveDiscount(
  ctx: any,
  code: string | undefined,
  subtotal: number,
  cartItems: any[],
  shippingTotal: number,
  userId?: string | null,
  guestToken?: string
) {
  if (!code) return { amount: 0, snapshot: undefined };
  const normalized = normalizeCode(code);
  const codeRecord = await ctx.db
    .query("discount_codes")
    .withIndex("by_code", (q: any) => q.eq("normalized_code", normalized))
    .unique();
  if (!codeRecord || !codeRecord.active) return { amount: 0, snapshot: undefined };
  const discount = await ctx.db.get(codeRecord.discount_id);
  if (!discount || !discount.active) return { amount: 0, snapshot: undefined };

  const now = Date.now();
  if (discount.starts_at !== undefined && now < discount.starts_at) {
    return { amount: 0, snapshot: undefined };
  }
  if (discount.ends_at !== undefined && now > discount.ends_at) {
    return { amount: 0, snapshot: undefined };
  }
  const eligibilityResult = await resolveEligibleSubtotal(ctx, discount, cartItems);
  if (eligibilityResult.hasFilters && !eligibilityResult.matched) {
    return { amount: 0, snapshot: undefined };
  }

  const eligibleSubtotal = eligibilityResult.eligibleSubtotal;
  if (discount.min_subtotal !== undefined && eligibleSubtotal < discount.min_subtotal) {
    return { amount: 0, snapshot: undefined };
  }

  const redemptions = await ctx.db
    .query("discount_redemptions")
    .withIndex("by_discount", (q: any) => q.eq("discount_id", discount._id))
    .collect();
  if (
    discount.max_redemptions !== undefined &&
    discount.max_redemptions >= 0 &&
    redemptions.length >= discount.max_redemptions
  ) {
    return { amount: 0, snapshot: undefined };
  }
  if (discount.per_customer_limit !== undefined && discount.per_customer_limit >= 0) {
    const redemptionCountForCustomer = redemptions.filter((row: any) => {
      if (userId) return row.user_id === userId;
      if (guestToken) return row.guest_token === guestToken;
      return false;
    }).length;
    if (redemptionCountForCustomer >= discount.per_customer_limit) {
      return { amount: 0, snapshot: undefined };
    }
  }

  let amount = 0;
  if (discount.type === "percent") {
    amount = Math.floor((eligibleSubtotal * discount.value) / 100);
  } else if (discount.type === "fixed") {
    amount = Math.min(eligibleSubtotal, discount.value);
  } else if (discount.type === "shipping") {
    amount = Math.min(shippingTotal, discount.value || shippingTotal);
  }
  return {
    amount: Math.max(0, amount),
    snapshot: {
      discount_id: discount._id,
      code_id: codeRecord._id,
      code: codeRecord.code,
      discount_type: discount.type,
      discount_value: discount.value,
      eligibility: discount.eligibility,
    },
  };
}

function taxProfileMatches(profile: any, shippingAddress: any) {
  const country = normalizeLocation(shippingAddress?.country);
  const state = normalizeLocation(shippingAddress?.state);
  const city = normalizeLocation(shippingAddress?.city);
  if (!country) return false;
  if (!profile.active) return false;
  if (normalizeLocation(profile.country_code) !== country) return false;
  if (profile.state_code && normalizeLocation(profile.state_code) !== state) return false;
  if (profile.city && city && !city.includes(normalizeLocation(profile.city))) return false;
  return true;
}

async function resolveTax(ctx: any, cart: any, taxableBase: number) {
  const shippingAddress = cart?.checkout_context?.shipping_address;
  if (!shippingAddress?.country) {
    return { taxTotal: 0 };
  }

  const profiles = await ctx.db
    .query("tax_profiles")
    .withIndex("by_active", (q: any) => q.eq("active", true))
    .collect();
  const matched = profiles
    .filter((profile: any) => taxProfileMatches(profile, shippingAddress))
    .sort((a: any, b: any) => a.priority - b.priority);

  let additiveTax = 0;
  for (const profile of matched) {
    const rate = profile.rate ?? 0;
    if (!rate || rate <= 0) continue;
    if (!profile.inclusive) {
      additiveTax += Math.round((taxableBase * rate) / 100);
    }
  }
  return {
    taxTotal: Math.max(0, additiveTax),
  };
}

async function recalcCart(ctx: any, cartId: string) {
  const cart = await ctx.db.get(cartId);
  if (!cart) return null;
  const items = await ctx.db
    .query("cart_items")
    .withIndex("by_cart", (q: any) => q.eq("cart_id", cartId))
    .collect();

  let subtotal = 0;
  for (const item of items) {
    const lineSubtotal = item.unit_price * item.quantity;
    subtotal += lineSubtotal;
    await ctx.db.patch(item._id, {
      line_subtotal: lineSubtotal,
      line_total: lineSubtotal,
      updated_at: Date.now(),
    });
  }

  const shippingTotal = cart.shipping_total ?? 0;
  const discount = await resolveDiscount(
    ctx,
    cart.applied_code,
    subtotal,
    items,
    shippingTotal,
    cart.user_id,
    cart.guest_token
  );
  const taxableBase = Math.max(0, subtotal - discount.amount + shippingTotal);
  const tax = await resolveTax(ctx, cart, taxableBase);
  const total = Math.max(
    0,
    subtotal - discount.amount + shippingTotal + (tax.taxTotal ?? 0)
  );

  await ctx.db.patch(cartId as any, {
    subtotal,
    discount_total: discount.amount,
    tax_total: tax.taxTotal ?? 0,
    coupon_snapshot: discount.snapshot,
    total,
    last_activity_at: Date.now(),
    updated_at: Date.now(),
  });

  return await ctx.db.get(cartId);
}

async function hydrateCart(ctx: any, cart: any) {
  if (!cart) return null;
  const items = await ctx.db
    .query("cart_items")
    .withIndex("by_cart", (q: any) => q.eq("cart_id", cart._id))
    .collect();
  const detailedItems = [];
  for (const item of items) {
    const product = await ctx.db.get(item.product_id);
    const variant = item.variant_id ? await ctx.db.get(item.variant_id) : null;
    detailedItems.push({
      ...item,
      product,
      variant,
    });
  }
  return {
    ...cart,
    items: detailedItems,
  };
}

export const getCurrent = query({
  args: {
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await findActiveCart(ctx, userId, args.guest_token);
    if (!cart) return null;
    return await hydrateCart(ctx, cart);
  },
});

export const getOrCreate = mutation({
  args: {
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await ensureCart(ctx, userId, args.guest_token);
    return await hydrateCart(ctx, cart);
  },
});

export const addItem = mutation({
  args: {
    guest_token: v.optional(v.string()),
    product_id: v.id("products"),
    variant_id: v.optional(v.id("product_variants")),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const qty = Math.max(1, args.quantity ?? 1);
    const cart = await ensureCart(ctx, userId, args.guest_token);
    if (!cart) throw new Error("Unable to create cart");

    const product = await ctx.db.get(args.product_id);
    if (!product) throw new Error("Product not found");
    if (product.in_stock === false) throw new Error("Product is out of stock");

    let unitPrice = product.price;
    if (args.variant_id) {
      const variant = await ctx.db.get(args.variant_id);
      if (!variant) throw new Error("Variant not found");
      if (variant.in_stock === false) throw new Error("Variant is out of stock");
      unitPrice = variant.price ?? product.price;
    }

    const existingItems = await ctx.db
      .query("cart_items")
      .withIndex("by_cart", (q: any) => q.eq("cart_id", cart._id))
      .collect();
    const existing = existingItems.find(
      (item: any) =>
        item.product_id === args.product_id &&
        (item.variant_id ?? null) === (args.variant_id ?? null)
    );

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + qty,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("cart_items", {
        cart_id: cart._id,
        product_id: args.product_id,
        variant_id: args.variant_id,
        quantity: qty,
        unit_price: unitPrice,
        line_subtotal: unitPrice * qty,
        discount_total: 0,
        line_total: unitPrice * qty,
        meta: undefined,
        created_at: now,
        updated_at: now,
      });
    }

    await ctx.db.insert("analytics_events", {
      name: "cart_item_added",
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      session_id: undefined,
      path: "/cart",
      referrer: undefined,
      properties: {
        product_id: args.product_id,
        variant_id: args.variant_id,
        quantity: qty,
      },
      created_at: now,
    });

    const recalculated = await recalcCart(ctx, cart._id);
    return await hydrateCart(ctx, recalculated);
  },
});

export const updateItem = mutation({
  args: {
    guest_token: v.optional(v.string()),
    item_id: v.id("cart_items"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const item = await ctx.db.get(args.item_id);
    if (!item) throw new Error("Item not found");
    const cart = await ctx.db.get(item.cart_id);
    if (!cart || !isAllowedCart(cart, userId, args.guest_token)) {
      throw new Error("Unauthorized");
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(item._id);
    } else {
      await ctx.db.patch(item._id, {
        quantity: args.quantity,
        updated_at: Date.now(),
      });
    }
    const recalculated = await recalcCart(ctx, cart._id);
    return await hydrateCart(ctx, recalculated);
  },
});

export const removeItem = mutation({
  args: {
    guest_token: v.optional(v.string()),
    item_id: v.id("cart_items"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const item = await ctx.db.get(args.item_id);
    if (!item) return null;
    const cart = await ctx.db.get(item.cart_id);
    if (!cart || !isAllowedCart(cart, userId, args.guest_token)) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(item._id);
    const recalculated = await recalcCart(ctx, cart._id);
    return await hydrateCart(ctx, recalculated);
  },
});

export const applyCode = mutation({
  args: {
    guest_token: v.optional(v.string()),
    cart_id: v.optional(v.id("carts")),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let cart = args.cart_id ? await ctx.db.get(args.cart_id) : null;
    if (!cart) {
      cart = await findActiveCart(ctx, userId, args.guest_token);
    }
    if (!cart) throw new Error("Cart not found");
    if (!isAllowedCart(cart, userId, args.guest_token)) throw new Error("Unauthorized");

    await ctx.db.patch(cart._id, {
      applied_code: args.code.trim(),
      updated_at: Date.now(),
    });
    const recalculated = await recalcCart(ctx, cart._id);
    if ((recalculated?.discount_total ?? 0) <= 0) {
      await ctx.db.patch(cart._id, {
        applied_code: undefined,
        coupon_snapshot: undefined,
        updated_at: Date.now(),
      });
      await recalcCart(ctx, cart._id);
      throw new Error("Code is invalid or not eligible");
    }
    return await hydrateCart(ctx, recalculated);
  },
});

export const clearCode = mutation({
  args: {
    guest_token: v.optional(v.string()),
    cart_id: v.optional(v.id("carts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let cart = args.cart_id ? await ctx.db.get(args.cart_id) : null;
    if (!cart) {
      cart = await findActiveCart(ctx, userId, args.guest_token);
    }
    if (!cart) throw new Error("Cart not found");
    if (!isAllowedCart(cart, userId, args.guest_token)) throw new Error("Unauthorized");

    await ctx.db.patch(cart._id, {
      applied_code: undefined,
      coupon_snapshot: undefined,
      updated_at: Date.now(),
    });
    const recalculated = await recalcCart(ctx, cart._id);
    return await hydrateCart(ctx, recalculated);
  },
});

export const estimateShipping = query({
  args: {
    guest_token: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await findActiveCart(ctx, userId, args.guest_token);
    if (!cart) return [];

    const zones = await ctx.db.query("shipping_zones").withIndex("by_active", (q) => q.eq("active", true)).collect();
    const matchedZoneIds = zones
      .filter((zone: any) => {
        const country = args.country?.trim().toLowerCase();
        const state = args.state?.trim().toLowerCase();
        const city = args.city?.trim().toLowerCase();

        if (zone.country_codes?.length) {
          if (!country) return false;
          const hasCountry = zone.country_codes
            .map((c: string) => c.toLowerCase())
            .includes(country);
          if (!hasCountry) return false;
        }
        if (zone.state_codes?.length) {
          if (!state) return false;
          const hasState = zone.state_codes
            .map((s: string) => s.toLowerCase())
            .includes(state);
          if (!hasState) return false;
        }
        if (zone.city_patterns?.length) {
          if (!city) return false;
          const cityMatch = zone.city_patterns.some((pattern: string) =>
            city.includes(pattern.toLowerCase())
          );
          if (!cityMatch) return false;
        }
        return true;
      })
      .map((zone: any) => zone._id);

    const methods = await ctx.db
      .query("shipping_methods")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const quotes = [];
    for (const method of methods) {
      if (method.zone_id && !matchedZoneIds.includes(method.zone_id)) continue;
      const rates = await ctx.db
        .query("shipping_rates")
        .withIndex("by_method", (q: any) => q.eq("method_id", method._id))
        .collect();
      const activeRate = rates.find(
        (rate: any) =>
          rate.active &&
          (rate.min_subtotal === undefined || cart.subtotal >= rate.min_subtotal) &&
          (rate.max_subtotal === undefined || cart.subtotal <= rate.max_subtotal)
      );
      const freeEligible =
        method.free_over !== undefined && cart.subtotal >= method.free_over;
      if (!activeRate && method.flat_rate === undefined && !freeEligible) {
        // Keep estimator aligned with checkout:setShippingMethod validation.
        continue;
      }
      let amount = activeRate?.rate ?? method.flat_rate ?? 0;
      if (freeEligible) {
        amount = 0;
      }
      quotes.push({
        shipping_method_id: method._id,
        key: method.key,
        label: method.label,
        amount,
        currency: activeRate?.currency ?? "PKR",
        eta_min_days: method.eta_min_days,
        eta_max_days: method.eta_max_days,
      });
    }

    return quotes.sort((a: any, b: any) => (a.amount ?? 0) - (b.amount ?? 0));
  },
});

export const syncGuestCart = mutation({
  args: {
    guest_token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const guestCart = await findActiveCart(ctx, null, args.guest_token);
    const userCart = await ensureCart(ctx, userId, args.guest_token);
    if (!userCart) throw new Error("Unable to resolve user cart");
    if (!guestCart || guestCart._id === userCart._id) return await hydrateCart(ctx, userCart);

    const guestItems = await ctx.db
      .query("cart_items")
      .withIndex("by_cart", (q: any) => q.eq("cart_id", guestCart._id))
      .collect();
    const userItems = await ctx.db
      .query("cart_items")
      .withIndex("by_cart", (q: any) => q.eq("cart_id", userCart._id))
      .collect();

    const now = Date.now();
    for (const guestItem of guestItems) {
      const existing = userItems.find(
        (userItem: any) =>
          userItem.product_id === guestItem.product_id &&
          (userItem.variant_id ?? null) === (guestItem.variant_id ?? null)
      );
      if (existing) {
        await ctx.db.patch(existing._id, {
          quantity: existing.quantity + guestItem.quantity,
          updated_at: now,
        });
      } else {
        await ctx.db.insert("cart_items", {
          cart_id: userCart._id,
          product_id: guestItem.product_id,
          variant_id: guestItem.variant_id,
          quantity: guestItem.quantity,
          unit_price: guestItem.unit_price,
          line_subtotal: guestItem.unit_price * guestItem.quantity,
          discount_total: 0,
          line_total: guestItem.unit_price * guestItem.quantity,
          meta: guestItem.meta,
          created_at: now,
          updated_at: now,
        });
      }
      await ctx.db.delete(guestItem._id);
    }

    await ctx.db.patch(guestCart._id, {
      status: "merged",
      updated_at: now,
    });
    await recalcCart(ctx, userCart._id);
    return await hydrateCart(ctx, await ctx.db.get(userCart._id));
  },
});
