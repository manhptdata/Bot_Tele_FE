import React, { useState, useEffect } from 'react';
import { useGetMeQuery, useUpdateMeMutation, useChangePasswordMutation } from '../api/userApi';
import { UserCircle, Mail, MessageCircle, Shield, Save, Eye, EyeOff, Phone, Send, Headphones, KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { data: meData, isLoading } = useGetMeQuery();
  const [updateMe, { isLoading: isUpdatingProfile }] = useUpdateMeMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  // Form 1: Thông tin cá nhân & Liên hệ hỗ trợ
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    telegramChatId: '',
    phoneNumber: '',
    zalo: '',
    telegramUsername: '',
    isSupportContact: true,
  });

  // Form 2: Đổi mật khẩu bảo mật
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (meData) {
      setFormData({
        fullName: meData.fullName || '',
        email: meData.email || '',
        telegramChatId: meData.telegramChatId || '',
        phoneNumber: meData.phoneNumber || '',
        zalo: meData.zalo || '',
        telegramUsername: meData.telegramUsername || '',
        isSupportContact: meData.isSupportContact !== undefined ? meData.isSupportContact : true,
      });
    }
  }, [meData]);

  // Xử lý lưu thông tin hồ sơ
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meData) return;

    try {
      await updateMe({
        fullName: formData.fullName,
        email: formData.email,
        telegramChatId: formData.telegramChatId.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        zalo: formData.zalo.trim() || undefined,
        telegramUsername: formData.telegramUsername.trim() || undefined,
        isSupportContact: formData.isSupportContact,
      }).unwrap();

      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Lỗi khi cập nhật hồ sơ');
    }
  };

  // Xử lý đổi mật khẩu
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();

      toast.success('Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập sau.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Mật khẩu hiện tại không chính xác!');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-slate-400">Đang tải...</div>;
  }

  const user = meData;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <UserCircle className="text-blue-400" />
          Hồ sơ cá nhân
        </h1>
        <p className="text-slate-400">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
      </div>

      {/* CARD 1: THÔNG TIN HỒ SƠ & LIÊN HỆ */}
      <div className="glass rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-slate-700">
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

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Họ và tên *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
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
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <MessageCircle size={16} />
              Telegram Chat ID (Nhận OTP Bảo Mật)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
              placeholder="Ví dụ: 1234567890"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              ID này được dùng để nhận mã OTP khi khôi phục tài khoản qua Telegram.
            </p>
          </div>

          {/* Thông tin liên hệ hỗ trợ khách hàng */}
          <div className="pt-6 border-t border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-blue-400">
              <Headphones size={18} />
              <span>Thông tin liên hệ hỗ trợ khách hàng</span>
            </div>
            <p className="text-xs text-slate-400">
              Các thông tin này sẽ được hiển thị cho khách hàng khi họ bấm nút "Liên hệ Admin" trên Telegram Bot.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Phone size={16} className="text-emerald-400" />
                  Số điện thoại (SĐT)
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
                  placeholder="VD: 0912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <MessageCircle size={16} className="text-blue-400" />
                  Zalo (SĐT hoặc Link Zalo)
                </label>
                <input
                  type="text"
                  value={formData.zalo}
                  onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
                  placeholder="VD: 0912345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Send size={16} className="text-sky-400" />
                Telegram Username (để khách liên hệ)
              </label>
              <input
                type="text"
                value={formData.telegramUsername}
                onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-mono"
                placeholder="VD: @admin_support"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="isSupportContactProfile"
                checked={formData.isSupportContact}
                onChange={(e) => setFormData({ ...formData, isSupportContact: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
              <label htmlFor="isSupportContactProfile" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-medium text-white block text-sm">Bật hiển thị làm Admin hỗ trợ trên Telegram Bot</span>
                Khi bật, khách hàng bấm "Liên hệ Admin" trên Bot sẽ nhìn thấy thông tin của bạn
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm"
            >
              {isUpdatingProfile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{isUpdatingProfile ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: ĐỔI MẬT KHẨU BẢO MẬT */}
      <div className="glass rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center space-x-2 mb-6 border-b border-slate-700/50 pb-4">
          <KeyRound className="text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Đổi Mật Khẩu</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu hiện tại *</label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                required
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="Nhập mật khẩu đang sử dụng"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu mới *</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Ít nhất 6 ký tự"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Xác nhận mật khẩu mới *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-lg disabled:opacity-50 text-sm"
            >
              {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
