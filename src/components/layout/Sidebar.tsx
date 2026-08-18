import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  FolderTree,
  Radio,
  UserCog,
  UserCircle,
  Warehouse,
  Users,
  Receipt,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

interface SubNavItem {
  path: string;
  label: string;
  icon: any;
}

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  children?: SubNavItem[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/categories', label: 'Danh mục', icon: FolderTree },
  { path: '/products', label: 'Sản phẩm', icon: Package },
  { path: '/accounts', label: 'Nhập kho', icon: Warehouse },
  {
    label: 'Đơn hàng & Giao dịch',
    icon: ShoppingCart,
    children: [
      { path: '/orders', label: 'Danh sách đơn hàng', icon: ClipboardList },
      { path: '/payment-events', label: 'Giao dịch Webhook', icon: Receipt },
    ],
  },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/broadcast', label: 'Phát sóng', icon: Radio },
  { path: '/settings', label: 'Cấu hình', icon: Settings },
  { path: '/admins', label: 'Quản trị viên', icon: UserCog },
  { path: '/profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
];

export const Sidebar = () => {
  const location = useLocation();

  // Kiểm tra xem hiện tại có đang ở trang đơn hàng hoặc webhook không
  const isOrderPathActive =
    location.pathname.startsWith('/orders') || location.pathname.startsWith('/payment-events');

  const [isOrderMenuOpen, setIsOrderMenuOpen] = useState<boolean>(isOrderPathActive);

  // Tự động mở submenu nếu điều hướng tới route con
  useEffect(() => {
    if (isOrderPathActive) {
      setIsOrderMenuOpen(true);
    }
  }, [isOrderPathActive]);

  return (
    <aside className="w-64 h-screen glass border-r flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          BotShop Admin
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          // Nếu là menu có submenu (Đơn hàng)
          if (item.children) {
            const hasActiveChild = item.children.some((child) => location.pathname.startsWith(child.path));

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => setIsOrderMenuOpen(!isOrderMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    hasActiveChild
                      ? 'bg-blue-600/10 text-blue-400 font-semibold'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={20} className={hasActiveChild ? 'text-blue-400' : 'text-gray-400'} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {isOrderMenuOpen ? (
                    <ChevronDown size={16} className="text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
                  )}
                </button>

                {/* Submenu xổ xuống */}
                {isOrderMenuOpen && (
                  <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-slate-800 ml-4 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname.startsWith(child.path);

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isChildActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                              : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                          }`}
                        >
                          <ChildIcon size={15} />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Nếu là menu đơn thông thường
          const isActive = location.pathname.startsWith(item.path!);
          return (
            <Link
              key={item.path}
              to={item.path!}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
