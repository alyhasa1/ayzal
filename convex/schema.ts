import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  admin_users: defineTable({
    email: v.string(),
    role: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_email", ["email"]),

  categories: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    image_url: v.string(),
    sort_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sort", ["sort_order"]),

  payment_methods: defineTable({
    key: v.string(),
    label: v.string(),
    instructions: v.optional(v.string()),
    active: v.boolean(),
    sort_order: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_sort", ["sort_order"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    price: v.number(),
    primary_image_url: v.string(),
    image_urls: v.optional(v.array(v.string())),
    category_id: v.id("categories"),
    description: v.optional(v.string()),
    fabric: v.optional(v.string()),
    work: v.optional(v.string()),
    includes: v.optional(v.array(v.string())),
    dimensions: v.optional(
      v.object({
        kameez: v.string(),
        dupatta: v.string(),
        shalwar: v.string(),
      })
    ),
    care: v.optional(v.array(v.string())),
    sizes: v.optional(v.array(v.string())),
    sku: v.optional(v.string()),
    in_stock: v.optional(v.boolean()),
    is_new_arrival: v.optional(v.boolean()),
    spotlight_rank: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_category", ["category_id"])
    .index("by_spotlight", ["spotlight_rank"])
    .index("by_new_arrival", ["is_new_arrival"])
    .index("by_slug", ["slug"]),

  product_payment_methods: defineTable({
    product_id: v.id("products"),
    payment_method_id: v.id("payment_methods"),
  })
    .index("by_product", ["product_id"])
    .index("by_payment", ["payment_method_id"]),

  site_sections: defineTable({
    key: v.string(),
    enabled: v.boolean(),
    sort_order: v.number(),
    data: v.any(),
    updated_at: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_sort", ["sort_order"]),

  site_settings: defineTable({
    key: v.string(),
    data: v.any(),
    updated_at: v.number(),
  }).index("by_key", ["key"]),

  testimonials: defineTable({
    text: v.string(),
    author: v.string(),
    enabled: v.boolean(),
    sort_order: v.number(),
  }).index("by_sort", ["sort_order"]),

  press_quotes: defineTable({
    text: v.string(),
    source: v.string(),
    enabled: v.boolean(),
    sort_order: v.number(),
  }).index("by_sort", ["sort_order"]),

  user_profiles: defineTable({
    user_id: v.id("users"),
    full_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    shipping_address: v.optional(
      v.object({
        line1: v.optional(v.string()),
        line2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]),

  orders: defineTable({
    user_id: v.id("users"),
    status: v.string(),
    payment_method_id: v.id("payment_methods"),
    subtotal: v.number(),
    total: v.number(),
    currency: v.string(),
    shipping_address: v.any(),
    contact_email: v.string(),
    contact_phone: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_status", ["status"])
    .index("by_created", ["created_at"]),

  order_items: defineTable({
    order_id: v.id("orders"),
    product_id: v.id("products"),
    product_name: v.string(),
    product_image_url: v.string(),
    unit_price: v.number(),
    quantity: v.number(),
    line_total: v.number(),
  }).index("by_order", ["order_id"]),

  order_status_events: defineTable({
    order_id: v.id("orders"),
    status: v.string(),
    note: v.optional(v.string()),
    created_at: v.number(),
    created_by: v.optional(v.id("users")),
  }).index("by_order", ["order_id"]),
});
