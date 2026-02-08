import type {
  Cart,
  CartLine,
  Order,
  PaymentMethod,
  Product,
  ProductVariant,
} from "@/types";

export const mapPaymentMethod = (method: any): PaymentMethod => ({
  id: method._id,
  key: method.key,
  label: method.label,
  instructions: method.instructions,
  active: method.active,
});

export const mapProduct = (product: any): Product => ({
  id: product._id,
  name: product.name,
  slug: product.slug,
  price: product.price,
  compareAtPrice: product.compare_at_price,
  image: product.primary_image_url,
  images: product.image_urls ?? [],
  category: product.category_name ?? "",
  categorySlug: product.category_slug ?? "",
  categoryId: product.category_id,
  tags: product.tags ?? [],
  description: product.description,
  fabric: product.fabric,
  work: product.work,
  includes: product.includes ?? [],
  dimensions: product.dimensions,
  care: product.care ?? [],
  sizes: product.sizes ?? [],
  inStock: product.in_stock,
  stockQuantity:
    typeof product.stock_quantity === "number"
      ? product.stock_quantity
      : product.in_stock === false
      ? 0
      : 1,
  sku: product.sku,
  isNewArrival: product.is_new_arrival,
  spotlightRank: product.spotlight_rank,
  metaTitle: product.meta_title,
  metaDescription: product.meta_description,
  variants: (product.variants ?? []).map(mapProductVariant),
  variantOptions: (product.variant_options ?? []).map((option: any) => ({
    id: option._id,
    name: option.name,
    values: option.values ?? [],
  })),
  paymentMethods: product.payment_methods?.map(mapPaymentMethod) ?? [],
});

export const mapProductVariant = (variant: any): ProductVariant => ({
  id: variant._id,
  title: variant.title,
  sku: variant.sku,
  price: variant.price,
  compareAtPrice: variant.compare_at_price,
  imageUrl: variant.image_url,
  inStock: variant.in_stock !== false,
  optionValues: variant.option_values ?? [],
});

export const mapCartLine = (item: any): CartLine => ({
  id: item._id,
  productId: item.product_id,
  variantId: item.variant_id,
  quantity: item.quantity,
  unitPrice: item.unit_price,
  lineSubtotal: item.line_subtotal,
  lineTotal: item.line_total,
  product: item.product ? mapProduct(item.product) : undefined,
  variant: item.variant ? mapProductVariant(item.variant) : undefined,
});

export const mapCart = (cart: any): Cart => ({
  id: cart._id,
  status: cart.status,
  currency: cart.currency,
  subtotal: cart.subtotal,
  discountTotal: cart.discount_total ?? 0,
  shippingTotal: cart.shipping_total ?? 0,
  taxTotal: cart.tax_total ?? 0,
  total: cart.total,
  appliedCode: cart.applied_code,
  shippingMethodId: cart.shipping_method_id,
  paymentMethodId: cart.payment_method_id,
  checkoutContext: cart.checkout_context,
  items: (cart.items ?? []).map(mapCartLine),
});

export const mapOrder = (order: any): Order => ({
  id: order._id,
  orderNumber: order.order_number,
  guestToken: order.guest_token,
  status: order.status,
  subtotal: order.subtotal,
  total: order.total,
  currency: order.currency,
  contact_email: order.contact_email,
  contact_phone: order.contact_phone,
  created_at: order.created_at,
  payment_method: order.payment_method ? mapPaymentMethod(order.payment_method) : undefined,
  items: order.items ?? [],
  status_events: order.status_events ?? [],
  shipping_address: order.shipping_address,
});
