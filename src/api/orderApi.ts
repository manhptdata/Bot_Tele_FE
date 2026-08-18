import { baseApi } from './baseApi';
import { OrderTable, OrderDetail, AvailableAccountPageDto, ReservedAccountDto } from '../types';
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
      invalidatesTags: ['Order', 'Product'],
    }),
    retryDelivery: builder.mutation<void, number>({
      query: (orderId) => ({
        url: `/admin/orders/${orderId}/retry-delivery`,
        method: 'POST',
      }),
      invalidatesTags: ['Order'],
    }),

    // 1. Lấy danh sách tài khoản khả dụng trong kho (có phân trang & che mờ mật khẩu)
    getAvailableAccountsForItem: builder.query<
      AvailableAccountPageDto,
      { orderId: number; orderItemId: number; page?: number; size?: number }
    >({
      query: ({ orderId, orderItemId, page = 0, size = 10 }) =>
        `/admin/orders/${orderId}/items/${orderItemId}/available-accounts?page=${page}&size=${size}`,
      providesTags: ['Account'],
    }),

    // 2. Bốc giữ chỗ 1 tài khoản từ kho (AVAILABLE -> RESERVED)
    reserveAccount: builder.mutation<
      ReservedAccountDto,
      { orderId: number; orderItemId: number; accountId: number }
    >({
      query: ({ orderId, orderItemId, accountId }) => ({
        url: `/admin/orders/${orderId}/items/${orderItemId}/reservations`,
        method: 'POST',
        body: { accountId },
      }),
      invalidatesTags: ['Order', 'Account'],
    }),

    // 3. Bỏ chọn tài khoản (RESERVED -> AVAILABLE)
    releaseReservedAccount: builder.mutation<
      void,
      { orderId: number; orderItemId: number; accountId: number }
    >({
      query: ({ orderId, orderItemId, accountId }) => ({
        url: `/admin/orders/${orderId}/items/${orderItemId}/reservations/${accountId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order', 'Account'],
    }),

    // 4. Hoàn tất giao hàng cho đơn MANUAL
    completeManualDelivery: builder.mutation<
      { message: string },
      { orderId: number; source: 'INVENTORY' | 'CUSTOM'; content?: string; releaseExistingReservations?: boolean }
    >({
      query: ({ orderId, source, content, releaseExistingReservations = false }) => ({
        url: `/admin/orders/${orderId}/manual-delivery/complete`,
        method: 'POST',
        body: { source, content, releaseExistingReservations },
      }),
      invalidatesTags: ['Order', 'Account', 'Product'],
    }),

    // 5. Đánh dấu đã giao thủ công cho đơn AUTO bị lỗi
    markManuallyDelivered: builder.mutation<
      { message: string },
      { orderId: number; note?: string }
    >({
      query: ({ orderId, note }) => ({
        url: `/admin/orders/${orderId}/mark-manually-delivered`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['Order'],
    }),

    refundOrder: builder.mutation<{ message: string; orderCode: string; status: string }, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/orders/${id}/refund`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Order', 'Customer', 'Product', 'Account'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useConfirmOrderMutation,
  useRetryDeliveryMutation,
  useGetAvailableAccountsForItemQuery,
  useReserveAccountMutation,
  useReleaseReservedAccountMutation,
  useCompleteManualDeliveryMutation,
  useMarkManuallyDeliveredMutation,
  useRefundOrderMutation,
} = orderApi;
