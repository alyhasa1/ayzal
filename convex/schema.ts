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
    stock_quantity: v.optional(v.number()),
    is_new_arrival: v.optional(v.boolean()),
    spotlight_rank: v.optional(v.number()),
    meta_title: v.optional(v.string()),
    meta_description: v.optional(v.string()),
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
    default_address_id: v.optional(v.id("user_addresses")),
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

  user_addresses: defineTable({
    user_id: v.id("users"),
    label: v.optional(v.string()),
    recipient_name: v.optional(v.string()),
    phone: v.optional(v.string()),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    postal_code: v.optional(v.string()),
    country: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_updated", ["user_id", "updated_at"]),

  orders: defineTable({
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    order_number: v.optional(v.string()),
    status: v.string(),
    payment_method_id: v.id("payment_methods"),
    subtotal: v.number(),
    total: v.number(),
    currency: v.string(),
    shipping_address: v.any(),
    tracking_carrier: v.optional(v.string()),
    tracking_number: v.optional(v.string()),
    tracking_url: v.optional(v.string()),
    contact_email: v.string(),
    contact_phone: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"])
    .index("by_order_number", ["order_number"])
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

  order_tracking_otps: defineTable({
    order_id: v.id("orders"),
    order_number: v.string(),
    channel: v.string(),
    destination: v.string(),
    code: v.string(),
    attempts: v.number(),
    consumed_at: v.optional(v.number()),
    expires_at: v.number(),
    created_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_order_number", ["order_number"])
    .index("by_expires", ["expires_at"]),

  order_tracking_sessions: defineTable({
    order_id: v.id("orders"),
    order_number: v.string(),
    token: v.string(),
    guest_token: v.optional(v.string()),
    expires_at: v.number(),
    created_at: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_order_number", ["order_number"])
    .index("by_expires", ["expires_at"]),

  variant_options: defineTable({
    name: v.string(),
    display_name: v.optional(v.string()),
    sort_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_sort", ["sort_order"]),

  variant_option_values: defineTable({
    option_id: v.id("variant_options"),
    value: v.string(),
    display_value: v.optional(v.string()),
    sort_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_option", ["option_id"])
    .index("by_option_sort", ["option_id", "sort_order"]),

  product_variants: defineTable({
    product_id: v.id("products"),
    sku: v.string(),
    title: v.optional(v.string()),
    option_value_ids: v.optional(v.array(v.id("variant_option_values"))),
    price: v.optional(v.number()),
    compare_at_price: v.optional(v.number()),
    barcode: v.optional(v.string()),
    image_url: v.optional(v.string()),
    weight_grams: v.optional(v.number()),
    in_stock: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_product", ["product_id"])
    .index("by_sku", ["sku"]),

  inventory_locations: defineTable({
    key: v.string(),
    name: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_active", ["active"]),

  inventory_levels: defineTable({
    variant_id: v.id("product_variants"),
    location_id: v.id("inventory_locations"),
    available: v.number(),
    reserved: v.number(),
    committed: v.number(),
    safety_stock: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_variant", ["variant_id"])
    .index("by_location", ["location_id"])
    .index("by_variant_location", ["variant_id", "location_id"]),

  stock_reservations: defineTable({
    variant_id: v.id("product_variants"),
    cart_id: v.optional(v.id("carts")),
    order_id: v.optional(v.id("orders")),
    quantity: v.number(),
    status: v.string(),
    expires_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_variant", ["variant_id"])
    .index("by_cart", ["cart_id"])
    .index("by_order", ["order_id"])
    .index("by_status", ["status"]),

  collections: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image_url: v.optional(v.string()),
    sort_order: v.number(),
    rules: v.optional(v.any()),
    published: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sort", ["sort_order"]),

  product_collections: defineTable({
    product_id: v.id("products"),
    collection_id: v.id("collections"),
    sort_order: v.optional(v.number()),
  })
    .index("by_product", ["product_id"])
    .index("by_collection", ["collection_id"]),

  product_tags: defineTable({
    product_id: v.id("products"),
    tag: v.string(),
    normalized_tag: v.string(),
    created_at: v.number(),
  })
    .index("by_product", ["product_id"])
    .index("by_tag", ["normalized_tag"]),

  carts: defineTable({
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    status: v.string(),
    currency: v.string(),
    subtotal: v.number(),
    discount_total: v.number(),
    shipping_total: v.number(),
    tax_total: v.number(),
    total: v.number(),
    applied_code: v.optional(v.string()),
    coupon_snapshot: v.optional(v.any()),
    shipping_method_id: v.optional(v.id("shipping_methods")),
    payment_method_id: v.optional(v.id("payment_methods")),
    checkout_context: v.optional(v.any()),
    last_activity_at: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"])
    .index("by_status", ["status"])
    .index("by_updated", ["updated_at"]),

  cart_items: defineTable({
    cart_id: v.id("carts"),
    product_id: v.id("products"),
    variant_id: v.optional(v.id("product_variants")),
    quantity: v.number(),
    unit_price: v.number(),
    line_subtotal: v.number(),
    discount_total: v.number(),
    line_total: v.number(),
    meta: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_cart", ["cart_id"])
    .index("by_product", ["product_id"])
    .index("by_variant", ["variant_id"]),

  abandoned_checkouts: defineTable({
    cart_id: v.optional(v.id("carts")),
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    step: v.string(),
    recover_token: v.optional(v.string()),
    recovered: v.boolean(),
    recovered_at: v.optional(v.number()),
    last_notified_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_cart", ["cart_id"])
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"])
    .index("by_recover_token", ["recover_token"]),

  discounts: defineTable({
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
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_active", ["active"]),

  discount_codes: defineTable({
    discount_id: v.id("discounts"),
    code: v.string(),
    normalized_code: v.string(),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_discount", ["discount_id"])
    .index("by_code", ["normalized_code"]),

  discount_redemptions: defineTable({
    discount_id: v.id("discounts"),
    code_id: v.optional(v.id("discount_codes")),
    order_id: v.optional(v.id("orders")),
    cart_id: v.optional(v.id("carts")),
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    amount: v.number(),
    created_at: v.number(),
  })
    .index("by_discount", ["discount_id"])
    .index("by_order", ["order_id"])
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"]),

  gift_cards: defineTable({
    code: v.string(),
    normalized_code: v.string(),
    initial_balance: v.number(),
    balance: v.number(),
    currency: v.string(),
    active: v.boolean(),
    expires_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_code", ["normalized_code"])
    .index("by_active", ["active"]),

  gift_card_transactions: defineTable({
    gift_card_id: v.id("gift_cards"),
    order_id: v.optional(v.id("orders")),
    amount: v.number(),
    type: v.string(),
    note: v.optional(v.string()),
    created_at: v.number(),
    actor_user_id: v.optional(v.id("users")),
  })
    .index("by_gift_card", ["gift_card_id"])
    .index("by_order", ["order_id"]),

  shipping_zones: defineTable({
    name: v.string(),
    country_codes: v.array(v.string()),
    state_codes: v.optional(v.array(v.string())),
    city_patterns: v.optional(v.array(v.string())),
    active: v.boolean(),
    sort_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_active", ["active"])
    .index("by_sort", ["sort_order"]),

  shipping_methods: defineTable({
    zone_id: v.optional(v.id("shipping_zones")),
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    carrier: v.optional(v.string()),
    eta_min_days: v.optional(v.number()),
    eta_max_days: v.optional(v.number()),
    flat_rate: v.optional(v.number()),
    free_over: v.optional(v.number()),
    active: v.boolean(),
    sort_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_zone", ["zone_id"])
    .index("by_key", ["key"])
    .index("by_active", ["active"])
    .index("by_sort", ["sort_order"]),

  shipping_rates: defineTable({
    method_id: v.id("shipping_methods"),
    min_subtotal: v.optional(v.number()),
    max_subtotal: v.optional(v.number()),
    weight_from: v.optional(v.number()),
    weight_to: v.optional(v.number()),
    rate: v.number(),
    currency: v.string(),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_method", ["method_id"])
    .index("by_active", ["active"]),

  shipments: defineTable({
    order_id: v.id("orders"),
    shipping_method_id: v.optional(v.id("shipping_methods")),
    carrier: v.string(),
    tracking_number: v.optional(v.string()),
    tracking_url: v.optional(v.string()),
    label_url: v.optional(v.string()),
    status: v.string(),
    shipped_at: v.optional(v.number()),
    delivered_at: v.optional(v.number()),
    metadata: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_status", ["status"])
    .index("by_tracking_number", ["tracking_number"]),

  shipment_events: defineTable({
    shipment_id: v.id("shipments"),
    order_id: v.optional(v.id("orders")),
    status: v.string(),
    note: v.optional(v.string()),
    raw_payload: v.optional(v.any()),
    occurred_at: v.number(),
    created_at: v.number(),
  })
    .index("by_shipment", ["shipment_id"])
    .index("by_order", ["order_id"])
    .index("by_status", ["status"]),

  tax_profiles: defineTable({
    name: v.string(),
    country_code: v.string(),
    state_code: v.optional(v.string()),
    city: v.optional(v.string()),
    rate: v.number(),
    inclusive: v.boolean(),
    active: v.boolean(),
    priority: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_country_state", ["country_code", "state_code"])
    .index("by_active", ["active"]),

  tax_rules: defineTable({
    tax_profile_id: v.id("tax_profiles"),
    product_category: v.optional(v.string()),
    product_id: v.optional(v.id("products")),
    collection_id: v.optional(v.id("collections")),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_profile", ["tax_profile_id"])
    .index("by_product", ["product_id"])
    .index("by_collection", ["collection_id"]),

  payment_intents: defineTable({
    order_id: v.optional(v.id("orders")),
    cart_id: v.optional(v.id("carts")),
    provider: v.string(),
    provider_intent_id: v.optional(v.string()),
    status: v.string(),
    amount: v.number(),
    currency: v.string(),
    metadata: v.optional(v.any()),
    idempotency_key: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_cart", ["cart_id"])
    .index("by_status", ["status"])
    .index("by_provider_intent", ["provider_intent_id"])
    .index("by_idempotency_key", ["idempotency_key"]),

  payment_events: defineTable({
    payment_intent_id: v.optional(v.id("payment_intents")),
    order_id: v.optional(v.id("orders")),
    provider: v.string(),
    event_id: v.string(),
    event_type: v.string(),
    signature_valid: v.optional(v.boolean()),
    payload: v.any(),
    created_at: v.number(),
  })
    .index("by_event_id", ["event_id"])
    .index("by_intent", ["payment_intent_id"])
    .index("by_order", ["order_id"]),

  refunds: defineTable({
    order_id: v.id("orders"),
    payment_intent_id: v.optional(v.id("payment_intents")),
    amount: v.number(),
    currency: v.string(),
    reason: v.optional(v.string()),
    status: v.string(),
    provider_refund_id: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_status", ["status"]),

  returns: defineTable({
    order_id: v.id("orders"),
    user_id: v.optional(v.id("users")),
    guest_email: v.optional(v.string()),
    status: v.string(),
    reason: v.optional(v.string()),
    resolution: v.string(),
    requested_at: v.number(),
    approved_at: v.optional(v.number()),
    completed_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_email"])
    .index("by_status", ["status"])
    .index("by_requested", ["requested_at"]),

  return_items: defineTable({
    return_id: v.id("returns"),
    order_item_id: v.id("order_items"),
    quantity: v.number(),
    condition: v.optional(v.string()),
    action: v.optional(v.string()),
    refund_amount: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_return", ["return_id"])
    .index("by_order_item", ["order_item_id"]),

  return_events: defineTable({
    return_id: v.id("returns"),
    status: v.string(),
    note: v.optional(v.string()),
    actor_user_id: v.optional(v.id("users")),
    created_at: v.number(),
  }).index("by_return", ["return_id"]),

  wishlists: defineTable({
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    share_token: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"])
    .index("by_share_token", ["share_token"]),

  wishlist_items: defineTable({
    wishlist_id: v.id("wishlists"),
    product_id: v.id("products"),
    variant_id: v.optional(v.id("product_variants")),
    added_at: v.number(),
  })
    .index("by_wishlist", ["wishlist_id"])
    .index("by_product", ["product_id"])
    .index("by_variant", ["variant_id"]),

  reviews: defineTable({
    product_id: v.id("products"),
    user_id: v.optional(v.id("users")),
    guest_name: v.optional(v.string()),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    verified_purchase: v.boolean(),
    status: v.string(),
    helpful_count: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_product", ["product_id"])
    .index("by_status", ["status"])
    .index("by_product_status", ["product_id", "status"]),

  review_media: defineTable({
    review_id: v.id("reviews"),
    url: v.string(),
    media_type: v.string(),
    sort_order: v.number(),
    created_at: v.number(),
  }).index("by_review", ["review_id"]),

  review_votes: defineTable({
    review_id: v.id("reviews"),
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    vote: v.string(),
    created_at: v.number(),
  })
    .index("by_review", ["review_id"])
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"]),

  product_questions: defineTable({
    product_id: v.id("products"),
    user_id: v.optional(v.id("users")),
    guest_name: v.optional(v.string()),
    question: v.string(),
    status: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_product", ["product_id"])
    .index("by_status", ["status"]),

  product_answers: defineTable({
    question_id: v.id("product_questions"),
    user_id: v.optional(v.id("users")),
    answer: v.string(),
    is_admin: v.boolean(),
    status: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_question", ["question_id"]),

  support_tickets: defineTable({
    user_id: v.optional(v.id("users")),
    guest_email: v.optional(v.string()),
    guest_phone: v.optional(v.string()),
    order_id: v.optional(v.id("orders")),
    subject: v.string(),
    status: v.string(),
    priority: v.string(),
    channel: v.string(),
    assigned_to: v.optional(v.id("users")),
    first_response_at: v.optional(v.number()),
    resolved_at: v.optional(v.number()),
    sla_due_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_order", ["order_id"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_assignee", ["assigned_to"])
    .index("by_sla_due", ["sla_due_at"]),

  support_events: defineTable({
    ticket_id: v.id("support_tickets"),
    type: v.string(),
    note: v.optional(v.string()),
    payload: v.optional(v.any()),
    actor_user_id: v.optional(v.id("users")),
    created_at: v.number(),
  })
    .index("by_ticket", ["ticket_id"])
    .index("by_type", ["type"]),

  customer_segments: defineTable({
    name: v.string(),
    key: v.optional(v.string()),
    rules: v.any(),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_active", ["active"]),

  segment_memberships: defineTable({
    segment_id: v.id("customer_segments"),
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    source: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_segment", ["segment_id"])
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"]),

  campaigns: defineTable({
    name: v.string(),
    channel: v.string(),
    status: v.string(),
    segment_id: v.optional(v.id("customer_segments")),
    template_id: v.optional(v.id("notification_templates")),
    schedule_at: v.optional(v.number()),
    config: v.any(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_channel", ["channel"])
    .index("by_segment", ["segment_id"]),

  campaign_runs: defineTable({
    campaign_id: v.id("campaigns"),
    status: v.string(),
    started_at: v.optional(v.number()),
    finished_at: v.optional(v.number()),
    recipient_count: v.optional(v.number()),
    success_count: v.optional(v.number()),
    failure_count: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_campaign", ["campaign_id"])
    .index("by_status", ["status"]),

  notification_templates: defineTable({
    key: v.string(),
    channel: v.string(),
    name: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.array(v.string())),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_channel", ["channel"]),

  notification_jobs: defineTable({
    template_id: v.optional(v.id("notification_templates")),
    campaign_run_id: v.optional(v.id("campaign_runs")),
    user_id: v.optional(v.id("users")),
    guest_contact: v.optional(v.string()),
    channel: v.string(),
    status: v.string(),
    payload: v.any(),
    provider_message_id: v.optional(v.string()),
    retries: v.number(),
    next_attempt_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_channel", ["channel"])
    .index("by_user", ["user_id"])
    .index("by_campaign_run", ["campaign_run_id"]),

  notification_logs: defineTable({
    job_id: v.optional(v.id("notification_jobs")),
    template_id: v.optional(v.id("notification_templates")),
    channel: v.string(),
    event: v.string(),
    provider_payload: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_job", ["job_id"])
    .index("by_template", ["template_id"])
    .index("by_channel", ["channel"]),

  notification_preferences: defineTable({
    user_id: v.id("users"),
    email_marketing: v.boolean(),
    email_order_updates: v.boolean(),
    email_review_requests: v.boolean(),
    whatsapp_marketing: v.boolean(),
    whatsapp_order_updates: v.boolean(),
    whatsapp_review_requests: v.boolean(),
    timezone: v.optional(v.string()),
    quiet_hours_start: v.optional(v.string()),
    quiet_hours_end: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]),

  analytics_events: defineTable({
    name: v.string(),
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    session_id: v.optional(v.string()),
    path: v.optional(v.string()),
    referrer: v.optional(v.string()),
    properties: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"])
    .index("by_created", ["created_at"]),

  experiments: defineTable({
    key: v.string(),
    name: v.string(),
    status: v.string(),
    variants: v.any(),
    targeting: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_status", ["status"]),

  feature_flags: defineTable({
    key: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),
    rules: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_key", ["key"]),

  audit_logs: defineTable({
    actor_user_id: v.optional(v.id("users")),
    actor_email: v.optional(v.string()),
    action: v.string(),
    entity_type: v.string(),
    entity_id: v.optional(v.string()),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    meta: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_actor", ["actor_user_id"])
    .index("by_entity", ["entity_type", "entity_id"])
    .index("by_action", ["action"])
    .index("by_created", ["created_at"]),

  admin_roles: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_key", ["key"]),

  admin_role_assignments: defineTable({
    user_id: v.optional(v.id("users")),
    email: v.optional(v.string()),
    role_id: v.id("admin_roles"),
    created_at: v.number(),
    created_by: v.optional(v.id("users")),
  })
    .index("by_user", ["user_id"])
    .index("by_email", ["email"])
    .index("by_role", ["role_id"]),

  customer_timeline_events: defineTable({
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    event_type: v.string(),
    source: v.string(),
    entity_type: v.optional(v.string()),
    entity_id: v.optional(v.string()),
    payload: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_guest", ["guest_token"])
    .index("by_type", ["event_type"]),
});
