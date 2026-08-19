import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User, Bell, Check, X, ArrowRight, Sparkles } from 'lucide-react';
import { logout } from '../../store/authSlice';
import { RootState } from '../../store/store';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  useGetUnreadCountQuery, 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation,
  notificationApi,
  type AppNotification
} from '../../api/notificationApi';
import { useGetMeQuery } from '../../api/userApi';
import { baseApi } from '../../api/baseApi';

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { data: meData } = useGetMeQuery();
  const currentUser = meData || user;
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [realtimeAlert, setRealtimeAlert] = useState<AppNotification | null>(null);
  const alertTimerRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.count || 0;

  const { data: notifData } = useGetNotificationsQuery({ page: 0, size: 10 }, { skip: !showDropdown });
  const notifications = notifData?.content || [];

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  // Thiết lập kết nối Real-time Server-Sent Events (SSE)
  useEffect(() => {
    if (!token || token === 'undefined' || token === 'null') return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const sseUrl = `${baseUrl}/admin/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('NOTIFICATION', (event) => {
      try {
        const notif = JSON.parse(event.data);
        // Tự động làm mới cache dữ liệu thông báo và số lượng chưa đọc
        dispatch(notificationApi.util.invalidateTags(['Notification']));
        
        // Phát âm thanh chuông báo
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}

        // Hiển thị Callout Popup có mũi tên trỏ thẳng từ quả chuông xuống
        setRealtimeAlert(notif);
        setShowDropdown(false); // Đóng menu cũ nếu đang mở

        // Tự động ẩn sau 10 giây nếu không bấm
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => {
          setRealtimeAlert(null);
        }, 10000);
      } catch (err) {
        console.error('Lỗi phân tích gói tin SSE:', err);
      }
    });

    eventSource.onerror = () => {
      // EventSource sẽ tự động thử kết nối lại khi mất mạng
    };

    return () => {
      eventSource.close();
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [token, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setRealtimeAlert(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateByNotification = (type: string, referenceId?: string | null) => {
    switch (type) {
      case 'ORDER':
        navigate('/orders');
        break;
      case 'DEPOSIT':
        navigate('/customers');
        break;
      case 'PRODUCT':
        navigate('/products');
        break;
      case 'INVENTORY':
        navigate(referenceId ? `/accounts?productId=${referenceId}` : '/accounts');
        break;
      default:
        break;
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      await markAsRead(notif.id).unwrap();
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc thông báo:', err);
    } finally {
      setShowDropdown(false);
      setRealtimeAlert(null);
      navigateByNotification(notif.type, notif.referenceId);
    }
  };

  const handleRealtimeAlertClick = () => {
    if (!realtimeAlert) return;
    const notif = realtimeAlert;
    setRealtimeAlert(null);
    navigateByNotification(notif.type, notif.referenceId);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  return (
    <header className="h-16 glass border-b flex items-center justify-between px-6 sticky top-0 z-40 w-full">
      <div className="flex-1">
        {/* Placeholder */}
      </div>
      <div className="flex items-center space-x-6">
        
        {/* Notification Bell with Callout Arrow */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              setShowDropdown(!showDropdown);
              setRealtimeAlert(null); // Tắt callout realtime khi chủ động bấm chuông
            }}
            className="p-2.5 text-gray-300 hover:text-blue-400 transition-colors rounded-full hover:bg-slate-800/80 relative"
            title="Xem thông báo"
          >
            <Bell size={21} className={unreadCount > 0 ? 'text-blue-400' : ''} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg shadow-red-500/50 animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* 1. CALLOUT POPUP REALTIME KHI CÓ ĐƠN HÀNG / NẠP TIỀN MỚI (CÓ MŨI TÊN TRỎ TỪ CHUÔNG) */}
          {realtimeAlert && (
            <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
              {/* Mũi tên tam giác trỏ thẳng lên chuông */}
              <div className="absolute -top-2 right-3.5 w-4 h-4 bg-slate-900 border-t-2 border-l-2 border-blue-500 rotate-45 z-10" />

              <div 
                onClick={handleRealtimeAlertClick}
                className="relative bg-slate-900/95 backdrop-blur-md border-2 border-blue-500 rounded-2xl p-4 shadow-2xl shadow-blue-950/80 cursor-pointer hover:bg-slate-850 hover:border-blue-400 transition-all group"
              >
                {/* Header của Popup Callout */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-400" />
                      Thông báo mới tức thì
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRealtimeAlert(null);
                    }}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Đóng thông báo"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Nội dung thông báo */}
                <div className="py-2.5 space-y-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    {realtimeAlert.title}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {realtimeAlert.message}
                  </p>
                </div>

                {/* Footer với nút bấm điều hướng trực tiếp */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-semibold group-hover:text-blue-300">
                  <span>Bấm vào để xem trực tiếp ngay</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* 2. MENU DROPDOWN DANH SÁCH THÔNG BÁO (KHI BẤM CHUÔNG) CŨNG CÓ MŨI TÊN TRỎ LÊN */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-3 w-84 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {/* Mũi tên tam giác trỏ lên chuông */}
              <div className="absolute -top-2 right-3.5 w-4 h-4 bg-slate-900 border-t border-l border-slate-700 rotate-45 z-10" />

              <div className="p-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
                <h3 className="font-bold text-white text-sm">Danh sách thông báo</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium"
                  >
                    <Check size={14} />
                    <span>Đánh dấu đã đọc</span>
                  </button>
                )}
              </div>
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Không có thông báo nào.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 cursor-pointer hover:bg-slate-800/80 transition-colors ${!notif.read ? 'bg-blue-500/10' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold ${!notif.read ? 'text-blue-400' : 'text-slate-200'}`}>
                          {notif.title}
                        </span>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-xs text-slate-300 mb-1.5 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(notif.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-300 border-l border-slate-700 pl-6">
          <User size={18} className="text-gray-400" />
          <span>{currentUser?.fullName || currentUser?.username || 'Admin'}</span>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-800/50"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

