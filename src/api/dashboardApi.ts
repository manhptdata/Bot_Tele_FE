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

export interface TopUpgradeService {
  serviceId: number;
  serviceName: string;
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
  topUpgradeServices: TopUpgradeService[];
  paymentStats: PaymentMethodStat[];
}

export interface ProductAnalyticsResponse {
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  price: number;
  currentStock: number;
  totalQuantitySold: number;
  totalRevenue: number;
  totalOrders: number;
  timeline: TimelinePoint[];
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/admin/dashboard/stats',
      providesTags: ['Dashboard', 'Order', 'UpgradeOrder' as any, 'Customer'],
    }),
    getDashboardAnalytics: builder.query<DashboardAnalyticsResponse, { start?: string; end?: string } | void>({
      query: (params) => {
        if (!params || !params.start || !params.end) return '/admin/dashboard/analytics';
        return `/admin/dashboard/analytics?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`;
      },
      providesTags: ['Dashboard', 'Order', 'UpgradeOrder' as any, 'Customer'],
    }),
    getProductAnalytics: builder.query<
      ProductAnalyticsResponse,
      { productId: number; start?: string; end?: string }
    >({
      query: ({ productId, start, end }) => {
        let url = `/admin/dashboard/product-analytics?productId=${productId}`;
        if (start && end) {
          url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
        }
        return url;
      },
      providesTags: ['Dashboard', 'Order', 'Product', 'Account'],
    }),
    getUpgradeServiceAnalytics: builder.query<
      ProductAnalyticsResponse,
      { serviceId: number; start?: string; end?: string }
    >({
      query: ({ serviceId, start, end }) => {
        let url = `/admin/dashboard/upgrade-service-analytics?serviceId=${serviceId}`;
        if (start && end) url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
        return url;
      },
      providesTags: ['Dashboard', 'UpgradeOrder' as any, 'UpgradeService' as any],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetDashboardAnalyticsQuery,
  useGetProductAnalyticsQuery,
  useGetUpgradeServiceAnalyticsQuery,
} = dashboardApi;
