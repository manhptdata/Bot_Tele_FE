import { baseApi } from './baseApi';
import type { PageResponse } from '../types/pagination';

export type UpgradeFieldType = 'text' | 'email' | 'password' | 'url' | 'textarea';
export interface UpgradeFormField {
  key: string;
  label: string;
  type: UpgradeFieldType;
  placeholder?: string;
  required: boolean;
  sensitive: boolean;
  maxLength: number;
}
export interface UpgradeService {
  id: number; name: string; slug: string; description?: string; imageUrl?: string;
  price: number; isActive: boolean; maxQuantityPerOrder: number;
  estimatedProcessingTime?: string; formSchema: { fields: UpgradeFormField[] };
  formUiSchema?: { bulkInputGuide?: string; bulkInputExample?: string; bulkInputSensitive?: boolean; [key: string]: unknown }; sensitiveDataRetention: string;
  createdAt: string; updatedAt: string;
}
export interface UpgradeServicePayload {
  name: string; slug: string; description?: string; imageUrl?: string; price: string;
  isActive: boolean; maxQuantityPerOrder: number; estimatedProcessingTime?: string;
  formSchema: { fields: UpgradeFormField[] }; formUiSchema?: { bulkInputGuide?: string; bulkInputExample?: string; bulkInputSensitive?: boolean; [key: string]: unknown };
  sensitiveDataRetention: string;
}
export interface UpgradeSubmission { id: number; itemIndex: number; formData: Record<string, unknown>; submittedAt: string; sensitiveDataDeletedAt?: string; }
export interface UpgradeHistory { action: string; fromStatus?: string; toStatus?: string; actorType: string; actorId?: string; note?: string; createdAt: string; }
export interface UpgradeRefund {
  method: 'WALLET' | 'BANK_TRANSFER'; status: string; amount: number; reason?: string;
  reference?: string; walletTransactionId?: number; balanceBefore?: number;
  balanceAfter?: number; completedAt?: string;
}
export interface UpgradeOrder {
  id: number; orderCode: string; serviceId: number; serviceName: string;
  customerTelegramId: number; customerUsername?: string; customerFullName?: string;
  unitPrice: number; quantity: number; subtotalAmount: number; feeAmount: number;
  discountAmount: number; voucherCode?: string; totalAmount: number; paymentMethod: string; paymentStatus: string;
  serviceStatus: string; formSchema: { fields: UpgradeFormField[] }; assignedAdminId?: number;
  correctionReason?: string; refundReason?: string; refundReference?: string;
  paidAt?: string; submittedAt?: string; processingAt?: string; completedAt?: string;
  createdAt: string; updatedAt: string; submissions?: UpgradeSubmission[]; history?: UpgradeHistory[];
  refund?: UpgradeRefund;
}

export const upgradeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUpgradeServices: builder.query<PageResponse<UpgradeService>, { keyword?: string; page?: number; size?: number } | void>({
      query: (p) => ({ url: '/admin/upgrade-services', params: p || {} }), providesTags: ['UpgradeService' as any],
    }),
    createUpgradeService: builder.mutation<UpgradeService, UpgradeServicePayload>({
      query: (body) => ({ url: '/admin/upgrade-services', method: 'POST', body }), invalidatesTags: ['UpgradeService' as any],
    }),
    updateUpgradeService: builder.mutation<UpgradeService, { id: number; data: UpgradeServicePayload }>({
      query: ({ id, data }) => ({ url: `/admin/upgrade-services/${id}`, method: 'PUT', body: data }), invalidatesTags: ['UpgradeService' as any],
    }),
    deleteUpgradeService: builder.mutation<void, number>({
      query: (id) => ({ url: `/admin/upgrade-services/${id}`, method: 'DELETE' }), invalidatesTags: ['UpgradeService' as any],
    }),
    getUpgradeOrders: builder.query<PageResponse<UpgradeOrder>, { paymentStatus?: string; serviceStatus?: string; keyword?: string; page?: number; size?: number }>({
      query: (params) => ({ url: '/admin/upgrade-orders', params }), providesTags: ['UpgradeOrder' as any],
    }),
    getUpgradeOrder: builder.query<UpgradeOrder, number>({
      query: (id) => `/admin/upgrade-orders/${id}`, providesTags: (_r, _e, id) => [{ type: 'UpgradeOrder' as any, id }],
    }),
    getFullSubmission: builder.query<Record<string, unknown>, { orderId: number; submissionId: number }>({
      query: ({ orderId, submissionId }) => `/admin/upgrade-orders/${orderId}/submissions/${submissionId}/full-data`,
    }),
    upgradeAction: builder.mutation<UpgradeOrder, { id: number; action: string; reason?: string; refundReference?: string }>({
      query: ({ id, action, ...body }) => ({ url: `/admin/upgrade-orders/${id}/${action}`, method: 'POST', body }),
      invalidatesTags: ['UpgradeOrder' as any, 'Notification'],
    }),
  }),
});

export const {
  useGetUpgradeServicesQuery, useCreateUpgradeServiceMutation, useUpdateUpgradeServiceMutation,
  useDeleteUpgradeServiceMutation, useGetUpgradeOrdersQuery, useGetUpgradeOrderQuery,
  useLazyGetFullSubmissionQuery, useUpgradeActionMutation,
} = upgradeApi;
