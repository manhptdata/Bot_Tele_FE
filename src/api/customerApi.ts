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
  firstSeen?: string;
  lastSeen?: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface CustomerQueryParams {
  keyword?: string;
  isDeleted?: boolean;
  page?: number;
  size?: number;
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
    hardDeleteCustomer: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/admin/customers/${id}/hard-delete`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useSoftDeleteCustomerMutation,
  useSoftDeleteBatchMutation,
  useRestoreCustomerMutation,
  useRestoreBatchMutation,
  useHardDeleteCustomerMutation,
} = customerApi;
