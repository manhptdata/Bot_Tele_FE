import { baseApi } from './baseApi';

export interface PaymentWebhookEvent {
  id: number;
  provider: string;
  providerTransactionId: string;
  referenceCode?: string;
  amount: number;
  status: string; // UNRESOLVED, AUTO_RESOLVED, MANUALLY_RESOLVED, PROCESSED
  errorCode?: string;
  rawContent?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}

export const paymentEventApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentEvents: builder.query<PaymentWebhookEvent[], { status?: string } | void>({
      query: (params) => {
        if (!params || !params.status || params.status === 'ALL') {
          return '/admin/payment-events';
        }
        return `/admin/payment-events?status=${params.status}`;
      },
      providesTags: ['PaymentEvent' as any],
    }),
    creditWalletFromEvent: builder.mutation<PaymentWebhookEvent, { id: number; telegramId: number; note?: string }>({
      query: ({ id, telegramId, note }) => ({
        url: `/admin/payment-events/${id}/credit-wallet`,
        method: 'POST',
        body: { telegramId, note },
      }),
      invalidatesTags: ['PaymentEvent' as any, 'Customer', 'Order'],
    }),
    linkOrderFromEvent: builder.mutation<PaymentWebhookEvent, { id: number; orderCode: string; note?: string }>({
      query: ({ id, orderCode, note }) => ({
        url: `/admin/payment-events/${id}/link-order`,
        method: 'POST',
        body: { orderCode, note },
      }),
      invalidatesTags: ['PaymentEvent' as any, 'Order', 'Customer', 'Product'],
    }),
  }),
});

export const {
  useGetPaymentEventsQuery,
  useCreditWalletFromEventMutation,
  useLinkOrderFromEventMutation,
} = paymentEventApi;
