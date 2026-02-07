import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

export const adminListOverview = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "inventory.read");
    const [products, variants, locations, levels] = await Promise.all([
      ctx.db.query("products").collect(),
      ctx.db.query("product_variants").collect(),
      ctx.db.query("inventory_locations").collect(),
      ctx.db.query("inventory_levels").collect(),
    ]);

    const productById = new Map(products.map((product) => [String(product._id), product]));
    const variantRows = variants.map((variant) => {
      const product = productById.get(String(variant.product_id));
      return {
        ...variant,
        product_name: product?.name ?? "",
        product_slug: product?.slug ?? "",
        effective_price: variant.price ?? product?.price ?? 0,
      };
    });

    const variantById = new Map(variantRows.map((variant) => [String(variant._id), variant]));
    const locationById = new Map(
      locations.map((location) => [String(location._id), location])
    );

    const levelRows = levels.map((level) => ({
      ...level,
      variant_sku: variantById.get(String(level.variant_id))?.sku ?? "",
      variant_title: variantById.get(String(level.variant_id))?.title ?? "",
      product_name: variantById.get(String(level.variant_id))?.product_name ?? "",
      location_name: locationById.get(String(level.location_id))?.name ?? "",
      on_hand: level.available + level.reserved + level.committed,
      sellable: level.available - level.reserved,
    }));

    return {
      products: products.sort((a, b) => b.updated_at - a.updated_at),
      variants: variantRows.sort((a, b) => b.updated_at - a.updated_at),
      locations: locations.sort((a, b) => a.name.localeCompare(b.name)),
      levels: levelRows.sort((a, b) => b.updated_at - a.updated_at),
    };
  },
});

export const adminCreateLocation = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "inventory.write");
    const now = Date.now();
    const id = await ctx.db.insert("inventory_locations", {
      key: args.key.trim().toLowerCase(),
      name: args.name.trim(),
      city: args.city?.trim() || undefined,
      country: args.country?.trim() || undefined,
      active: args.active ?? true,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "inventory.location.created",
      entity_type: "inventory_location",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateLocation = mutation({
  args: {
    id: v.id("inventory_locations"),
    key: v.optional(v.string()),
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "inventory.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Location not found");

    const patch: any = { updated_at: Date.now() };
    if (args.key !== undefined) patch.key = args.key.trim().toLowerCase();
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.city !== undefined) patch.city = args.city.trim() || undefined;
    if (args.country !== undefined) patch.country = args.country.trim() || undefined;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "inventory.location.updated",
      entity_type: "inventory_location",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const adminCreateVariant = mutation({
  args: {
    product_id: v.id("products"),
    sku: v.string(),
    title: v.optional(v.string()),
    price: v.optional(v.number()),
    compare_at_price: v.optional(v.number()),
    image_url: v.optional(v.string()),
    in_stock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "inventory.write");
    const now = Date.now();
    const id = await ctx.db.insert("product_variants", {
      product_id: args.product_id,
      sku: args.sku.trim().toUpperCase(),
      title: args.title?.trim() || undefined,
      option_value_ids: undefined,
      price: args.price,
      compare_at_price: args.compare_at_price,
      barcode: undefined,
      image_url: args.image_url,
      weight_grams: undefined,
      in_stock: args.in_stock ?? true,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "inventory.variant.created",
      entity_type: "product_variant",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateVariant = mutation({
  args: {
    id: v.id("product_variants"),
    sku: v.optional(v.string()),
    title: v.optional(v.string()),
    price: v.optional(v.number()),
    compare_at_price: v.optional(v.number()),
    image_url: v.optional(v.string()),
    in_stock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "inventory.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Variant not found");

    const patch: any = { updated_at: Date.now() };
    if (args.sku !== undefined) patch.sku = args.sku.trim().toUpperCase();
    if (args.title !== undefined) patch.title = args.title.trim() || undefined;
    if (args.price !== undefined) patch.price = args.price;
    if (args.compare_at_price !== undefined) patch.compare_at_price = args.compare_at_price;
    if (args.image_url !== undefined) patch.image_url = args.image_url;
    if (args.in_stock !== undefined) patch.in_stock = args.in_stock;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "inventory.variant.updated",
      entity_type: "product_variant",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const adminSetLevel = mutation({
  args: {
    variant_id: v.id("product_variants"),
    location_id: v.id("inventory_locations"),
    available: v.number(),
    reserved: v.optional(v.number()),
    committed: v.optional(v.number()),
    safety_stock: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "inventory.write");
    const rows = await ctx.db
      .query("inventory_levels")
      .withIndex("by_variant_location", (q) =>
        q.eq("variant_id", args.variant_id).eq("location_id", args.location_id)
      )
      .collect();
    const existing = rows[0];
    const now = Date.now();

    if (existing) {
      const before = existing;
      await ctx.db.patch(existing._id, {
        available: Math.max(0, args.available),
        reserved: Math.max(0, args.reserved ?? existing.reserved),
        committed: Math.max(0, args.committed ?? existing.committed),
        safety_stock: args.safety_stock,
        updated_at: now,
      });
      const after = await ctx.db.get(existing._id);
      await recordAudit(ctx, {
        actor_user_id: userId,
        actor_email: email,
        action: "inventory.level.updated",
        entity_type: "inventory_level",
        entity_id: String(existing._id),
        before,
        after,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("inventory_levels", {
      variant_id: args.variant_id,
      location_id: args.location_id,
      available: Math.max(0, args.available),
      reserved: Math.max(0, args.reserved ?? 0),
      committed: Math.max(0, args.committed ?? 0),
      safety_stock: args.safety_stock,
      updated_at: now,
    });
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "inventory.level.created",
      entity_type: "inventory_level",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});
