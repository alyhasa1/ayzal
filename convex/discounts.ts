import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

function isDiscountActive(discount: any, now: number) {
  if (!discount.active) return false;
  if (discount.starts_at !== undefined && now < discount.starts_at) return false;
  if (discount.ends_at !== undefined && now > discount.ends_at) return false;
  return true;
}

function calculateAmount(discount: any, subtotal: number, shippingTotal = 0) {
  if (discount.type === "percent") {
    return Math.max(0, Math.floor((subtotal * discount.value) / 100));
  }
  if (discount.type === "fixed") {
    return Math.max(0, Math.min(subtotal, discount.value));
  }
  if (discount.type === "shipping") {
    return Math.max(0, Math.min(shippingTotal, discount.value || shippingTotal));
  }
  return 0;
}

async function getCodeRecord(ctx: any, code: string) {
  const normalized = normalizeCode(code);
  const codeRecord = await ctx.db
    .query("discount_codes")
    .withIndex("by_code", (q: any) => q.eq("normalized_code", normalized))
    .unique();
  if (!codeRecord || !codeRecord.active) return null;
  const discount = await ctx.db.get(codeRecord.discount_id);
  if (!discount) return null;
  return { codeRecord, discount };
}

export const validateCode = query({
  args: {
    code: v.string(),
    subtotal: v.number(),
    shipping_total: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const match = await getCodeRecord(ctx, args.code);
    if (!match) {
      return { valid: false as const, reason: "Code not found" };
    }

    const now = Date.now();
    if (!isDiscountActive(match.discount, now)) {
      return { valid: false as const, reason: "Code is not active" };
    }

    if (
      match.discount.min_subtotal !== undefined &&
      args.subtotal < match.discount.min_subtotal
    ) {
      return {
        valid: false as const,
        reason: `Minimum subtotal is ${match.discount.min_subtotal}`,
      };
    }

    const amount = calculateAmount(
      match.discount,
      args.subtotal,
      args.shipping_total ?? 0
    );
    return {
      valid: true as const,
      amount,
      discount: match.discount,
      code: match.codeRecord,
    };
  },
});

export const adminList = query({
  handler: async (ctx) => {
    try {
      await requirePermission(ctx, "promotions.read");
      const discounts = await ctx.db.query("discounts").collect();
      const rows = [];
      for (const discount of discounts) {
        const codes = await ctx.db
          .query("discount_codes")
          .withIndex("by_discount", (q: any) => q.eq("discount_id", discount._id))
          .collect();
        rows.push({ ...discount, codes });
      }
      return rows.sort((a: any, b: any) => b.updated_at - a.updated_at);
    } catch (error: any) {
      console.error("discounts.adminList failed", {
        message: error?.message ?? "Unknown error",
      });
      return [];
    }
  },
});

export const adminCreate = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    value: v.number(),
    currency: v.optional(v.string()),
    starts_at: v.optional(v.number()),
    ends_at: v.optional(v.number()),
    min_subtotal: v.optional(v.number()),
    max_redemptions: v.optional(v.number()),
    per_customer_limit: v.optional(v.number()),
    active: v.boolean(),
    stackable: v.boolean(),
    eligibility: v.optional(v.any()),
    codes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "promotions.write");
    const now = Date.now();
    const discountId = await ctx.db.insert("discounts", {
      name: args.name,
      type: args.type,
      value: args.value,
      currency: args.currency,
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      min_subtotal: args.min_subtotal,
      max_redemptions: args.max_redemptions,
      per_customer_limit: args.per_customer_limit,
      active: args.active,
      stackable: args.stackable,
      eligibility: args.eligibility,
      created_at: now,
      updated_at: now,
    });

    for (const code of args.codes) {
      const trimmed = code.trim();
      if (!trimmed) continue;
      await ctx.db.insert("discount_codes", {
        discount_id: discountId,
        code: trimmed,
        normalized_code: normalizeCode(trimmed),
        active: true,
        created_at: now,
        updated_at: now,
      });
    }

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "discount.created",
      entity_type: "discount",
      entity_id: String(discountId),
      after: {
        name: args.name,
        type: args.type,
        value: args.value,
        active: args.active,
        codes: args.codes,
      },
    });

    return discountId;
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("discounts"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    starts_at: v.optional(v.number()),
    ends_at: v.optional(v.number()),
    min_subtotal: v.optional(v.number()),
    max_redemptions: v.optional(v.number()),
    per_customer_limit: v.optional(v.number()),
    active: v.optional(v.boolean()),
    stackable: v.optional(v.boolean()),
    eligibility: v.optional(v.any()),
    add_codes: v.optional(v.array(v.string())),
    deactivate_codes: v.optional(v.array(v.id("discount_codes"))),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "promotions.write");
    const before = await ctx.db.get(args.id);
    if (!before) {
      throw new Error("Discount not found");
    }

    const update: any = { updated_at: Date.now() };
    for (const key of [
      "name",
      "type",
      "value",
      "currency",
      "starts_at",
      "ends_at",
      "min_subtotal",
      "max_redemptions",
      "per_customer_limit",
      "active",
      "stackable",
      "eligibility",
    ]) {
      const value = (args as any)[key];
      if (value !== undefined) update[key] = value;
    }
    await ctx.db.patch(args.id, update);

    const now = Date.now();
    for (const code of args.add_codes ?? []) {
      const trimmed = code.trim();
      if (!trimmed) continue;
      await ctx.db.insert("discount_codes", {
        discount_id: args.id,
        code: trimmed,
        normalized_code: normalizeCode(trimmed),
        active: true,
        created_at: now,
        updated_at: now,
      });
    }
    for (const codeId of args.deactivate_codes ?? []) {
      await ctx.db.patch(codeId, {
        active: false,
        updated_at: now,
      });
    }

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "discount.updated",
      entity_type: "discount",
      entity_id: String(args.id),
      before,
      after,
      meta: {
        add_codes: args.add_codes ?? [],
        deactivate_codes: args.deactivate_codes ?? [],
      },
    });
  },
});
