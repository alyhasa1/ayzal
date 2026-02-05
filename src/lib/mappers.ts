import type { PaymentMethod, Product } from "@/types";

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
  image: product.primary_image_url,
  images: product.image_urls ?? [],
  category: product.category_name ?? "",
  categorySlug: product.category_slug ?? "",
  categoryId: product.category_id,
  description: product.description,
  fabric: product.fabric,
  work: product.work,
  includes: product.includes ?? [],
  dimensions: product.dimensions,
  care: product.care ?? [],
  sizes: product.sizes ?? [],
  inStock: product.in_stock,
  sku: product.sku,
  isNewArrival: product.is_new_arrival,
  spotlightRank: product.spotlight_rank,
  paymentMethods: product.payment_methods?.map(mapPaymentMethod) ?? [],
});
