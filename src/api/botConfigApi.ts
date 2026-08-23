import { baseApi } from './baseApi';
import { BotConfig, ConnectBotRequest, BotConfigSaveRequest, DisconnectBotRequest, SetupStatus } from '../types';

export const botConfigApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveBotConfig: builder.query<BotConfig | null, void>({
      query: () => '/admin/bot-config',
      providesTags: ['BotConfig'],
    }),
    connectBot: builder.mutation<BotConfig, ConnectBotRequest>({
      query: (body) => ({
        url: '/admin/bot-config/connect',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BotConfig', 'SetupStatus'],
    }),
    updateBotConfig: builder.mutation<BotConfig, BotConfigSaveRequest>({
      query: (body) => ({
        url: '/admin/bot-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['BotConfig'],
    }),
    disconnectBot: builder.mutation<void, DisconnectBotRequest>({
      query: (body) => ({
        url: '/admin/bot-config/disconnect',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BotConfig', 'SetupStatus'],
    }),
    getSetupStatus: builder.query<SetupStatus, void>({
      query: () => '/admin/bot-config/setup-status',
      providesTags: ['SetupStatus'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetActiveBotConfigQuery,
  useConnectBotMutation,
  useUpdateBotConfigMutation,
  useDisconnectBotMutation,
  useGetSetupStatusQuery,
} = botConfigApi;
