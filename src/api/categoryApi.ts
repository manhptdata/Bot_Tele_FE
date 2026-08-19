import { baseApi } from './baseApi';
import { Category } from '../types';
import { PageResponse } from '../types/pagination';

export interface CategoryQueryParams {
  keyword?: string;
  page?: number;
  size?: number;
}

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<PageResponse<Category>, CategoryQueryParams | void>({
      query: (params) => {
        if (!params) return '/categories';
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append('keyword', params.keyword);
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/categories?${searchParams.toString()}`;
      },
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<Category, { id: number; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    getProductCount: builder.query<number, number>({
      query: (id) => `/categories/${id}/product-count`,
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductCountQuery,
  useLazyGetProductCountQuery,
} = categoryApi;
