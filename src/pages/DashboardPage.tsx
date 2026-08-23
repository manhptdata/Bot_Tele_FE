import { useState, useMemo, useRef } from 'react';
import { useGetDashboardAnalyticsQuery } from '../api/dashboardApi';
import { useGetAllWalletsQuery } from '../api/walletApi';
import { useGetOrdersQuery } from '../api/orderApi';
import { SetupWizard } from '../components/dashboard/SetupWizard';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Package,
  Calendar,
  Layers,
  HelpCircle,
  CreditCard,
  Award,
  Clock,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type DatePreset = 'TODAY' | 'YESTERDAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

// Hàm cộng năm có clamp ngày (xử lý chính xác 29/02 -> 28/02 năm sau)
const addCalendarYear = (year: number, month: number, day: number) => {
  const targetYear = year + 1;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, month - 1, Math.min(day, daysInTargetMonth)));
};

// Hàm chuyển ngày YYYY-MM-DD sang ISO UTC theo mốc 00:00:00 giờ Việt Nam (+07:00)
const toVietnamStartIso = (dateStr: string) => {
  return new Date(`${dateStr}T00:00:00+07:00`).toISOString();
};

// Hàm chuyển ngày kết thúc inclusive YYYY-MM-DD sang mốc endExclusive (00:00:00 ngày tiếp theo)
const toVietnamEndExclusiveIso = (inclusiveDateStr: string) => {
  const [year, month, day] = inclusiveDateStr.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDateStr = [
    nextDay.getUTCFullYear(),
    String(nextDay.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDay.getUTCDate()).padStart(2, '0'),
  ].join('-');
  return new Date(`${nextDateStr}T00:00:00+07:00`).toISOString();
};

