import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useGetMeQuery } from '../../api/userApi';
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
  Ticket,
  X,
  BellRing,
  Rocket,
  ClipboardCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface SubNavItem {
  path: string;
  label: string;
  icon: any;
  roles?: string[];
}

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  children?: SubNavItem[];
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { path: '/categories', label: 'Danh mục', icon: FolderTree },
  { path: '/products', label: 'Sản phẩm', icon: Package },
  { path: '/accounts', label: 'Nhập kho', icon: Warehouse },
  {
    label: 'Nâng cấp tài khoản',
    icon: Rocket,
    children: [
      { path: '/upgrade-services', label: 'Gói dịch vụ', icon: Package, roles: ['ADMIN'] },
      { path: '/upgrade-orders', label: 'Đơn nâng cấp', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Đơn hàng & Giao dịch',
    icon: ShoppingCart,
    children: [
      { path: '/orders', label: 'Danh sách đơn hàng', icon: ClipboardList },
      { path: '/payment-events', label: 'Giao dịch chuyển khoản', icon: Receipt },
    ],
  },
  { path: '/customers', label: 'Khách hàng', icon: Users },
  { path: '/vouchers', label: 'Mã giảm giá', icon: Ticket, roles: ['ADMIN'] },
  { path: '/broadcast', label: 'Phát sóng', icon: Radio, roles: ['ADMIN'] },
  { path: '/settings', label: 'Cấu hình', icon: Settings, roles: ['ADMIN'] },
  { path: '/notification-settings', label: 'Thông báo chủ shop', icon: BellRing, roles: ['ADMIN'] },
  { path: '/admins', label: 'Quản trị viên', icon: UserCog, roles: ['ADMIN'] },
  { path: '/profile', label: 'Hồ sơ cá nhân', icon: UserCircle },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { data: meData } = useGetMeQuery();
  const currentUser = meData || authUser;

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navItems
        .filter((item) => item.children?.some((child) => location.pathname.startsWith(child.path)))
        .map((item) => [item.label, true]),
    ),
  );

  // Tự động mở submenu nếu điều hướng tới route con
  useEffect(() => {
    const activeMenu = navItems.find((item) =>
      item.children?.some((child) => location.pathname.startsWith(child.path)),
    );
    if (activeMenu) {
      setOpenMenus((current) => ({ ...current, [activeMenu.label]: true }));
    }
  }, [location.pathname]);

  return (
    <aside
      className={`w-64 h-screen glass border-r flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          BotShop Admin
        </h1>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="lg:hidden p-1 text-gray-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          title="Đóng menu"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          // Check role permissions
          if (item.roles && (!currentUser || !item.roles.includes(currentUser.role))) {
            return null;
          }

          const Icon = item.icon;

          // Nếu là menu có submenu
          if (item.children) {
            const visibleChildren = item.children.filter(
              (child) => !child.roles || (currentUser && child.roles.includes(currentUser.role)),
            );
            if (visibleChildren.length === 0) return null;
            const hasActiveChild = visibleChildren.some((child) => location.pathname.startsWith(child.path));
            const isMenuOpen = Boolean(openMenus[item.label]);

            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOpenMenus((current) => ({
                    ...current,
                    [item.label]: !current[item.label],
                  }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${hasActiveChild
                    ? 'bg-blue-600/10 text-blue-400 font-semibold'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={20} className={hasActiveChild ? 'text-blue-400' : 'text-gray-400'} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {isMenuOpen ? (
                    <ChevronDown size={16} className="text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400 transition-transform duration-200" />
                  )}
                </button>

                {/* Submenu xổ xuống */}
                {isMenuOpen && (
                  <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-slate-800 ml-4 animate-in slide-in-from-top-2 duration-200">
                    {visibleChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname.startsWith(child.path);

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => onClose?.()}
                          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isChildActive
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
              onClick={() => onClose?.()}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive
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
