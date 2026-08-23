import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token && token !== 'undefined' && token !== 'null') {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const customBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Unwrap the custom RestResponse format from backend
  if (result.data && typeof result.data === 'object' && 'statusCode' in result.data && 'data' in result.data) {
    return { data: (result.data as any).data };
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: customBaseQuery,
  tagTypes: [
    'Dashboard',
    'PaymentEvent',
    'Product',
    'Account',
    'Order',
    'PaymentConfig',
    'Category',
    'Notification',
    'User',
    'Customer',
    'Wallet',
    'BotConfig',
    'SetupStatus',
    'Voucher',
  ] as const,
  endpoints: (_builder) => ({}),
});
