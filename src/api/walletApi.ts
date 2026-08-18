import { baseApi } from './baseApi';

export interface WalletDto {
  id: number;
  customerId: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  balance: number;
  updatedAt?: string;
}

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllWallets: builder.query<WalletDto[], void>({
      query: () => '/admin/wallets',
      providesTags: ['Wallet' as any, 'Customer'],
    }),
  }),
});

export const { useGetAllWalletsQuery } = walletApi;
