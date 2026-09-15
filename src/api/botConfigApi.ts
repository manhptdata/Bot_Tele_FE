import { baseApi } from './baseApi';
import { BotConfig, ConnectBotRequest, BotConfigSaveRequest, DisconnectBotRequest, SetupStatus, WelcomeMessageRequest } from '../types';

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
    updateWelcomeMessage: builder.mutation<BotConfig, WelcomeMessageRequest>({
      query: (body) => ({
        url: '/admin/bot-config/messages/welcome',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['BotConfig'],
    }),
    testWelcomeMessage: builder.mutation<void, WelcomeMessageRequest>({
      query: (body) => ({
        url: '/admin/bot-config/messages/welcome/test',
        method: 'POST',
        body,
      }),
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
  useUpdateWelcomeMessageMutation,
  useTestWelcomeMessageMutation,
  useDisconnectBotMutation,
  useGetSetupStatusQuery,
} = botConfigApi;
