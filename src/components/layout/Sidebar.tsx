import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Settings, FolderTree, Radio, UserCog, UserCircle, Warehouse, Users } from 'lucide-react';



const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/categories', label: 'Danh mục', icon: FolderTree },
  { path: '/products', label: 'Sản phẩm', icon: Package },
  { path: '/accounts', label: 'Nhập kho', icon: Warehouse },
  { path: '/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/broadcast', label: 'Phát sóng', icon: Radio },
  { path: '/settings', label: 'Cấu hình', icon: Settings },
  { path: '/admins', label: 'Quản trị viên', icon: UserCog },
  { path: '/profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen glass border-r flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          BotShop Admin
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
