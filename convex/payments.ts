import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

async function resolveAmount(ctx: any, args: any) {
  if (args.amount !== undefined) return args.amount;
  if (args.order_id) {
    const order = await ctx.db.get(args.order_id);
    if (!order) throw new Error("Order not found");
    return order.total;
  }
  if (args.cart_id) {
    const cart = await ctx.db.get(args.cart_id);
    if (!cart) throw new Error("Cart not found");
    return cart.total;
  }
  throw new Error("amount, order_id, or cart_id is required");
}

export const createIntent = mutation({
  args: {
    order_id: v.optional(v.id("orders")),
    cart_id: v.optional(v.id("carts")),
    provider: v.string(),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    idempotency_key: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (args.idempotency_key) {
      const existing = await ctx.db
        .query("payment_intents")
        .withIndex("by_idempotency_key", (q) =>
          q.eq("idempotency_key", args.idempotency_key)
        )
        .unique();
      if (existing) return existing._id;
    }

    const now = Date.now();
    const amount = await resolveAmount(ctx, args);
    const intentId = await ctx.db.insert("payment_intents", {
      order_id: args.order_id,
      cart_id: args.cart_id,
      provider: args.provider,
      provider_intent_id: undefined,
      status: "created",
      amount,
      currency: args.currency ?? "PKR",
      metadata: args.metadata,
      idempotency_key: args.idempotency_key,
      created_at: now,
      updated_at: now,
    });

    return intentId;
  },
});

export const confirmIntent = mutation({
  args: {
    intent_id: v.id("payment_intents"),
    status: v.string(),
    provider_intent_id: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const intent = await ctx.db.get(args.intent_id);
    if (!intent) throw new Error("Payment intent not found");

    await ctx.db.patch(args.intent_id, {
      status: args.status,
      provider_intent_id: args.provider_intent_id ?? intent.provider_intent_id,
      metadata: args.metadata ?? intent.metadata,
      updated_at: now,
    });

    if (intent.order_id && (args.status === "succeeded" || args.status === "paid")) {
      await ctx.db.patch(intent.order_id, {
        status: "confirmed",
        updated_at: now,
      });
      await ctx.db.insert("order_status_events", {
        order_id: intent.order_id,
        status: "confirmed",
        note: "Payment confirmed",
        created_at: now,
        created_by: undefined,
      });
    }
  },
});

export const reconcileWebhook = mutation({
  args: {
    provider: v.string(),
    event_id: v.string(),
    event_type: v.string(),
    provider_intent_id: v.optional(v.string()),
    order_id: v.optional(v.id("orders")),
    signature_valid: v.optional(v.boolean()),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    if (!args.event_id.trim()) {
      throw new Error("event_id is required");
    }
    if (args.signature_valid === false) {
      return { deduped: false, ignored: true, reason: "invalid_signature" as const };
    }

    const existing = await ctx.db
      .query("payment_events")
      .withIndex("by_event_id", (q) => q.eq("event_id", args.event_id))
      .unique();
    if (existing) {
      return { deduped: true, ignored: false };
    }

    let intent: any = null;
    if (args.provider_intent_id) {
      intent = await ctx.db
        .query("payment_intents")
        .withIndex("by_provider_intent", (q) =>
          q.eq("provider_intent_id", args.provider_intent_id)
        )
        .unique();
    }

    const orderId = args.order_id ?? intent?.order_id;
    const now = Date.now();
    await ctx.db.insert("payment_events", {
      payment_intent_id: intent?._id,
      order_id: orderId,
      provider: args.provider,
      event_id: args.event_id,
      event_type: args.event_type,
      signature_valid: args.signature_valid,
      payload: args.payload,
      created_at: now,
    });

    if (intent) {
      let status = intent.status;
      if (args.event_type.includes("succeed") || args.event_type.includes("paid")) {
        status = "succeeded";
      } else if (args.event_type.includes("fail")) {
        status = "failed";
      } else if (args.event_type.includes("pending")) {
        status = "pending";
      }
      await ctx.db.patch(intent._id, { status, updated_at: now });
    }

    if (orderId && (args.event_type.includes("succeed") || args.event_type.includes("paid"))) {
      await ctx.db.patch(orderId, {
        status: "confirmed",
        updated_at: now,
      });
      await ctx.db.insert("order_status_events", {
        order_id: orderId,
        status: "confirmed",
        note: `Payment webhook: ${args.event_type}`,
        created_at: now,
        created_by: undefined,
      });
    }

    return { deduped: false, ignored: false };
  },
});

export const markCODVerified = mutation({
  args: {
    order_id: v.id("orders"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const order = await ctx.db.get(args.order_id);
    if (!order) throw new Error("Order not found");

    const now = Date.now();
    await ctx.db.patch(args.order_id, {
      status: "confirmed",
      updated_at: now,
    });

    await ctx.db.insert("order_status_events", {
      order_id: args.order_id,
      status: "confirmed",
      note: args.note ?? "COD verified by admin",
      created_at: now,
      created_by: userId,
    });

    await ctx.db.insert("payment_intents", {
      order_id: args.order_id,
      cart_id: undefined,
      provider: "cod",
      provider_intent_id: undefined,
      status: "succeeded",
      amount: order.total,
      currency: order.currency ?? "PKR",
      metadata: { mode: "manual_admin_verify" },
      idempotency_key: undefined,
      created_at: now,
      updated_at: now,
    });
  },
});
