import { baseApi } from './baseApi';
import { OrderTable, OrderDetail } from '../types';
import { PageResponse } from '../types/pagination';

export interface OrderQueryParams {
  keyword?: string;
  status?: string;
  page?: number;
  size?: number;
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<PageResponse<OrderTable>, OrderQueryParams | void>({
      query: (params) => {
        if (!params) return '/admin/orders';
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.status) searchParams.append('status', params.status);
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/admin/orders?${searchParams.toString()}`;
      },
      providesTags: ['Order'],
    }),
    getOrderById: builder.query<OrderDetail, number>({
      query: (id) => `/admin/orders/${id}`,
      providesTags: ['Order'],
    }),
    confirmOrder: builder.mutation<any, string>({
      query: (orderCode) => ({
        url: `/admin/orders/${orderCode}/confirm`,
        method: 'PUT',
      }),
      invalidatesTags: ['Order', 'Product'], // Confirmed order might affect stock
    }),
    retryDelivery: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/admin/orders/${orderId}/retry-delivery`,
        method: 'POST',
      }),
      invalidatesTags: ['Order'],
    }),
    markManuallyDelivered: builder.mutation<void, { orderId: number; note: string }>({
      query: ({ orderId, note }) => ({
        url: `/admin/orders/${orderId}/mark-manually-delivered`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useConfirmOrderMutation,
  useRetryDeliveryMutation,
  useMarkManuallyDeliveredMutation,
} = orderApi;
