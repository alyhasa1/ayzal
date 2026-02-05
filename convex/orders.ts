import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./lib/auth";

const STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function assertStatus(value: string) {
  if (!STATUS.includes(value)) {
    throw new Error("Invalid status");
  }
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

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        product_id: v.id("products"),
        quantity: v.number(),
      })
    ),
    payment_method_id: v.id("payment_methods"),
    shipping_address: v.any(),
    contact_email: v.string(),
    contact_phone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const paymentMethod = await ctx.db.get(args.payment_method_id);
    if (!paymentMethod || !paymentMethod.active) {
      throw new Error("Payment method is not available");
    }

    let subtotal = 0;
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      user_id: userId,
      status: "pending",
      payment_method_id: args.payment_method_id,
      subtotal: 0,
      total: 0,
      currency: "PKR",
      shipping_address: args.shipping_address,
      contact_email: args.contact_email,
      contact_phone: args.contact_phone,
      created_at: now,
      updated_at: now,
    });

    for (const item of args.items) {
      const product = await ctx.db.get(item.product_id);
      if (!product) {
        throw new Error("Product not found");
      }
      const links = await ctx.db
        .query("product_payment_methods")
        .withIndex("by_product", (q: any) => q.eq("product_id", product._id))
        .collect();
      if (links.length > 0) {
        const allowed = links.some((link: any) => link.payment_method_id === args.payment_method_id);
        if (!allowed) {
          throw new Error("Selected payment method is not allowed for all items");
        }
      }
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      await ctx.db.insert("order_items", {
        order_id: orderId,
        product_id: product._id,
        product_name: product.name,
        product_image_url: product.primary_image_url,
        unit_price: product.price,
        quantity: item.quantity,
        line_total: lineTotal,
      });
    }

    await ctx.db.patch(orderId, {
      subtotal,
      total: subtotal,
      updated_at: Date.now(),
    });

    await ctx.db.insert("order_status_events", {
      order_id: orderId,
      status: "pending",
      created_at: Date.now(),
      created_by: userId,
    });

    return orderId;
  },
});

export const listForUser = query({
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    const results = [];
    for (const order of orders.sort((a: any, b: any) => b.created_at - a.created_at)) {
      results.push(await attachOrderDetails(ctx, order));
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    if (order.user_id !== userId) {
      throw new Error("Unauthorized");
    }
    return await attachOrderDetails(ctx, order);
  },
});

export const listAll = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("orders").withIndex("by_created").collect();
    const results = [];
    for (const order of orders.sort((a: any, b: any) => b.created_at - a.created_at)) {
      results.push(await attachOrderDetails(ctx, order));
    }
    return results;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    assertStatus(args.status);
    await ctx.db.patch(args.id, {
      status: args.status,
      updated_at: Date.now(),
    });
    await ctx.db.insert("order_status_events", {
      order_id: args.id,
      status: args.status,
      note: args.note,
      created_at: Date.now(),
      created_by: userId,
    });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("orders"),
    status: v.optional(v.string()),
    note: v.optional(v.string()),
    tracking_carrier: v.optional(v.string()),
    tracking_number: v.optional(v.string()),
    tracking_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) return;

    if (args.status !== undefined) {
      assertStatus(args.status);
    }

    const update: any = { updated_at: Date.now() };
    if (args.status !== undefined) update.status = args.status;
    if (args.tracking_carrier !== undefined) update.tracking_carrier = args.tracking_carrier;
    if (args.tracking_number !== undefined) update.tracking_number = args.tracking_number;
    if (args.tracking_url !== undefined) update.tracking_url = args.tracking_url;

    await ctx.db.patch(args.id, update);

    const hasTrackingChange =
      args.tracking_carrier !== undefined ||
      args.tracking_number !== undefined ||
      args.tracking_url !== undefined;

    const statusForEvent = args.status ?? order.status;
    const noteForEvent =
      args.note ??
      (hasTrackingChange
        ? `Tracking updated${args.tracking_number ? `: ${args.tracking_number}` : ""}`
        : undefined);

    if (args.status !== undefined || args.note !== undefined || hasTrackingChange) {
      await ctx.db.insert("order_status_events", {
        order_id: args.id,
        status: statusForEvent,
        note: noteForEvent,
        created_at: Date.now(),
        created_by: userId,
      });
    }
  },
});
