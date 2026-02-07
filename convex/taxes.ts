import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function profileMatches(
  profile: any,
  args: { country?: string; state?: string; city?: string }
) {
  const country = normalize(args.country);
  const state = normalize(args.state);
  const city = normalize(args.city);

  if (!profile.active) return false;
  if (!country) return false;
  if (normalize(profile.country_code) !== country) return false;

  if (profile.state_code && normalize(profile.state_code) !== state) {
    return false;
  }
  if (profile.city && city && !city.includes(normalize(profile.city))) {
    return false;
  }
  return true;
}

function calculateTaxAmount(base: number, rate: number, inclusive: boolean) {
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  if (inclusive) {
    return Math.round((base * rate) / (100 + rate));
  }
  return Math.round((base * rate) / 100);
}

export const calculateForAddress = query({
  args: {
    subtotal: v.number(),
    shipping_total: v.optional(v.number()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const base = Math.max(0, args.subtotal) + Math.max(0, args.shipping_total ?? 0);
    const profiles = await ctx.db
      .query("tax_profiles")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const matched = profiles
      .filter((profile) => profileMatches(profile, args))
      .sort((a, b) => a.priority - b.priority);

    const applied_profiles = matched.map((profile) => {
      const amount = calculateTaxAmount(base, profile.rate, profile.inclusive);
      return {
        tax_profile_id: profile._id,
        name: profile.name,
        rate: profile.rate,
        inclusive: profile.inclusive,
        amount,
      };
    });

    const additive_tax_total = applied_profiles
      .filter((item) => !item.inclusive)
      .reduce((sum, item) => sum + item.amount, 0);
    const included_tax_total = applied_profiles
      .filter((item) => item.inclusive)
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      base,
      additive_tax_total,
      included_tax_total,
      total_tax_display: additive_tax_total + included_tax_total,
      applied_profiles,
    };
  },
});

export const adminListConfig = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "taxes.read");
    const [profiles, rules] = await Promise.all([
      ctx.db.query("tax_profiles").collect(),
      ctx.db.query("tax_rules").collect(),
    ]);

    const profileNameById = new Map(
      profiles.map((profile) => [String(profile._id), profile.name])
    );
    return {
      profiles: profiles.sort((a, b) => a.priority - b.priority),
      rules: rules.map((rule) => ({
        ...rule,
        profile_name: profileNameById.get(String(rule.tax_profile_id)) ?? "",
      })),
    };
  },
});

export const adminCreateProfile = mutation({
  args: {
    name: v.string(),
    country_code: v.string(),
    state_code: v.optional(v.string()),
    city: v.optional(v.string()),
    rate: v.number(),
    inclusive: v.boolean(),
    active: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "taxes.write");
    const now = Date.now();
    const id = await ctx.db.insert("tax_profiles", {
      name: args.name.trim(),
      country_code: args.country_code.trim(),
      state_code: args.state_code?.trim() || undefined,
      city: args.city?.trim() || undefined,
      rate: args.rate,
      inclusive: args.inclusive,
      active: args.active ?? true,
      priority: args.priority ?? now,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "tax.profile.created",
      entity_type: "tax_profile",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateProfile = mutation({
  args: {
    id: v.id("tax_profiles"),
    name: v.optional(v.string()),
    country_code: v.optional(v.string()),
    state_code: v.optional(v.string()),
    city: v.optional(v.string()),
    rate: v.optional(v.number()),
    inclusive: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "taxes.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Tax profile not found");

    const patch: any = { updated_at: Date.now() };
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.country_code !== undefined) patch.country_code = args.country_code.trim();
    if (args.state_code !== undefined) patch.state_code = args.state_code.trim() || undefined;
    if (args.city !== undefined) patch.city = args.city.trim() || undefined;
    if (args.rate !== undefined) patch.rate = args.rate;
    if (args.inclusive !== undefined) patch.inclusive = args.inclusive;
    if (args.active !== undefined) patch.active = args.active;
    if (args.priority !== undefined) patch.priority = args.priority;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "tax.profile.updated",
      entity_type: "tax_profile",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const adminCreateRule = mutation({
  args: {
    tax_profile_id: v.id("tax_profiles"),
    product_category: v.optional(v.string()),
    product_id: v.optional(v.id("products")),
    collection_id: v.optional(v.id("collections")),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "taxes.write");
    const now = Date.now();
    const id = await ctx.db.insert("tax_rules", {
      tax_profile_id: args.tax_profile_id,
      product_category: args.product_category?.trim() || undefined,
      product_id: args.product_id,
      collection_id: args.collection_id,
      active: args.active ?? true,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "tax.rule.created",
      entity_type: "tax_rule",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdateRule = mutation({
  args: {
    id: v.id("tax_rules"),
    tax_profile_id: v.optional(v.id("tax_profiles")),
    product_category: v.optional(v.string()),
    product_id: v.optional(v.id("products")),
    collection_id: v.optional(v.id("collections")),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "taxes.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Tax rule not found");

    const patch: any = { updated_at: Date.now() };
    if (args.tax_profile_id !== undefined) patch.tax_profile_id = args.tax_profile_id;
    if (args.product_category !== undefined)
      patch.product_category = args.product_category.trim() || undefined;
    if (args.product_id !== undefined) patch.product_id = args.product_id;
    if (args.collection_id !== undefined) patch.collection_id = args.collection_id;
    if (args.active !== undefined) patch.active = args.active;
    await ctx.db.patch(args.id, patch);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "tax.rule.updated",
      entity_type: "tax_rule",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});
