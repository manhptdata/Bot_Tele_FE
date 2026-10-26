import { baseApi } from './baseApi';

export type NotificationProductScope = 'ALL' | 'SELECTED';

export interface OwnerNotificationProductSetting {
  productId: number;
  productName: string;
  productActive: boolean;
  currentStock: number;
  selected: boolean;
  orderEnabled: boolean;
  stockEnabled: boolean;
  stockThreshold?: number | null;
}

export interface OwnerNotificationSettings {
  enabled: boolean;
  orderEnabled: boolean;
  stockEnabled: boolean;
  productScope: NotificationProductScope;
  defaultStockThreshold: number;
  adminChatId?: number | null;
  adminChatConfigured: boolean;
  products: OwnerNotificationProductSetting[];
}

export interface OwnerNotificationSettingsPayload {
  enabled: boolean;
  orderEnabled: boolean;
  stockEnabled: boolean;
  productScope: NotificationProductScope;
  defaultStockThreshold: number;
  products: Array<{
    productId: number;
    selected: boolean;
    orderEnabled: boolean;
    stockEnabled: boolean;
    stockThreshold?: number | null;
  }>;
}

export const ownerNotificationSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOwnerNotificationSettings: builder.query<OwnerNotificationSettings, void>({
      query: () => '/admin/owner-notification-settings',
      providesTags: ['OwnerNotificationSettings'],
    }),
    updateOwnerNotificationSettings: builder.mutation<OwnerNotificationSettings, OwnerNotificationSettingsPayload>({
      query: (body) => ({ url: '/admin/owner-notification-settings', method: 'PUT', body }),
      invalidatesTags: ['OwnerNotificationSettings'],
    }),
    testOwnerNotification: builder.mutation<{ message: string }, void>({
      query: () => ({ url: '/admin/owner-notification-settings/test', method: 'POST' }),
    }),
  }),
});

export const {
  useGetOwnerNotificationSettingsQuery,
  useUpdateOwnerNotificationSettingsMutation,
  useTestOwnerNotificationMutation,
} = ownerNotificationSettingsApi;
