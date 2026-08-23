import { baseApi } from './baseApi';
import { PageResponse } from '../types/pagination';

export interface Voucher {
  id: number;
  code: string;
  description?: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  scope: 'ALL' | 'PRODUCTS';
  target: 'PUBLIC' | 'SPECIFIC';
  totalQuantity?: number;
  usedCount: number;
  maxUsagePerCustomer: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  productIds: number[];
  customerIds: number[];
}

export interface VoucherCreateRequest {
  code: string;
  description?: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  scope: 'ALL' | 'PRODUCTS';
  target: 'PUBLIC' | 'SPECIFIC';
  totalQuantity?: number;
  maxUsagePerCustomer?: number;
  startDate?: string;
  endDate?: string;
  productIds?: number[];
  customerIds?: number[];
}

export interface VoucherUpdateRequest {
  description?: string;
  discountType?: 'PERCENT' | 'FIXED';
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  scope?: 'ALL' | 'PRODUCTS';
  target?: 'PUBLIC' | 'SPECIFIC';
  totalQuantity?: number | null;
  maxUsagePerCustomer?: number;
  startDate?: string | null;
  endDate?: string | null;
  productIds?: number[];
  customerIds?: number[];
}

export interface VoucherQueryParams {
  keyword?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}

export const voucherApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVouchers: builder.query<PageResponse<Voucher>, VoucherQueryParams | void>({
      query: (params) => {
        if (!params) return '/admin/vouchers';
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/admin/vouchers?${searchParams.toString()}`;
      },
      providesTags: ['Voucher'],
    }),
    getVoucherById: builder.query<Voucher, number>({
      query: (id) => `/admin/vouchers/${id}`,
      providesTags: ['Voucher'],
    }),
    createVoucher: builder.mutation<Voucher, VoucherCreateRequest>({
      query: (body) => ({
        url: '/admin/vouchers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Voucher'],
    }),
    updateVoucher: builder.mutation<Voucher, { id: number; data: VoucherUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/vouchers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Voucher'],
    }),
    toggleVoucher: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/vouchers/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Voucher'],
    }),
  }),
});

export const {
  useGetVouchersQuery,
  useGetVoucherByIdQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useToggleVoucherMutation,
} = voucherApi;
