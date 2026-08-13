import React, { useState, useEffect } from 'react';
import { useGetMeQuery, useUpdateMeMutation } from '../api/userApi';
import { UserCircle, Mail, MessageCircle, Shield, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { data: meData, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    telegramChatId: '',
    newPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (meData) {
      setFormData(prev => ({
        ...prev,
        fullName: meData.fullName || '',
        email: meData.email || '',
        telegramChatId: meData.telegramChatId || '',
      }));
    }
  }, [meData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meData) return;

    try {
      await updateMe({
        fullName: formData.fullName,
        email: formData.email,
        telegramChatId: formData.telegramChatId.trim(),
        newPassword: formData.newPassword || undefined,
      }).unwrap();
      
      toast.success('Cập nhật hồ sơ thành công!');
      setFormData(prev => ({ ...prev, newPassword: '' }));
    } catch (error: any) {
      toast.error(error?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-slate-400">Đang tải...</div>;
  }

  const user = meData;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <UserCircle className="text-blue-400" />
          Hồ sơ cá nhân
        </h1>
        <p className="text-slate-400">Quản lý thông tin và bảo mật tài khoản của bạn</p>
      </div>

      <div className="glass rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-slate-700">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user?.fullName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            <div className="flex items-center space-x-2 mt-1 text-slate-400">
              <Shield size={16} className={user?.role === 'ADMIN' ? 'text-purple-400' : 'text-blue-400'} />
              <span className="text-sm font-medium">
                {user?.id === 1 ? 'SUPER ADMIN' : user?.role}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Nhập họ tên đầy đủ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <MessageCircle size={16} />
              Telegram Chat ID
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Ví dụ: 8621276989"
            />
            <p className="mt-2 text-xs text-slate-500">
              ID này được lưu vào tài khoản để nhận OTP quên mật khẩu. Hãy nhấn /start với bot cửa hàng trước khi sử dụng.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-medium text-white mb-4">Bảo mật</h3>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mật khẩu mới (Bỏ trống nếu không muốn đổi)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-10"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save size={18} />
              <span>{isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
