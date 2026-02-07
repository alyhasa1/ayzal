import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePhone(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

function maskDestination(destination: string, channel: string) {
  if (channel === "email") {
    const [local, domain] = destination.split("@");
    if (!local || !domain) return destination;
    const maskedLocal =
      local.length <= 2
        ? `${local[0] ?? "*"}*`
        : `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
  }
  const digits = destination.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

function createNumericCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createSessionToken() {
  const random = `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
  return `trk_${Date.now().toString(36)}_${random}`;
}

async function attachOrderDetails(ctx: any, order: any) {
  const items = await ctx.db
    .query("order_items")
    .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
    .collect();
  const events = await ctx.db
    .query("order_status_events")
    .withIndex("by_order", (q: any) => q.eq("order_id", order._id))
    .collect();
  const paymentMethod = await ctx.db.get(order.payment_method_id);
  return {
    ...order,
    items,
    status_events: events.sort((a: any, b: any) => a.created_at - b.created_at),
    payment_method: paymentMethod,
  };
}

export const requestCode = mutation({
  args: {
    order_number: v.string(),
    contact_email: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orderNumber = args.order_number.trim();
    if (!orderNumber) throw new Error("Order number is required");

    const email = normalizeEmail(args.contact_email);
    const phone = normalizePhone(args.contact_phone);
    if (!email && !phone) {
      throw new Error("Email or phone is required");
    }

    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q: any) => q.eq("order_number", orderNumber))
      .unique();
    if (!order) throw new Error("Order not found");

    const orderEmail = normalizeEmail(order.contact_email);
    const orderPhone = normalizePhone(order.contact_phone);
    const emailMatch = !!email && email === orderEmail;
    const phoneMatch = !!phone && phone === orderPhone;
    if (!emailMatch && !phoneMatch) {
      throw new Error("Order details do not match");
    }

    const now = Date.now();
    const recentChallenges = await ctx.db
      .query("order_tracking_otps")
      .withIndex("by_order_number", (q: any) => q.eq("order_number", orderNumber))
      .collect();

    const recentWindow = recentChallenges.filter(
      (row: any) => row.destination === (emailMatch ? orderEmail : orderPhone) && now - row.created_at < 45_000
    );
    if (recentWindow.length > 0) {
      throw new Error("Please wait a few seconds before requesting another code");
    }

    const burstWindow = recentChallenges.filter(
      (row: any) =>
        row.destination === (emailMatch ? orderEmail : orderPhone) &&
        now - row.created_at < 10 * 60_000
    );
    if (burstWindow.length >= 5) {
      throw new Error("Too many attempts. Please try again later");
    }

    const orderBurstWindow = recentChallenges.filter(
      (row: any) => now - row.created_at < 10 * 60_000
    );
    if (orderBurstWindow.length >= 12) {
      throw new Error(
        "Too many verification requests for this order. Please contact support if needed."
      );
    }

    const channel = emailMatch ? "email" : "phone";
    const destination = emailMatch ? orderEmail : orderPhone;
    const code = createNumericCode();
    const expiresAt = now + 10 * 60_000;

    const challengeId = await ctx.db.insert("order_tracking_otps", {
      order_id: order._id,
      order_number: orderNumber,
      channel,
      destination,
      code,
      attempts: 0,
      consumed_at: undefined,
      expires_at: expiresAt,
      created_at: now,
    });

    const isProd = (globalThis as any)?.process?.env?.NODE_ENV === "production";

    return {
      challenge_id: challengeId,
      expires_at: expiresAt,
      channel,
      destination_masked: maskDestination(destination, channel),
      // Until provider integrations are wired, expose debug code in non-production.
      debug_code: isProd ? undefined : code,
    };
  },
});

export const verifyCode = mutation({
  args: {
    challenge_id: v.id("order_tracking_otps"),
    code: v.string(),
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challenge_id);
    if (!challenge) throw new Error("Verification challenge not found");

    const now = Date.now();
    if (challenge.consumed_at) throw new Error("Verification code already used");
    if (challenge.expires_at < now) throw new Error("Verification code expired");
    if (challenge.attempts >= 5) throw new Error("Too many invalid attempts");

    if (challenge.code !== args.code.trim()) {
      const attempts = challenge.attempts + 1;
      await ctx.db.patch(challenge._id, {
        attempts,
        expires_at: attempts >= 5 ? now : challenge.expires_at,
      });
      throw new Error("Invalid verification code");
    }

    await ctx.db.patch(challenge._id, {
      consumed_at: now,
      attempts: challenge.attempts + 1,
    });

    const accessToken = createSessionToken();
    const expiresAt = now + 30 * 60_000;
    await ctx.db.insert("order_tracking_sessions", {
      order_id: challenge.order_id,
      order_number: challenge.order_number,
      token: accessToken,
      guest_token: args.guest_token,
      expires_at: expiresAt,
      created_at: now,
    });

    return {
      access_token: accessToken,
      order_number: challenge.order_number,
      expires_at: expiresAt,
    };
  },
});

export const getVerifiedOrder = query({
  args: {
    order_number: v.string(),
    access_token: v.string(),
    guest_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("order_tracking_sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.access_token.trim()))
      .unique();
    if (!session) return null;

    const now = Date.now();
    if (session.expires_at < now) return null;
    if (session.order_number !== args.order_number.trim()) return null;
    if (session.guest_token && args.guest_token && session.guest_token !== args.guest_token) {
      return null;
    }

    const order = await ctx.db.get(session.order_id);
    if (!order) return null;
    return await attachOrderDetails(ctx, order);
  },
});
