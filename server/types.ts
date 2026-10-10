export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  brand: string;
  images: string[];
  featured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  itemCount?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  unitPrice: number; // frozen at purchase
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'card' | 'cod' | 'stripe';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryNotes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  shippingFee: number;
  shippingMethod: string;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  carrier?: string;
  trackingNumber?: string;
  inventoryDeducted: boolean;
  inventoryRestored: boolean;
  internalNotes?: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityChange: number; // positive or negative
  stockAfter: number;
  reason: 'order_placed' | 'order_cancelled' | 'order_returned' | 'manual_adjustment' | 'restock' | 'initial_seed';
  relatedOrderId?: string | null;
  performedBy: string;
  notes?: string;
  timestamp: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUsageLimit: number;
  currentUsageCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  taxRatePercent: number;
  allowGuestCheckout: boolean;
}
