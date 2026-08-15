import { useGetOrdersQuery } from '../api/orderApi';
import { useGetAccountsQuery } from '../api/accountApi';
import { Package, ShoppingCart, DollarSign, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="glass p-6 rounded-xl flex items-center space-x-4">
    <div className={`p-4 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    </div>
  </div>
);

export const DashboardPage = () => {
  const { data: ordersPage } = useGetOrdersQuery({ size: 20 });
  const { data: accountsPage } = useGetAccountsQuery({ status: 'AVAILABLE', size: 1 });
  const orders = ordersPage?.content || [];

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Tính tổng doanh thu của các đơn đã thanh toán/hoàn thành
    const totalRevenue = orders
      .filter(o => o.status === 'PAID' || o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Tính doanh thu trong ngày hôm nay
    const todayRevenue = orders
      .filter(o => (o.status === 'PAID' || o.status === 'COMPLETED') && o.createdAt?.startsWith(today))
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Số đơn chờ xác nhận thủ công
    const pendingManualOrders = orders.filter(o => o.status === 'PENDING' && o.deliveryMode === 'MANUAL').length;

    // Tổng account còn sẵn sàng trong kho từ Database
    const availableAccounts = accountsPage?.totalElements ?? 0;

    // Chuẩn bị dữ liệu biểu đồ (7 ngày gần nhất)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayRevenue = orders
        .filter(o => (o.status === 'PAID' || o.status === 'COMPLETED') && o.createdAt?.startsWith(dateStr))
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        
      chartData.push({
        name: d.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
        revenue: dayRevenue
      });
    }

    return { totalRevenue, todayRevenue, pendingManualOrders, availableAccounts, chartData };
  }, [orders, accountsPage?.totalElements]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Tổng quan</h1>
        <p className="text-gray-400 mt-1">Theo dõi hoạt động kinh doanh của BotShop</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Doanh thu hôm nay" 
          value={`${stats.todayRevenue.toLocaleString()}đ`} 
          icon={DollarSign}
          colorClass="bg-green-500/20 text-green-400"
        />
        <StatCard 
          title="Tổng doanh thu" 
          value={`${stats.totalRevenue.toLocaleString()}đ`} 
          icon={ShoppingCart}
          colorClass="bg-blue-500/20 text-blue-400"
        />
        <StatCard 
          title="Tài khoản sẵn sàng" 
          value={stats.availableAccounts} 
          icon={Package}
          colorClass="bg-purple-500/20 text-purple-400"
        />
        <StatCard 
          title="Đơn chờ duyệt (Manual)" 
          value={stats.pendingManualOrders} 
          icon={Clock}
          colorClass="bg-orange-500/20 text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass rounded-xl p-6 h-96 flex flex-col border border-slate-700/50">
          <h2 className="text-lg font-semibold mb-4">Biểu đồ doanh thu 7 ngày</h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-xl p-6 h-96 flex flex-col border border-slate-700/50">
          <h2 className="text-lg font-semibold mb-4">Đơn hàng gần đây</h2>
          <div className="flex-1 overflow-y-auto">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-lg transition-colors border-b border-slate-800 last:border-0">
                <div>
                  <p className="font-medium font-mono text-white text-sm">{order.orderCode}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.customer?.username ? `@${order.customer.username}` : (order.customer?.firstName || 'Khách hàng')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-400">
                    {order.totalAmount !== undefined && order.totalAmount !== null 
                      ? `${Number(order.totalAmount).toLocaleString('vi-VN')}đ` 
                      : '0đ'}
                  </p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    order.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-gray-500 text-center mt-10">Chưa có đơn hàng nào</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
