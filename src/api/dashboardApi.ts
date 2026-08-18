import { baseApi } from './baseApi';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  revenueToday: number;
  ordersToday: number;
}

export interface TimelinePoint {
  time: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface PaymentMethodStat {
  method: string;
  orderCount: number;
  revenue: number;
}

export interface DashboardAnalyticsResponse {
  periodRevenue: number;
  periodOrders: number;
  periodPaidOrders: number;
  growthRevenueRate: number | null;
  growthOrdersRate: number | null;
  totalRevenueAllTime: number;
  totalOrdersAllTime: number;
  totalCustomersAllTime: number;
  availableAccounts: number;
  timeline: TimelinePoint[];
  topProducts: TopProduct[];
  paymentStats: PaymentMethodStat[];
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/admin/dashboard/stats',
      providesTags: ['Dashboard', 'Order', 'Customer'],
    }),
    getDashboardAnalytics: builder.query<DashboardAnalyticsResponse, { start?: string; end?: string } | void>({
      query: (params) => {
        if (!params || !params.start || !params.end) return '/admin/dashboard/analytics';
        return `/admin/dashboard/analytics?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`;
      },
      providesTags: ['Dashboard', 'Order', 'Customer'],
    }),
  }),
});

export const { useGetDashboardStatsQuery, useGetDashboardAnalyticsQuery } = dashboardApi;
