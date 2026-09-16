import { baseApi } from './baseApi';

export interface PaymentWebhookEvent {
  id: number;
  provider: string;
  providerTransactionId: string;
  referenceCode?: string;
  amount: number;
  // REVIEW_REQUIRED | UNMATCHED | SURPLUS_REVIEW_REQUIRED (chờ xử lý), PAYMENT_APPLIED_REVIEW_REQUIRED (đã áp vào đơn),
  // RESOLVED_CREDITED | RESOLVED_LINKED_ORDER (duyệt tay), còn lại là tự động (COMPLETED, PAYMENT_APPLIED, ...)
  status: string;
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
    creditWalletFromEvent: builder.mutation<PaymentWebhookEvent, { id: number; telegramId: number; note?: string; adminPassword: string }>({
      query: ({ id, telegramId, note, adminPassword }) => ({
        url: `/admin/payment-events/${id}/credit-wallet`,
        method: 'POST',
        body: { telegramId, note, adminPassword },
      }),
      invalidatesTags: ['PaymentEvent' as any, 'Customer', 'Order'],
    }),
    linkOrderFromEvent: builder.mutation<PaymentWebhookEvent, { id: number; orderCode: string; note?: string; adminPassword: string }>({
      query: ({ id, orderCode, note, adminPassword }) => ({
        url: `/admin/payment-events/${id}/link-order`,
        method: 'POST',
        body: { orderCode, note, adminPassword },
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
