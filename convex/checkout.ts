import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateOrderNumber(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AYZ-${yy}${mm}${dd}-${suffix}`;
}

function normalizeLocation(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function zoneMatchesAddress(zone: any, address: any) {
  const country = normalizeLocation(address?.country);
  const state = normalizeLocation(address?.state);
  const city = normalizeLocation(address?.city);
  if (!country) return false;

  if (zone.country_codes?.length) {
    const countries = zone.country_codes.map((item: string) => normalizeLocation(item));
    if (!countries.includes(country)) return false;
  }
  if (zone.state_codes?.length) {
    const states = zone.state_codes.map((item: string) => normalizeLocation(item));
    if (!state || !states.includes(state)) return false;
  }
  if (zone.city_patterns?.length) {
    if (!city) return false;
    const matchesCity = zone.city_patterns.some((pattern: string) =>
      city.includes(normalizeLocation(pattern))
    );
    if (!matchesCity) return false;
  }

  return true;
}

async function resolveShippingForMethod(
  ctx: any,
  method: any,
  subtotal: number,
  shippingAddress: any
) {
  if (!method || !method.active) {
    return { available: false as const, shippingTotal: 0 };
  }
  if (method.zone_id) {
    const zone = await ctx.db.get(method.zone_id);
    if (!zone || !zone.active || !zoneMatchesAddress(zone, shippingAddress)) {
      return { available: false as const, shippingTotal: 0 };
    }
  }

  const rates = await ctx.db
    .query("shipping_rates")
    .withIndex("by_method", (q: any) => q.eq("method_id", method._id))
    .collect();
  const activeRate = rates.find(
    (rate: any) =>
      rate.active &&
      (rate.min_subtotal === undefined || subtotal >= rate.min_subtotal) &&
      (rate.max_subtotal === undefined || subtotal <= rate.max_subtotal)
  );
  const freeEligible = method.free_over !== undefined && subtotal >= method.free_over;
  if (!activeRate && method.flat_rate === undefined && !freeEligible) {
    return { available: false as const, shippingTotal: 0 };
  }

  let shippingTotal = activeRate?.rate ?? method.flat_rate ?? 0;
  if (freeEligible) shippingTotal = 0;
  return {
    available: true as const,
    shippingTotal: Math.max(0, shippingTotal),
  };
}

async function findActiveCart(ctx: any, userId?: string | null, guestToken?: string) {
  if (userId) {
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect();
    const cart = carts
      .filter((item: any) => item.status === "active")
      .sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
    if (cart) return cart;
  }
  if (guestToken) {
    const carts = await ctx.db
      .query("carts")
      .withIndex("by_guest", (q: any) => q.eq("guest_token", guestToken))
      .collect();
    const cart = carts
      .filter((item: any) => item.status === "active")
      .sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
    if (cart) return cart;
  }
  return null;
}

async function ensureCheckoutCart(ctx: any, userId?: string | null, guestToken?: string) {
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

function assertCartAccess(cart: any, userId?: string | null, guestToken?: string) {
  if (!cart) throw new Error("Cart not found");
  if (userId && cart.user_id === userId) return;
  if (guestToken && cart.guest_token === guestToken) return;
  throw new Error("Unauthorized cart access");
}

async function upsertAbandoned(ctx: any, args: any) {
  const rows = await ctx.db
    .query("abandoned_checkouts")
    .withIndex("by_cart", (q: any) => q.eq("cart_id", args.cart_id))
    .collect();
  const validRows: any[] = [];
  for (const row of rows) {
    if ((row as any).user_id === null) {
      await ctx.db.delete(row._id);
      continue;
    }
    validRows.push(row);
  }
  const existing = validRows.sort((a: any, b: any) => b.updated_at - a.updated_at)[0];
  const now = Date.now();
  if (!existing) {
    const insertDoc: any = {
      cart_id: args.cart_id,
      step: args.step,
      recovered: false,
      created_at: now,
      updated_at: now,
    };
    if (args.user_id !== undefined && args.user_id !== null) insertDoc.user_id = args.user_id;
    if (args.guest_token !== undefined && args.guest_token !== null)
      insertDoc.guest_token = args.guest_token;
    if (args.email !== undefined && args.email !== null) insertDoc.email = args.email;
    if (args.phone !== undefined && args.phone !== null) insertDoc.phone = args.phone;
    if (args.recover_token !== undefined && args.recover_token !== null)
      insertDoc.recover_token = args.recover_token;

    await ctx.db.insert("abandoned_checkouts", insertDoc);
    return;
  }

  const patch: any = {
    updated_at: now,
    step: args.step ?? existing.step,
    recovered: args.recovered ?? existing.recovered,
    recovered_at: args.recovered ? now : existing.recovered_at,
  };
  if (args.user_id !== undefined && args.user_id !== null) patch.user_id = args.user_id;
  if (args.guest_token !== undefined && args.guest_token !== null)
    patch.guest_token = args.guest_token;
  if (args.email !== undefined && args.email !== null) patch.email = args.email;
  if (args.phone !== undefined && args.phone !== null) patch.phone = args.phone;
  if (args.recover_token !== undefined && args.recover_token !== null)
    patch.recover_token = args.recover_token;

  await ctx.db.patch(existing._id, patch);
}

async function resolveCartTax(
  ctx: any,
  subtotalAfterDiscount: number,
  shippingTotal: number,
  shippingAddress: any
) {
  if (!shippingAddress?.country) return 0;
  const profiles = await ctx.db
    .query("tax_profiles")
    .withIndex("by_active", (q: any) => q.eq("active", true))
    .collect();
  const matched = profiles
    .filter((profile: any) => {
      if (!profile.active) return false;
      if (
        normalizeLocation(profile.country_code) !==
        normalizeLocation(shippingAddress.country)
      ) {
        return false;
      }
      if (
        profile.state_code &&
        normalizeLocation(profile.state_code) !== normalizeLocation(shippingAddress.state)
      ) {
        return false;
      }
      if (
        profile.city &&
        normalizeLocation(shippingAddress.city) &&
        !normalizeLocation(shippingAddress.city).includes(normalizeLocation(profile.city))
      ) {
        return false;
      }
      return true;
    })
    .sort((a: any, b: any) => a.priority - b.priority);

  const taxableBase = Math.max(0, subtotalAfterDiscount + shippingTotal);
  let additiveTax = 0;
  for (const profile of matched) {
    if (!profile.rate || profile.rate <= 0) continue;
    if (!profile.inclusive) {
      additiveTax += Math.round((taxableBase * profile.rate) / 100);
    }
  }
  return Math.max(0, additiveTax);
}

export const start = mutation({
  args: {
    cart_id: v.optional(v.id("carts")),
    guest_token: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let cart = args.cart_id ? await ctx.db.get(args.cart_id) : null;
    if (!cart) {
      cart = await ensureCheckoutCart(ctx, userId, args.guest_token);
    }
    assertCartAccess(cart, userId, args.guest_token);

    await upsertAbandoned(ctx, {
      cart_id: cart!._id,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      email: args.email,
      phone: args.phone,
      step: "information",
    });

    return {
      cart_id: cart!._id,
      step: "information",
      totals: {
        subtotal: cart!.subtotal,
        discount_total: cart!.discount_total,
        shipping_total: cart!.shipping_total,
        tax_total: cart!.tax_total,
        total: cart!.total,
      },
      context: cart!.checkout_context ?? {},
    };
  },
});

export const setContact = mutation({
  args: {
    cart_id: v.id("carts"),
    guest_token: v.optional(v.string()),
    contact_email: v.string(),
    contact_phone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await ctx.db.get(args.cart_id);
    assertCartAccess(cart, userId, args.guest_token);

    const checkoutContext = {
      ...(cart?.checkout_context ?? {}),
      contact_email: args.contact_email,
      contact_phone: args.contact_phone,
    };
    await ctx.db.patch(args.cart_id, {
      checkout_context: checkoutContext,
      updated_at: Date.now(),
      last_activity_at: Date.now(),
    });

    await upsertAbandoned(ctx, {
      cart_id: args.cart_id,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      email: args.contact_email,
      phone: args.contact_phone,
      step: "shipping",
    });
  },
});

export const setAddress = mutation({
  args: {
    cart_id: v.id("carts"),
    guest_token: v.optional(v.string()),
    shipping_address: v.object({
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.optional(v.string()),
      postal_code: v.optional(v.string()),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await ctx.db.get(args.cart_id);
    assertCartAccess(cart, userId, args.guest_token);

    let shippingMethodId = cart?.shipping_method_id;
    let shippingTotal = cart?.shipping_total ?? 0;
    if (shippingMethodId) {
      const selectedMethod = await ctx.db.get(shippingMethodId);
      const methodResolution = await resolveShippingForMethod(
        ctx,
        selectedMethod,
        cart?.subtotal ?? 0,
        args.shipping_address
      );
      if (methodResolution.available) {
        shippingTotal = methodResolution.shippingTotal;
      } else {
        shippingMethodId = undefined;
        shippingTotal = 0;
      }
    }

    const checkoutContext = {
      ...(cart?.checkout_context ?? {}),
      shipping_address: args.shipping_address,
    };
    const subtotalAfterDiscount = Math.max(
      0,
      (cart?.subtotal ?? 0) - (cart?.discount_total ?? 0)
    );
    const taxTotal = await resolveCartTax(
      ctx,
      subtotalAfterDiscount,
      shippingTotal,
      args.shipping_address
    );
    const totals = {
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total: Math.max(0, subtotalAfterDiscount + shippingTotal + taxTotal),
    };
    await ctx.db.patch(args.cart_id, {
      checkout_context: checkoutContext,
      shipping_method_id: shippingMethodId,
      ...totals,
      updated_at: Date.now(),
      last_activity_at: Date.now(),
    });

    await upsertAbandoned(ctx, {
      cart_id: args.cart_id,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      step: "payment",
    });
  },
});

export const setShippingMethod = mutation({
  args: {
    cart_id: v.id("carts"),
    guest_token: v.optional(v.string()),
    shipping_method_id: v.id("shipping_methods"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await ctx.db.get(args.cart_id);
    assertCartAccess(cart, userId, args.guest_token);

    const method = await ctx.db.get(args.shipping_method_id);
    if (!method || !method.active) {
      throw new Error("Shipping method not available");
    }
    const shippingAddress = cart?.checkout_context?.shipping_address;
    if (!shippingAddress?.country) {
      throw new Error("Add shipping address before selecting a shipping method");
    }
    const subtotal = cart?.subtotal ?? 0;
    const shippingResolution = await resolveShippingForMethod(
      ctx,
      method,
      subtotal,
      shippingAddress
    );
    if (!shippingResolution.available) {
      throw new Error("Shipping method is not available for this address or cart total");
    }
    const shippingTotal = shippingResolution.shippingTotal;

    const subtotalAfterDiscount = Math.max(
      0,
      (cart?.subtotal ?? 0) - (cart?.discount_total ?? 0)
    );
    const taxTotal = await resolveCartTax(
      ctx,
      subtotalAfterDiscount,
      shippingTotal,
      shippingAddress
    );
    const totals = {
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total: Math.max(0, subtotalAfterDiscount + shippingTotal + taxTotal),
    };
    await ctx.db.patch(args.cart_id, {
      shipping_method_id: args.shipping_method_id,
      ...totals,
      updated_at: Date.now(),
      last_activity_at: Date.now(),
    });

    await upsertAbandoned(ctx, {
      cart_id: args.cart_id,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      step: "payment",
    });

    return totals;
  },
});

export const setPaymentMethod = mutation({
  args: {
    cart_id: v.id("carts"),
    guest_token: v.optional(v.string()),
    payment_method_id: v.id("payment_methods"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await ctx.db.get(args.cart_id);
    assertCartAccess(cart, userId, args.guest_token);

    const paymentMethod = await ctx.db.get(args.payment_method_id);
    if (!paymentMethod || !paymentMethod.active) {
      throw new Error("Payment method not available");
    }

    await ctx.db.patch(args.cart_id, {
      payment_method_id: args.payment_method_id,
      updated_at: Date.now(),
      last_activity_at: Date.now(),
    });

    await upsertAbandoned(ctx, {
      cart_id: args.cart_id,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      step: "review",
    });
  },
});

export const placeOrder = mutation({
  args: {
    cart_id: v.id("carts"),
    guest_token: v.optional(v.string()),
    payment_method_id: v.optional(v.id("payment_methods")),
    contact_email: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    shipping_address: v.optional(
      v.object({
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country: v.string(),
      })
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const cart = await ctx.db.get(args.cart_id);
    assertCartAccess(cart, userId, args.guest_token);
    if (!cart) throw new Error("Cart not found");

    const items = await ctx.db
      .query("cart_items")
      .withIndex("by_cart", (q: any) => q.eq("cart_id", args.cart_id))
      .collect();
    if (items.length === 0) throw new Error("Cart is empty");

    const paymentMethodId = args.payment_method_id ?? cart.payment_method_id;
    if (!paymentMethodId) {
      throw new Error("Payment method is required");
    }
    const paymentMethod = await ctx.db.get(paymentMethodId);
    if (!paymentMethod || !paymentMethod.active) {
      throw new Error("Payment method is not available");
    }

    const context = cart.checkout_context ?? {};
    const contactEmail = args.contact_email ?? context.contact_email;
    const contactPhone = args.contact_phone ?? context.contact_phone;
    const shippingAddress = args.shipping_address ?? context.shipping_address;
    if (!contactEmail || !contactPhone || !shippingAddress) {
      throw new Error("Contact and shipping details are required");
    }
    const shippingMethodId = cart.shipping_method_id;
    if (!shippingMethodId) {
      throw new Error("Shipping method is required");
    }
    const selectedShippingMethod = await ctx.db.get(shippingMethodId);
    const shippingResolution = await resolveShippingForMethod(
      ctx,
      selectedShippingMethod,
      cart.subtotal ?? 0,
      shippingAddress
    );
    if (!shippingResolution.available) {
      throw new Error("Selected shipping method is no longer available for this address");
    }

    const now = Date.now();
    const subtotalAfterDiscount = Math.max(0, (cart.subtotal ?? 0) - (cart.discount_total ?? 0));
    const shippingTotal = shippingResolution.shippingTotal;
    const taxTotal = await resolveCartTax(
      ctx,
      subtotalAfterDiscount,
      shippingTotal,
      shippingAddress
    );
    const computedTotals = {
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total: Math.max(0, subtotalAfterDiscount + shippingTotal + taxTotal),
    };
    await ctx.db.patch(args.cart_id, {
      ...computedTotals,
      checkout_context: {
        ...context,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        shipping_address: shippingAddress,
      },
      updated_at: now,
      last_activity_at: now,
    });

    const orderNumber = generateOrderNumber(now);
    const orderId = await ctx.db.insert("orders", {
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      order_number: orderNumber,
      status: "pending",
      payment_method_id: paymentMethodId,
      subtotal: cart.subtotal,
      total: computedTotals.total,
      currency: cart.currency ?? "PKR",
      shipping_address: shippingAddress,
      tracking_carrier: undefined,
      tracking_number: undefined,
      tracking_url: undefined,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      created_at: now,
      updated_at: now,
    });

    for (const item of items) {
      const product = await ctx.db.get(item.product_id);
      await ctx.db.insert("order_items", {
        order_id: orderId,
        product_id: item.product_id,
        product_name: product?.name ?? "Product",
        product_image_url: product?.primary_image_url ?? "",
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
      });
    }

    await ctx.db.insert("order_status_events", {
      order_id: orderId,
      status: "pending",
      note: args.note,
      created_at: now,
      created_by: (userId as any) ?? undefined,
    });

    if (cart.coupon_snapshot?.discount_id) {
      await ctx.db.insert("discount_redemptions", {
        discount_id: cart.coupon_snapshot.discount_id,
        code_id: cart.coupon_snapshot.code_id,
        order_id: orderId,
        cart_id: cart._id,
        user_id: (userId as any) ?? undefined,
        guest_token: args.guest_token,
        amount: cart.discount_total ?? 0,
        created_at: now,
      });
    }

    await ctx.db.patch(cart._id, {
      status: "converted",
      updated_at: now,
      last_activity_at: now,
    });

    await upsertAbandoned(ctx, {
      cart_id: cart._id,
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      email: contactEmail,
      phone: contactPhone,
      step: "completed",
      recovered: true,
    });

    await ctx.db.insert("analytics_events", {
      name: "checkout_completed",
      user_id: (userId as any) ?? undefined,
      guest_token: args.guest_token,
      session_id: undefined,
      path: "/checkout/success",
      referrer: undefined,
      properties: {
        order_id: orderId,
        cart_id: cart._id,
        total: computedTotals.total,
        payment_method_id: paymentMethodId,
      },
      created_at: now,
    });

    return {
      order_id: orderId,
      order_number: orderNumber,
    };
  },
});
