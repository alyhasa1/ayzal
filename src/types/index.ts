export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  categorySlug?: string;
  categoryId?: string;
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
  sku?: string;
  isNewArrival?: boolean;
  spotlightRank?: number;
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
