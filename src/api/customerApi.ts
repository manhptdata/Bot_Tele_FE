import { baseApi } from './baseApi';
import { PageResponse } from '../types/pagination';

export interface TelegramCustomer {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  totalOrders: number;
  totalSpent: number;
  walletBalance?: number;
  firstSeen?: string;
  lastSeen?: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface WalletTransaction {
  id: number;
  type: string; // DEPOSIT, PURCHASE, REFUND, ADMIN_ADJUST, DEPOSIT_REQUEST
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceCode?: string;
  orderCode?: string;
  description?: string;
  createdAt: string;
}

export interface CustomerOrder {
  id: number;
  orderCode: string;
  subtotalAmount: number;
  feeAmount: number;
  totalAmount: number;
  status: string;
  deliveryMode: string;
  paymentMethod: string;
  adminNote?: string;
  createdAt: string;
}

export interface CustomerQueryParams {
  keyword?: string;
  isDeleted?: boolean;
  page?: number;
  size?: number;
}

export interface AdjustWalletPayload {
  action: 'DEPOSIT' | 'REFUND';
  amount: number;
  reason: string;
  requestId: string;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PageResponse<TelegramCustomer>, CustomerQueryParams | void>({
      query: (params) => {
        if (!params) return '/admin/customers';
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.isDeleted !== undefined) searchParams.append('isDeleted', params.isDeleted.toString());
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/admin/customers?${searchParams.toString()}`;
      },
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query<TelegramCustomer, number>({
      query: (id) => `/admin/customers/${id}`,
      providesTags: ['Customer'],
    }),
    getCustomerWalletTransactions: builder.query<WalletTransaction[], number>({
      query: (id) => `/admin/customers/${id}/wallet-transactions`,
      providesTags: ['Customer'],
    }),
    getCustomerOrders: builder.query<CustomerOrder[], number>({
      query: (id) => `/admin/customers/${id}/orders`,
      providesTags: ['Customer'],
    }),
    adjustCustomerWallet: builder.mutation<{ message: string }, { customerId: number; data: AdjustWalletPayload }>({
      query: ({ customerId, data }) => ({
        url: `/admin/customers/${customerId}/adjust-wallet`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customer'],
    }),
    softDeleteCustomer: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
    softDeleteBatch: builder.mutation<{ message: string }, number[]>({
      query: (ids) => ({
        url: '/admin/customers/soft-delete-batch',
        method: 'POST',
        body: ids,
      }),
      invalidatesTags: ['Customer'],
    }),
    restoreCustomer: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/customers/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Customer'],
    }),
    restoreBatch: builder.mutation<{ message: string }, number[]>({
      query: (ids) => ({
        url: '/admin/customers/restore-batch',
        method: 'POST',
        body: ids,
      }),
      invalidatesTags: ['Customer'],
    }),
    requestHardDeleteOtp: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/customers/${id}/request-hard-delete-otp`,
        method: 'POST',
      }),
    }),
    hardDeleteCustomer: builder.mutation<{ message: string }, { customerId: number; otp: string }>({
      query: ({ customerId, otp }) => ({
        url: `/admin/customers/${customerId}/hard-delete?otp=${encodeURIComponent(otp)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useGetCustomerWalletTransactionsQuery,
  useGetCustomerOrdersQuery,
  useAdjustCustomerWalletMutation,
  useSoftDeleteCustomerMutation,
  useSoftDeleteBatchMutation,
  useRestoreCustomerMutation,
  useRestoreBatchMutation,
  useRequestHardDeleteOtpMutation,
  useHardDeleteCustomerMutation,
} = customerApi;

