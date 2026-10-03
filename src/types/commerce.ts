export interface ProductVariant {
  id: string;
  size: 'Single' | 'Double' | 'Queen' | 'King' | 'Super King' | 'Custom';
  dimensions?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  available: boolean;
}

export interface Product {
  id: string;
  title: string;
  category: 'Mattresses' | 'Bed Frames' | 'Pillows & Linen' | 'Bundles' | 'Accessories';
  description: string;
  features: string[];
  basePrice: number;
  imageUrl: string;
  variants: ProductVariant[];
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productTitle: string;
  variantSize: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type OrderStatus = 'pending_confirmation' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  paymentMethod: 'Cash on Delivery (COD)' | 'Bank Transfer / GCash' | 'Credit Card / Online Link';
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface CustomerProfile {
  id: string;
  psid: string;
  name: string;
  phone?: string;
  email?: string;
  deliveryAddress?: string;
  totalOrders: number;
  totalSpend: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string; // e.g. "Asia/Manila", "America/New_York"
  openHour: number; // 9 = 9 AM
  closeHour: number; // 18 = 6 PM
  daysOpen: number[]; // 1 to 6 (Mon to Sat) or 0 to 6
  afterHoursMessage: string;
}
