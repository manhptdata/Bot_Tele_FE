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
  categoryId: number;
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
  categoryId: number | null;
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

export interface ReservedAccountDto {
  accountId: number;
  orderItemId: number;
  fieldNames: string[];
  accountData: string[];
  status: string;
}

export interface AvailableAccountDto {
  id: number;
  fieldNames: string[];
  maskedValues: string[];
}

export interface AvailableAccountPageDto {
  accounts: AvailableAccountDto[];
  availableCount: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveredAccounts: string[][];
  reservedAccounts?: ReservedAccountDto[];
}

export interface OrderDetail {
  id: number;
  orderCode: string;
  subtotalAmount?: number;
  feeAmount?: number;
  discountAmount?: number;
  voucherCode?: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'DELIVERY_PENDING' | 'PAID_MANUAL_PENDING' | 'PAID_REVIEW_REQUIRED' | 'DELIVERY_FAILED' | 'DELIVERY_REVIEW_REQUIRED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_UNDERPAID' | 'REFUNDED' | 'EXPIRED';
  deliveryMode: 'AUTO' | 'MANUAL';
  paymentMethod: 'WALLET' | 'BANK_TRANSFER' | 'FREE';
  deliverySource?: 'INVENTORY' | 'CUSTOM';
  manualDeliveryContent?: string;
  manuallyDeliveredBy?: string;
  manuallyDeliveredAt?: string;
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
  discountAmount?: number;
  voucherCode?: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'DELIVERY_PENDING' | 'PAID_MANUAL_PENDING' | 'PAID_REVIEW_REQUIRED' | 'DELIVERY_FAILED' | 'DELIVERY_REVIEW_REQUIRED' | 'COMPLETED' | 'CANCELLED' | 'CANCELLED_UNDERPAID' | 'REFUNDED' | 'EXPIRED';
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
  bankCode?: string;
  isActive: boolean;
  isDefault: boolean;
  webhookProvider?: string;
  isWebhookApiKeyConfigured?: boolean;
  isWebhookSecretConfigured?: boolean;
  providerBankAccId?: string;
  paymentTimeoutMinutes?: number;
  bankFeeType?: 'FIXED' | 'PERCENT';
  bankFeeAmount?: number;
  guideContent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentConfigSaveRequest {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  bankCode?: string;
  isActive?: boolean;
  webhookProvider?: string;
  providerBankAccId?: string;
  paymentTimeoutMinutes?: number;
  bankFeeType?: 'FIXED' | 'PERCENT';
  bankFeeAmount?: number;
  guideContent?: string;
  webhookApiKey?: string;
  webhookSecret?: string;
  clearWebhookApiKey?: boolean;
  clearWebhookSecret?: boolean;
  adminPassword?: string;
}

export interface StepUpPasswordRequest {
  adminPassword: string;
}

export type BotMode = 'LONG_POLLING' | 'WEBHOOK';
export type BotStatus = 'DISCONNECTED' | 'STARTING' | 'RUNNING' | 'STOPPED' | 'FAILED';

export interface BotConfig {
  id?: number;
  botUsername: string;
  maskedToken: string;
  mode: BotMode;
  webhookUrl?: string;
  adminChatId?: number;
  contactTelegram?: string;
  contactPhone?: string;
  status: BotStatus;
  isActive: boolean;
  errorMessage?: string;
  updatedAt?: string;
}

export interface SetupStatus {
  botConnected: boolean;
  productsCreated: boolean;
  paymentConfigured: boolean;
  botUsername?: string;
}

export interface ConnectBotRequest {
  botToken: string;
  mode?: BotMode;
  webhookUrl?: string;
  adminPassword: string;
}

export interface BotConfigSaveRequest {
  mode: BotMode;
  webhookUrl?: string;
  webhookSecretToken?: string;
  clearWebhookSecret?: boolean;
  adminChatId?: number;
  contactTelegram?: string;
  contactPhone?: string;
  adminPassword: string;
}

export interface DisconnectBotRequest {
  adminPassword: string;
}


