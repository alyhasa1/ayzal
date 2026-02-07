import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

function zoneMatches(zone: any, args: { country?: string; state?: string; city?: string }) {
  if (!zone.active) return false;
  if (args.country && zone.country_codes?.length > 0) {
    const hasCountry = zone.country_codes
      .map((c: string) => c.toLowerCase())
      .includes(args.country.toLowerCase());
    if (!hasCountry) return false;
  }
  if (args.state && zone.state_codes?.length > 0) {
    const hasState = zone.state_codes
      .map((s: string) => s.toLowerCase())
      .includes(args.state.toLowerCase());
    if (!hasState) return false;
  }
  if (args.city && zone.city_patterns?.length > 0) {
    const cityLower = args.city.toLowerCase();
    const hasCity = zone.city_patterns.some((pattern: string) =>
      cityLower.includes(pattern.toLowerCase())
    );
    if (!hasCity) return false;
  }
  return true;
}

function isSubtotalInRange(subtotal: number, rate: any) {
  if (rate.min_subtotal !== undefined && subtotal < rate.min_subtotal) return false;
  if (rate.max_subtotal !== undefined && subtotal > rate.max_subtotal) return false;
  return true;
}

export const quoteRates = query({
  args: {
    subtotal: v.number(),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const zones = await ctx.db
      .query("shipping_zones")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const activeMethods = await ctx.db
      .query("shipping_methods")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const matchedZoneIds = zones
      .filter((zone) => zoneMatches(zone, args))
      .map((zone) => zone._id);

    const methods = activeMethods
      .filter((method) => !method.zone_id || matchedZoneIds.includes(method.zone_id))
      .sort((a, b) => a.sort_order - b.sort_order);

    const results = [];
    for (const method of methods) {
      const rates = await ctx.db
        .query("shipping_rates")
        .withIndex("by_method", (q) => q.eq("method_id", method._id))
        .collect();
      const activeRate = rates.find(
        (rate) => rate.active && isSubtotalInRange(args.subtotal, rate)
      );
      const freeEligible =
        method.free_over !== undefined && args.subtotal >= method.free_over;
      if (!activeRate && method.flat_rate === undefined && !freeEligible) {
        continue;
      }
      let amount = activeRate?.rate ?? method.flat_rate ?? 0;
      if (freeEligible) {
        amount = 0;
      }
      results.push({
        method_id: method._id,
        key: method.key,
        label: method.label,
        description: method.description,
        carrier: method.carrier,
        eta_min_days: method.eta_min_days,
        eta_max_days: method.eta_max_days,
        amount,
        currency: activeRate?.currency ?? "PKR",
      });
    }

    return results;
  },
});

