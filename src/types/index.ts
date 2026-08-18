export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  deliveryMode: 'AUTO' | 'MANUAL';
  stockCount: number;
  accountFormat: string;
  displayType: 'MULTI_LINE' | 'RAW';
  attributes?: Record<string, string>;
}

/** Request shape is intentionally separate because the form preserves price as
 * a decimal string until it reaches the backend BigDecimal parser. */
export interface ProductUpsertPayload {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  imageUrl?: string;
  isActive: boolean;
  deliveryMode: 'AUTO' | 'MANUAL';
  stockCount?: number;
  accountFormat: string;
  displayType: 'MULTI_LINE' | 'RAW';
  attributes?: Record<string, string>;
}

export interface Account {
  id: number;
  productId: number;
  accountData: string[];
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  soldAt: string | null;
  orderCode?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveredAccounts: string[][];
}

export interface OrderDetail {
  id: number;
  orderCode: string;
  subtotalAmount?: number;
  feeAmount?: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'DELIVERY_PENDING' | 'PAID_MANUAL_PENDING' | 'PAID_REVIEW_REQUIRED' | 'DELIVERY_FAILED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_UNDERPAID' | 'REFUNDED' | 'EXPIRED';
  deliveryMode: 'AUTO' | 'MANUAL';
  paymentMethod: 'WALLET' | 'BANK_TRANSFER' | 'FREE';
  adminNote?: string;
  createdAt: string;
  customer: {
    telegramId: number;
    username: string;
    firstName: string;
  };
  items: OrderItem[];
}

export interface OrderTable {
  id: number;
  orderCode: string;
  subtotalAmount?: number;
  feeAmount?: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'DELIVERY_PENDING' | 'PAID_MANUAL_PENDING' | 'PAID_REVIEW_REQUIRED' | 'DELIVERY_FAILED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_UNDERPAID' | 'REFUNDED' | 'EXPIRED';
  deliveryMode: 'AUTO' | 'MANUAL';
  paymentMethod: 'WALLET' | 'BANK_TRANSFER' | 'FREE';
  createdAt: string;
  customer: {
    telegramId: number;
    username: string;
    firstName: string;
  };
}

export interface PaymentConfig {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  webhookProvider?: string;
  webhookApiKey?: string;
  isWebhookApiKeyConfigured?: boolean;
  isDefault: boolean;
  paymentTimeoutMinutes?: number;
  bankFeeType?: 'FIXED' | 'PERCENT';
  bankFeeAmount?: number;
  guideContent?: string;
}
