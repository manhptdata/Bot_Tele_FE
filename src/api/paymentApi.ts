import { baseApi } from './baseApi';
import { PaymentConfig, PaymentConfigSaveRequest, StepUpPasswordRequest } from '../types';

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
    createPaymentConfig: builder.mutation<PaymentConfig, PaymentConfigSaveRequest>({
      query: (body) => ({
        url: '/admin/payment-configs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentConfig'],
    }),
    updatePaymentConfig: builder.mutation<PaymentConfig, { id: number; data: PaymentConfigSaveRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/payment-configs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PaymentConfig'],
    }),
    makeDefaultPaymentConfig: builder.mutation<PaymentConfig, { id: number; data: StepUpPasswordRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/payment-configs/${id}/make-default`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PaymentConfig'],
    }),
  }),
});

export const { 
  useGetPaymentConfigsQuery, 
  useGetWebhookInfoQuery,
  useCreatePaymentConfigMutation,
  useUpdatePaymentConfigMutation,
  useMakeDefaultPaymentConfigMutation
} = paymentApi;