export const adminListConfig = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "shipping.read");
    const [zones, methods, rates] = await Promise.all([
      ctx.db.query("shipping_zones").collect(),
      ctx.db.query("shipping_methods").collect(),
      ctx.db.query("shipping_rates").collect(),
    ]);

    const methodsByZone = new Map<string, number>();
    for (const method of methods) {
      if (!method.zone_id) continue;
      const key = String(method.zone_id);
      methodsByZone.set(key, (methodsByZone.get(key) ?? 0) + 1);
    }

    const ratesByMethod = new Map<string, number>();
    for (const rate of rates) {
      const key = String(rate.method_id);
      ratesByMethod.set(key, (ratesByMethod.get(key) ?? 0) + 1);
    }

    const zoneLabelById = new Map(zones.map((zone) => [String(zone._id), zone.name]));
    const methodLabelById = new Map(
      methods.map((method) => [String(method._id), method.label])
    );

    return {
      zones: zones
        .map((zone) => ({
          ...zone,
          method_count: methodsByZone.get(String(zone._id)) ?? 0,
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
      methods: methods
        .map((method) => ({
          ...method,
          zone_label: method.zone_id ? zoneLabelById.get(String(method.zone_id)) ?? "" : "",
          rate_count: ratesByMethod.get(String(method._id)) ?? 0,
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
      rates: rates
        .map((rate) => ({
          ...rate,
          method_label: methodLabelById.get(String(rate.method_id)) ?? "",
        }))
        .sort((a, b) => a.rate - b.rate),
    };
  },
});

export const adminCreateZone = mutation({
  args: {
    name: v.string(),
    country_codes: v.array(v.string()),
    state_codes: v.optional(v.array(v.string())),
    city_patterns: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const now = Date.now();
    const id = await ctx.db.insert("shipping_zones", {
      name: args.name,
      country_codes: args.country_codes,
      state_codes: args.state_codes,
      city_patterns: args.city_patterns,
      active: args.active ?? true,
      sort_order: args.sort_order ?? now,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.zone.created",
      entity_type: "shipping_zone",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateZone = mutation({
  args: {
    id: v.id("shipping_zones"),
    name: v.optional(v.string()),
    country_codes: v.optional(v.array(v.string())),
    state_codes: v.optional(v.array(v.string())),
    city_patterns: v.optional(v.array(v.string())),
    active: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Shipping zone not found");

    const patch: any = { updated_at: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.country_codes !== undefined) patch.country_codes = args.country_codes;
    if (args.state_codes !== undefined) patch.state_codes = args.state_codes;
    if (args.city_patterns !== undefined) patch.city_patterns = args.city_patterns;
    if (args.active !== undefined) patch.active = args.active;
    if (args.sort_order !== undefined) patch.sort_order = args.sort_order;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.zone.updated",
      entity_type: "shipping_zone",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const adminCreateMethod = mutation({
  args: {
    zone_id: v.optional(v.id("shipping_zones")),
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    carrier: v.optional(v.string()),
    eta_min_days: v.optional(v.number()),
    eta_max_days: v.optional(v.number()),
    flat_rate: v.optional(v.number()),
    free_over: v.optional(v.number()),
    active: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const now = Date.now();
    const id = await ctx.db.insert("shipping_methods", {
      zone_id: args.zone_id,
      key: args.key.trim(),
      label: args.label,
      description: args.description,
      carrier: args.carrier,
      eta_min_days: args.eta_min_days,
      eta_max_days: args.eta_max_days,
      flat_rate: args.flat_rate,
      free_over: args.free_over,
      active: args.active ?? true,
      sort_order: args.sort_order ?? now,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.method.created",
      entity_type: "shipping_method",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateMethod = mutation({
  args: {
    id: v.id("shipping_methods"),
    zone_id: v.optional(v.id("shipping_zones")),
    key: v.optional(v.string()),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    carrier: v.optional(v.string()),
    eta_min_days: v.optional(v.number()),
    eta_max_days: v.optional(v.number()),
    flat_rate: v.optional(v.number()),
    free_over: v.optional(v.number()),
    active: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Shipping method not found");

    const patch: any = { updated_at: Date.now() };
    if (args.zone_id !== undefined) patch.zone_id = args.zone_id;
    if (args.key !== undefined) patch.key = args.key.trim();
    if (args.label !== undefined) patch.label = args.label;
    if (args.description !== undefined) patch.description = args.description;
    if (args.carrier !== undefined) patch.carrier = args.carrier;
    if (args.eta_min_days !== undefined) patch.eta_min_days = args.eta_min_days;
    if (args.eta_max_days !== undefined) patch.eta_max_days = args.eta_max_days;
    if (args.flat_rate !== undefined) patch.flat_rate = args.flat_rate;
    if (args.free_over !== undefined) patch.free_over = args.free_over;
    if (args.active !== undefined) patch.active = args.active;
    if (args.sort_order !== undefined) patch.sort_order = args.sort_order;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.method.updated",
      entity_type: "shipping_method",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const adminCreateRate = mutation({
  args: {
    method_id: v.id("shipping_methods"),
    min_subtotal: v.optional(v.number()),
    max_subtotal: v.optional(v.number()),
    weight_from: v.optional(v.number()),
    weight_to: v.optional(v.number()),
    rate: v.number(),
    currency: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const now = Date.now();
    const id = await ctx.db.insert("shipping_rates", {
      method_id: args.method_id,
      min_subtotal: args.min_subtotal,
      max_subtotal: args.max_subtotal,
      weight_from: args.weight_from,
      weight_to: args.weight_to,
      rate: args.rate,
      currency: args.currency ?? "PKR",
      active: args.active ?? true,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.rate.created",
      entity_type: "shipping_rate",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateRate = mutation({
  args: {
    id: v.id("shipping_rates"),
    method_id: v.optional(v.id("shipping_methods")),
    min_subtotal: v.optional(v.union(v.number(), v.null())),
    max_subtotal: v.optional(v.union(v.number(), v.null())),
    weight_from: v.optional(v.union(v.number(), v.null())),
    weight_to: v.optional(v.union(v.number(), v.null())),
    rate: v.optional(v.number()),
    currency: v.optional(v.union(v.string(), v.null())),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Shipping rate not found");

    const patch: any = { updated_at: Date.now() };
    if (args.method_id !== undefined) patch.method_id = args.method_id;
    if (args.min_subtotal !== undefined) {
      patch.min_subtotal = args.min_subtotal === null ? undefined : args.min_subtotal;
    }
    if (args.max_subtotal !== undefined) {
      patch.max_subtotal = args.max_subtotal === null ? undefined : args.max_subtotal;
    }
    if (args.weight_from !== undefined) {
      patch.weight_from = args.weight_from === null ? undefined : args.weight_from;
    }
    if (args.weight_to !== undefined) {
      patch.weight_to = args.weight_to === null ? undefined : args.weight_to;
    }
    if (args.rate !== undefined) patch.rate = args.rate;
    if (args.currency !== undefined) {
      patch.currency = args.currency === null ? undefined : args.currency;
    }
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.rate.updated",
      entity_type: "shipping_rate",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const adminDeleteRate = mutation({
  args: {
    id: v.id("shipping_rates"),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Shipping rate not found");

    await ctx.db.delete(args.id);

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipping.rate.deleted",
      entity_type: "shipping_rate",
      entity_id: String(args.id),
      before,
    });
  },
});

export const createShipment = mutation({
  args: {
    order_id: v.id("orders"),
    shipping_method_id: v.optional(v.id("shipping_methods")),
    carrier: v.string(),
    tracking_number: v.optional(v.string()),
    tracking_url: v.optional(v.string()),
    label_url: v.optional(v.string()),
    status: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "shipping.write");
    const order = await ctx.db.get(args.order_id);
    if (!order) throw new Error("Order not found");

    const now = Date.now();
    const status = args.status ?? "shipped";
    const shipmentId = await ctx.db.insert("shipments", {
      order_id: args.order_id,
      shipping_method_id: args.shipping_method_id,
      carrier: args.carrier,
      tracking_number: args.tracking_number,
      tracking_url: args.tracking_url,
      label_url: args.label_url,
      status,
      shipped_at: status === "shipped" || status === "delivered" ? now : undefined,
      delivered_at: status === "delivered" ? now : undefined,
      metadata: undefined,
      created_at: now,
      updated_at: now,
    });

    await ctx.db.insert("shipment_events", {
      shipment_id: shipmentId,
      order_id: args.order_id,
      status,
      note: args.note,
      raw_payload: undefined,
      occurred_at: now,
      created_at: now,
    });

    const orderPatch: any = {
      tracking_carrier: args.carrier,
      tracking_number: args.tracking_number,
      tracking_url: args.tracking_url,
      updated_at: now,
    };
    if (status === "shipped" || status === "delivered") {
      orderPatch.status = status;
    }
    await ctx.db.patch(args.order_id, orderPatch);

    if (status === "shipped" || status === "delivered" || args.note) {
      await ctx.db.insert("order_status_events", {
        order_id: args.order_id,
        status: status === "delivered" ? "delivered" : "shipped",
        note: args.note ?? (args.tracking_number ? `Tracking: ${args.tracking_number}` : undefined),
        created_at: now,
        created_by: userId,
      });
    }

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "shipment.created",
      entity_type: "shipment",
      entity_id: String(shipmentId),
      after: {
        order_id: args.order_id,
        status,
        carrier: args.carrier,
        tracking_number: args.tracking_number,
      },
    });

    return shipmentId;
  },
});

export const syncTracking = mutation({
  args: {
    shipment_id: v.optional(v.id("shipments")),
    tracking_number: v.optional(v.string()),
    status: v.string(),
    note: v.optional(v.string()),
    tracking_url: v.optional(v.string()),
    raw_payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let shipment: any = null;
    if (args.shipment_id) {
      shipment = await ctx.db.get(args.shipment_id);
    } else if (args.tracking_number) {
      shipment = await ctx.db
        .query("shipments")
        .withIndex("by_tracking_number", (q) => q.eq("tracking_number", args.tracking_number))
        .unique();
    }

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const now = Date.now();
    await ctx.db.patch(shipment._id, {
      status: args.status,
      tracking_url: args.tracking_url ?? shipment.tracking_url,
      shipped_at:
        args.status === "shipped" || args.status === "delivered"
          ? shipment.shipped_at ?? now
          : shipment.shipped_at,
      delivered_at: args.status === "delivered" ? now : shipment.delivered_at,
      updated_at: now,
    });

    await ctx.db.insert("shipment_events", {
      shipment_id: shipment._id,
      order_id: shipment.order_id,
      status: args.status,
      note: args.note,
      raw_payload: args.raw_payload,
      occurred_at: now,
      created_at: now,
    });

    if (shipment.order_id) {
      const orderPatch: any = { updated_at: now };
      if (args.tracking_url !== undefined) orderPatch.tracking_url = args.tracking_url;
      if (args.status === "shipped" || args.status === "delivered") {
        orderPatch.status = args.status;
      }
      await ctx.db.patch(shipment.order_id, orderPatch);

      await ctx.db.insert("order_status_events", {
        order_id: shipment.order_id,
        status: args.status === "delivered" ? "delivered" : "shipped",
        note: args.note ?? `Shipment ${args.status}`,
        created_at: now,
        created_by: undefined,
      });
    }

    await recordAudit(ctx, {
      actor_email: "system:webhook",
      action: "shipment.tracking_synced",
      entity_type: "shipment",
      entity_id: String(shipment._id),
      after: {
        status: args.status,
        tracking_url: args.tracking_url,
      },
      meta: args.raw_payload,
    });
  },
});
