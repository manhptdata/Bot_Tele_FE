import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { tokenRefreshed, logout } from '../store/authSlice';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

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

  // Phân biệt request auth (login, refresh, forgot-password) với request bình thường
  const requestUrl = typeof args === 'string' ? args : args.url;
  const isAuthRequest = requestUrl.includes('/auth/');

  // ===== SILENT REFRESH: Tự động làm mới khi Access Token hết hạn =====
  if (result.error && result.error.status === 401 && !isAuthRequest) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = (api.getState() as any).auth.refreshToken;
        if (refreshToken) {
          const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
            api,
            extraOptions
          );

          // Backend bọc response trong FormatRestResponse: { statusCode: 200, data: { token: "..." } }
          const responseBody = refreshResult.data as any;
          const newToken = responseBody?.data?.token || responseBody?.token;

          if (newToken) {
            api.dispatch(tokenRefreshed(newToken));
            // Retry API ban đầu với Access Token mới
            result = await baseQuery(args, api, extraOptions);
            if (result.data && typeof result.data === 'object' && 'statusCode' in result.data && 'data' in result.data) {
              return { data: (result.data as any).data };
            }
          } else {
            // Refresh Token hết hạn (7 ngày) hoặc không hợp lệ → Đá về login
            api.dispatch(logout());
            api.dispatch(baseApi.util.resetApiState());
            window.location.href = '/login';
          }
        } else {
          api.dispatch(logout());
          api.dispatch(baseApi.util.resetApiState());
          window.location.href = '/login';
        }
      } finally {
        release();
      }
    } else {
      // Một request khác đang thực hiện refresh → Đợi xong rồi retry
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
      if (result.data && typeof result.data === 'object' && 'statusCode' in result.data && 'data' in result.data) {
        return { data: (result.data as any).data };
      }
    }
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
