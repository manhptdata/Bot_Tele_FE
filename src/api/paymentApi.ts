import { baseApi } from './baseApi';
import { PaymentConfig } from '../types';

export interface WebhookInfo {
  baseUrl: string;
  sepayWebhookUrl: string;
  telegramWebhookUrl: string;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentConfigs: builder.query<PaymentConfig[], void>({
      query: () => '/admin/payment-configs',
      providesTags: ['PaymentConfig'],
    }),
    getWebhookInfo: builder.query<WebhookInfo, void>({
      query: () => '/admin/payment-configs/webhook-info',
      providesTags: ['PaymentConfig'],
    }),
    createPaymentConfig: builder.mutation<PaymentConfig, Partial<PaymentConfig>>({
      query: (body) => ({
        url: '/admin/payment-configs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentConfig'],
    }),
  }),
});

export const { 
  useGetPaymentConfigsQuery, 
  useGetWebhookInfoQuery,
  useCreatePaymentConfigMutation 
} = paymentApi;