const StatCard = ({
  title,
  value,
  subtext,
  growthRate,
  icon: Icon,
  colorClass,
  tooltip,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  growthRate?: number | null;
  icon: any;
  colorClass: string;
  tooltip?: string;
}) => (
  <div className="glass p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg relative group">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>{title}</span>
          {tooltip && (
            <div className="relative group/tooltip inline-block">
              <HelpCircle size={13} className="text-slate-500 hover:text-slate-300 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block w-56 p-2.5 bg-slate-950 text-[11px] text-slate-300 rounded-lg shadow-xl border border-slate-700 z-50 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white mt-2 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>

    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
      {growthRate !== undefined && (
        <div className="flex items-center gap-1">
          {growthRate === null ? (
            <span className="text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded font-mono text-[11px]">
              Chưa có kỳ trước
            </span>
          ) : growthRate >= 0 ? (
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold flex items-center gap-0.5">
              <TrendingUp size={12} /> +{growthRate}%
            </span>
          ) : (
            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-semibold flex items-center gap-0.5">
              <TrendingDown size={12} /> {growthRate}%
            </span>
          )}
          <span className="text-slate-500 text-[11px] ml-1">so với kỳ trước</span>
        </div>
      )}
      {subtext && !growthRate && growthRate !== null && (
        <span className="text-slate-500 text-[11px]">{subtext}</span>
      )}
    </div>
  </div>
);

export const DashboardPage = () => {
  const [preset, setPreset] = useState<DatePreset>('7DAYS');
  const [chartMetric, setChartMetric] = useState<'REVENUE' | 'ORDERS'>('REVENUE');

  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Input tạm thời cho Custom Date Range
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultStartStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const [inputStartStr, setInputStartStr] = useState<string>(defaultStartStr);
  const [inputEndStr, setInputEndStr] = useState<string>(todayStr);

  // Range đã được áp dụng
  const [appliedCustomDates, setAppliedCustomDates] = useState<{ start: string; end: string }>({
    start: defaultStartStr,
    end: todayStr,
  });

  // Tính toán khoảng UTC độc lập với timezone máy admin
  const queryRange = useMemo(() => {
    const now = new Date();
    const vnYear = now.getFullYear();
    const vnMonth = now.getMonth();
    const vnDate = now.getDate();

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    switch (preset) {
      case 'TODAY': {
        const today = formatDate(new Date(vnYear, vnMonth, vnDate));
        return { start: toVietnamStartIso(today), end: toVietnamEndExclusiveIso(today) };
      }
      case 'YESTERDAY': {
        const yesterday = formatDate(new Date(vnYear, vnMonth, vnDate - 1));
        return { start: toVietnamStartIso(yesterday), end: toVietnamEndExclusiveIso(yesterday) };
      }
      case '7DAYS': {
        const start = formatDate(new Date(vnYear, vnMonth, vnDate - 6));
        const end = formatDate(new Date(vnYear, vnMonth, vnDate));
        return { start: toVietnamStartIso(start), end: toVietnamEndExclusiveIso(end) };
      }
      case '30DAYS': {
        const start = formatDate(new Date(vnYear, vnMonth, vnDate - 29));
        const end = formatDate(new Date(vnYear, vnMonth, vnDate));
        return { start: toVietnamStartIso(start), end: toVietnamEndExclusiveIso(end) };
      }
      case 'THIS_MONTH': {
        const start = formatDate(new Date(vnYear, vnMonth, 1));
        const end = formatDate(new Date(vnYear, vnMonth + 1, 0)); // Ngày cuối tháng
        return { start: toVietnamStartIso(start), end: toVietnamEndExclusiveIso(end) };
      }
      case 'LAST_MONTH': {
        const start = formatDate(new Date(vnYear, vnMonth - 1, 1));
        const end = formatDate(new Date(vnYear, vnMonth, 0)); // Ngày cuối tháng trước
        return { start: toVietnamStartIso(start), end: toVietnamEndExclusiveIso(end) };
      }
      case 'CUSTOM': {
        return {
          start: toVietnamStartIso(appliedCustomDates.start),
          end: toVietnamEndExclusiveIso(appliedCustomDates.end),
        };
      }
    }
  }, [preset, appliedCustomDates]);

  // Kiểm tra tính hợp lệ của custom range (Inclusive <= 1 năm)
  const validationStatus = useMemo(() => {
    if (!inputStartStr || !inputEndStr) return { valid: false, message: 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc' };
    if (inputStartStr > inputEndStr) return { valid: false, message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc' };

    const [sy, sm, sd] = inputStartStr.split('-').map(Number);
    const [ey, em, ed] = inputEndStr.split('-').map(Number);

    const exclusiveLimit = addCalendarYear(sy, sm, sd);
    const maxInclusiveEnd = new Date(exclusiveLimit.getTime() - 24 * 60 * 60 * 1000);
    const selectedEndDate = new Date(Date.UTC(ey, em - 1, ed));

    if (selectedEndDate > maxInclusiveEnd) {
      return { valid: false, message: 'Khoảng thời gian tối đa cho phép phân tích là 1 năm lịch' };
    }

    return { valid: true, message: '' };
  }, [inputStartStr, inputEndStr]);

  const handleApplyCustomRange = () => {
    if (!validationStatus.valid) return;
    setAppliedCustomDates({
      start: inputStartStr,
      end: inputEndStr,
    });
  };

  const { data: analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useGetDashboardAnalyticsQuery({
    start: queryRange.start,
    end: queryRange.end,
  });

  const { data: wallets = [] } = useGetAllWalletsQuery();
  const { data: ordersPage } = useGetOrdersQuery({ size: 6 });
  const recentOrders = ordersPage?.content || [];

  const totalWalletBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  }, [wallets]);

  // Chuẩn bị dữ liệu Top sản phẩm
  const topProducts = analytics?.topProducts || [];
  const maxProductRevenue = useMemo(() => {
    return Math.max(...topProducts.map((p) => p.revenue), 1);
  }, [topProducts]);

  // Chuẩn bị dữ liệu Phương thức thanh toán
  const paymentStats = analytics?.paymentStats || [];
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  const paymentChartData = paymentStats.map((p, idx) => ({
    name: p.method === 'BANK_TRANSFER' ? 'Chuyển khoản SePay' : p.method === 'WALLET' ? 'Ví Bot' : p.method,
    value: p.revenue,
    count: p.orderCount,
    color: pieColors[idx % pieColors.length],
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 3-Step Setup Wizard for Onboarding */}
      <SetupWizard />

      {/* Header & Date Range Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <TrendingUp className="text-blue-500" />
              Dashboard Thống Kê & Phân Tích
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Theo dõi doanh thu, hiệu suất đơn hàng và tốc độ tăng trưởng kinh doanh
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex flex-wrap gap-1 shadow-inner">
              {(
                [
                  { id: 'TODAY', label: 'Hôm nay' },
                  { id: 'YESTERDAY', label: 'Hôm qua' },
                  { id: '7DAYS', label: '7 ngày qua' },
                  { id: '30DAYS', label: '30 ngày' },
                  { id: 'THIS_MONTH', label: 'Tháng này' },
                  { id: 'LAST_MONTH', label: 'Tháng trước' },
                  { id: 'CUSTOM', label: 'Tùy chọn...' },
                ] as { id: DatePreset; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPreset(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    preset === item.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar Chọn Ngày Tùy Chọn Đẹp Chuẩn Enterprise */}
        {preset === 'CUSTOM' && (
          <div className="bg-slate-900/95 border border-blue-500/30 p-4 rounded-2xl shadow-xl animate-in slide-in-from-top-2 duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 hover:border-blue-500/50 transition-all px-3.5 py-2 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => startDateInputRef.current?.showPicker?.()}
                  className="text-blue-400 hover:text-blue-300 hover:scale-110 transition-transform p-0.5 cursor-pointer focus:outline-none"
                  title="Bấm để mở bảng lịch chọn ngày"
                >
                  <Calendar size={16} />
                </button>
                <span className="text-xs text-slate-400 font-medium select-none">Từ ngày:</span>
                <input
                  ref={startDateInputRef}
                  type="date"
                  value={inputStartStr}
                  max={todayStr}
                  style={{ colorScheme: 'dark' }}
                  onChange={(e) => setInputStartStr(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-text"
                />
              </div>

              <span className="text-slate-500 font-bold select-none">→</span>

              <div className="flex items-center gap-2 bg-slate-950 hover:border-blue-500/50 transition-all px-3.5 py-2 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => endDateInputRef.current?.showPicker?.()}
                  className="text-blue-400 hover:text-blue-300 hover:scale-110 transition-transform p-0.5 cursor-pointer focus:outline-none"
                  title="Bấm để mở bảng lịch chọn ngày"
                >
                  <Calendar size={16} />
                </button>
                <span className="text-xs text-slate-400 font-medium select-none">Đến ngày:</span>
                <input
                  ref={endDateInputRef}
                  type="date"
                  value={inputEndStr}
                  max={todayStr}
                  style={{ colorScheme: 'dark' }}
                  onChange={(e) => setInputEndStr(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-text"
                />
              </div>

              {/* Nút Áp Dụng */}
              <button
                onClick={handleApplyCustomRange}
                disabled={!validationStatus.valid}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                  validationStatus.valid
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Search size={14} />
                Áp Dụng Lọc
              </button>

              {/* Nút Hủy / Đóng */}
              <button
                onClick={() => setPreset('7DAYS')}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Đóng
              </button>
            </div>

            {/* Thông báo hợp lệ / Đang lọc */}
            {!validationStatus.valid ? (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <AlertCircle size={15} />
                <span>{validationStatus.message}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                Đang lọc: <span className="text-blue-400 font-bold">{appliedCustomDates.start}</span> đến{' '}
                <span className="text-blue-400 font-bold">{appliedCustomDates.end}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5 Thẻ StatCards Cao Cấp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <StatCard
          title="Doanh thu trong kỳ"
          value={`${(analytics?.periodRevenue ?? 0).toLocaleString()}đ`}
          growthRate={analytics?.growthRevenueRate}
          icon={DollarSign}
          colorClass="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          tooltip="Doanh thu tính theo ngày đặt của các đơn hiện đang ở trạng thái đã thanh toán."
        />
        <StatCard
          title="Đơn hàng trong kỳ"
          value={`${analytics?.periodPaidOrders ?? 0} / ${analytics?.periodOrders ?? 0} đơn`}
          growthRate={analytics?.growthOrdersRate}
          icon={ShoppingCart}
          colorClass="bg-blue-500/15 text-blue-400 border border-blue-500/30"
          tooltip="Số đơn đã thanh toán thành công trên tổng số đơn phát sinh trong kỳ."
        />
        <StatCard
          title="Tổng số dư ví khách"
          value={`${totalWalletBalance.toLocaleString()}đ`}
          subtext="Tổng tiền còn lại trong ví của toàn bộ khách"
          icon={Wallet}
          colorClass="bg-amber-500/15 text-amber-400 border border-amber-500/30"
          tooltip="Tổng số dư tiền hiện có trong Ví Bot của tất cả khách hàng (tiền khách đã nạp thành công vào bot và có thể dùng để mua hàng bất cứ lúc nào)."
        />
        <StatCard
          title="Tài khoản sẵn sàng"
          value={analytics?.availableAccounts ?? 0}
          subtext="Tài khoản có sẵn trong kho"
          icon={Package}
          colorClass="bg-purple-500/15 text-purple-400 border border-purple-500/30"
        />
        <StatCard
          title="Khách hàng Telegram"
          value={analytics?.totalCustomersAllTime ?? 0}
          subtext={`Tổng ${analytics?.totalOrdersAllTime ?? 0} đơn toàn sàn`}
          icon={Users}
          colorClass="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
        />
      </div>

      {/* Main Analytics Chart */}
      <div className="glass p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-blue-400" />
              Biểu Đồ Xu Hướng Thời Gian
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {preset === 'TODAY' || preset === 'YESTERDAY'
                ? 'Dữ liệu phân bổ chi tiết theo 24 khung giờ'
                : analytics?.timeline && analytics.timeline.length <= 90
                ? 'Dữ liệu phân bổ chi tiết theo từng ngày'
                : 'Dữ liệu được tự động tổng hợp theo từng tháng'}
            </p>
          </div>

          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 self-start sm:self-auto">
            <button
              onClick={() => setChartMetric('REVENUE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartMetric === 'REVENUE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Doanh thu (VND)
            </button>
            <button
              onClick={() => setChartMetric('ORDERS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartMetric === 'ORDERS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Số đơn hàng
            </button>
          </div>
        </div>

        <div className="h-80 w-full min-h-[300px]">
          {isAnalyticsLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : isAnalyticsError ? (
            <div className="h-full flex items-center justify-center text-rose-400 text-sm gap-2">
              <AlertCircle size={18} /> Không thể tải dữ liệu thống kê. Vui lòng thử lại sau!
            </div>
          ) : !analytics?.timeline || analytics.timeline.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Không có dữ liệu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'REVENUE' ? (
                <AreaChart data={analytics.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" textAnchor="end" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              ) : (
                <BarChart data={analytics.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: number) => [`${value} đơn`, 'Số đơn']}
                  />
                  <Bar dataKey="orderCount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2 Widget Phân Tích: Top Sản Phẩm & Cơ Cấu Thanh Toán */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Sản phẩm bán chạy */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Award size={18} className="text-amber-400" />
              Top 5 Sản Phẩm Bán Chạy Nhất Trong Kỳ
            </h2>
            <p className="text-xs text-slate-400 mb-4">Xếp hạng theo số lượng tài khoản/dịch vụ đã bán ra</p>

            <div className="space-y-3.5">
              {topProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">Chưa có sản phẩm nào bán ra trong kỳ</div>
              ) : (
                topProducts.map((prod, idx) => {
                  const percent = Math.min(Math.round((prod.revenue / maxProductRevenue) * 100), 100);
                  return (
                    <div key={prod.productId} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : idx === 1
                                ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                                : idx === 2
                                ? 'bg-amber-800/20 text-amber-600 border border-amber-800/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-white truncate max-w-xs">{prod.productName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {prod.revenue.toLocaleString()}đ
                          </span>
                          <span className="text-xs text-slate-400 ml-2 font-mono">({prod.quantity} lượt)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Cơ cấu Phương thức thanh toán */}
        <div className="glass p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <CreditCard size={18} className="text-cyan-400" />
              Cơ Cấu Phương Thức Thanh Toán
            </h2>
            <p className="text-xs text-slate-400 mb-4">Tỷ trọng doanh thu theo kênh thanh toán</p>

            <div className="h-52 w-full flex items-center justify-center">
              {paymentChartData.length === 0 || paymentChartData.every((p) => p.value === 0) ? (
                <div className="text-slate-500 text-xs">Chưa có giao dịch thanh toán trong kỳ</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chú thích chi tiết */}
            <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
              {paymentChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white font-mono">{item.value.toLocaleString()}đ</span>
                    <span className="text-slate-500 text-[11px] ml-1.5">({item.count} đơn)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Đơn hàng gần đây */}
      <div className="glass p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Clock size={18} className="text-blue-400" />
          Đơn Hàng Mới Nhất Trên Sàn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
            >
              <div>
                <p className="font-mono text-sm font-bold text-white">{order.orderCode}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.customer?.username ? `@${order.customer.username}` : order.customer?.firstName || 'Khách ẩn danh'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400 font-mono">
                  {Number(order.totalAmount || 0).toLocaleString()}đ
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                    order.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : order.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm">Chưa có đơn hàng nào</div>
          )}
        </div>
      </div>
    </div>
  );
};
