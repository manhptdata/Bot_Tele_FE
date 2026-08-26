import { baseApi } from './baseApi';
import { Account } from '../types';
import { PageResponse } from '../types/pagination';

export interface AccountQueryParams {
  keyword?: string;
  productId?: number;
  status?: string;
  page?: number;
  size?: number;
}

export const accountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<PageResponse<Account>, AccountQueryParams | void>({
      query: (params) => {
        if (!params) return '/accounts';
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.productId) searchParams.append('productId', params.productId.toString());
        if (params.status) searchParams.append('status', params.status);
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/accounts?${searchParams.toString()}`;
      },
      providesTags: ['Account'],
    }),
    addBulkAccounts: builder.mutation<any, { productId: number; accountDataList: string[][]; notifyCustomers?: boolean; customMessage?: string }>({
      query: (body) => ({
        url: '/accounts/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Account', 'Product'],
    }),
    importExcel: builder.mutation<any, { productId: number; file: File; notifyCustomers?: boolean; customMessage?: string }>({
      query: ({ productId, file, notifyCustomers, customMessage }) => {
        const formData = new FormData();
        formData.append('file', file);
        const notifyParam = notifyCustomers ? '&notifyCustomers=true' : '';
        const messageParam = customMessage ? `&customMessage=${encodeURIComponent(customMessage)}` : '';
        return {
          url: `/accounts/import/excel?productId=${productId}${notifyParam}${messageParam}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Account', 'Product'],
    }),
    deleteAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `/accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Account', 'Product'],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useAddBulkAccountsMutation,
  useImportExcelMutation,
  useDeleteAccountMutation,
} = accountApi;
