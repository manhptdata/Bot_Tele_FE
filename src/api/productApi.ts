import { baseApi } from './baseApi';
import { Product, ProductUpsertPayload } from '../types';
import { PageResponse } from '../types/pagination';

export interface ProductQueryParams {
  keyword?: string;
  categoryId?: number;
  page?: number;
  size?: number;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PageResponse<Product>, ProductQueryParams | void>({
      query: (params) => {
        if (!params) return '/products';
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.categoryId) searchParams.append('categoryId', params.categoryId.toString());
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/products?${searchParams.toString()}`;
      },
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation<Product, ProductUpsertPayload>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation<Product, { id: number; data: ProductUpsertPayload }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;
