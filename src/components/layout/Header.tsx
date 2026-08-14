import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User, Bell, Check } from 'lucide-react';
import { logout } from '../../store/authSlice';
import { RootState } from '../../store/store';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { 
  useGetUnreadCountQuery, 
  useGetNotificationsQuery, 
  useMarkAsReadMutation, 
  useMarkAllAsReadMutation,
  notificationApi
} from '../../api/notificationApi';
import { useGetMeQuery } from '../../api/userApi';
import { baseApi } from '../../api/baseApi';
import toast from 'react-hot-toast';

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { data: meData } = useGetMeQuery();
  const currentUser = meData || user;
  
  const [showDropdown, setShowDropdown] = useState(false);
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
        
        // Hiển thị Toast thông báo tức thì trên giao diện
        toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (notif.type === 'ORDER') navigate('/orders');
            }}
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 border-2 border-blue-500/80 shadow-2xl rounded-xl pointer-events-auto flex p-4 cursor-pointer hover:bg-slate-800 transition-colors`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
                <p className="text-sm font-bold text-white">{notif.title}</p>
              </div>
              <p className="mt-1 text-xs text-slate-300">{notif.message}</p>
            </div>
          </div>
        ), { duration: 6000 });
      } catch (err) {
        console.error('Lỗi phân tích gói tin SSE:', err);
      }
    });

    eventSource.onerror = () => {
      // EventSource sẽ tự động thử kết nối lại khi mất mạng
    };

    return () => {
      eventSource.close();
    };
  }, [token, dispatch, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: number, type: string) => {
    await markAsRead(id);
    setShowDropdown(false);
    if (type === 'ORDER') {
      navigate('/orders');
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  return (
    <header className="h-16 glass border-b flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex-1">
        {/* Placeholder */}
      </div>
      <div className="flex items-center space-x-6">
        
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-800/50 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-semibold text-white">Thông báo</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <Check size={14} />
                    <span>Đánh dấu đã đọc</span>
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    Không có thông báo nào.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.type)}
                      className={`p-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors ${!notif.read ? 'bg-blue-500/5' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-semibold ${!notif.read ? 'text-blue-400' : 'text-slate-300'}`}>
                          {notif.title}
                        </span>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></span>}
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{notif.message}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(notif.createdAt).toLocaleString()}
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
