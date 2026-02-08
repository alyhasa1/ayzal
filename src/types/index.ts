export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  videoUrl?: string;
  category: string;
  categorySlug?: string;
  categoryId?: string;
  tags?: string[];
  paymentMethods?: PaymentMethod[];
  description?: string;
  fabric?: string;
  work?: string;
  includes?: string[];
  dimensions?: {
    kameez: string;
    dupatta: string;
    shalwar: string;
  };
  care?: string[];
  sizes?: string[];
  inStock?: boolean;
  stockQuantity?: number;
  sku?: string;
  isNewArrival?: boolean;
  spotlightRank?: number;
  metaTitle?: string;
  metaDescription?: string;
  variants?: ProductVariant[];
  variantOptions?: VariantOption[];
}

export interface CartItem extends Product {
  quantity: number;
  size: string;
}

export interface PaymentMethod {
  id: string;
  key: string;
  label: string;
  instructions?: string;
  active: boolean;
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  enabled?: boolean;
}

export interface PressQuote {
  id: string;
  text: string;
  source: string;
  enabled?: boolean;
}

export interface UserProfile {
  id?: string;
  full_name?: string;
  phone?: string;
  shipping_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderStatusEvent {
  id: string;
  status: string;
  note?: string;
  created_at: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  guestToken?: string;
  status: string;
  subtotal: number;
  total: number;
  currency: string;
  contact_email: string;
  contact_phone: string;
  created_at: number;
  payment_method?: PaymentMethod;
  items: OrderItem[];
  status_events: OrderStatusEvent[];
  shipping_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title?: string;
  sku: string;
  price?: number;
  compareAtPrice?: number;
  imageUrl?: string;
  inStock: boolean;
  optionValues?: string[];
}

export interface CartLine {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  lineTotal: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  status: string;
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  appliedCode?: string;
  shippingMethodId?: string;
  paymentMethodId?: string;
  checkoutContext?: {
    contact_email?: string;
    contact_phone?: string;
    shipping_address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  items: CartLine[];
}

export interface CheckoutState {
  cartId: string;
  step: "information" | "shipping" | "payment" | "review" | "completed";
  contact?: {
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  paymentMethodId?: string;
  shippingMethodId?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: string;
  shippedAt?: number;
  deliveredAt?: number;
}

export interface ReturnItem {
  id: string;
  orderItemId: string;
  quantity: number;
  condition?: string;
  action?: string;
  refundAmount?: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  status: string;
  reason?: string;
  resolution: string;
  requestedAt: number;
  approvedAt?: number;
  completedAt?: number;
  items: ReturnItem[];
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  status: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  mediaUrls?: string[];
  createdAt: number;
}

export interface CustomerTimelineEvent {
  id: string;
  eventType: string;
  source: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  createdAt: number;
}

export interface ContentPage {
  slug: string;
  title: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: number;
  published?: boolean;
  noindex?: boolean;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  coverImage?: string;
  tags?: string[];
  publishedAt?: number;
  updatedAt?: number;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
  noindex?: boolean;
}
