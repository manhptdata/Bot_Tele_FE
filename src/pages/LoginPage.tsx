import { useState } from 'react';
import { useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bot, KeyRound, MessageCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT_STEP_1' | 'FORGOT_STEP_2'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [forgotPassword, { isLoading: isRequestingOtp }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ username, password }).unwrap();
      dispatch(loginSuccess({
        token: response.token,
        refreshToken: response.refreshToken,
        user: { id: response.userId, username: response.userName, role: response.role }
      }));
      toast.success('Đăng nhập thành công!');
      navigate(response.role === 'ADMIN' ? '/dashboard' : '/orders');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error('Vui lòng nhập tên đăng nhập');
      return;
    }
    try {
      await forgotPassword({ username }).unwrap();
      toast.success('Đã gửi mã OTP qua Telegram của bạn!');
      setView('FORGOT_STEP_2');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể gửi OTP. Vui lòng kiểm tra lại.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    try {
      await resetPassword({ username, otp, newPassword }).unwrap();
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setView('LOGIN');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi xác nhận OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-slate-950">
      <div className="glass p-8 rounded-2xl w-full max-w-md border border-slate-700/50 shadow-2xl relative overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

        {view === 'LOGIN' && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                <Bot size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                BotShop Admin
              </h1>
              <p className="text-slate-400 mt-2 text-sm">Đăng nhập để quản lý hệ thống</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">Mật khẩu</label>
                  <button type="button" onClick={() => setView('FORGOT_STEP_1')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all pr-10"
                    placeholder="Nhập mật khẩu"
                    required
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
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoggingIn ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          </>
        )}

        {view === 'FORGOT_STEP_1' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setView('LOGIN')} className="text-slate-400 hover:text-white mb-6 flex items-center space-x-2 transition-colors">
              <ArrowLeft size={16} /> <span>Quay lại</span>
            </button>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg mb-4">
                <MessageCircle size={32} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Quên Mật Khẩu</h1>
              <p className="text-slate-400 mt-2 text-sm text-center">
                Mã OTP sẽ được gửi đến tài khoản Telegram mà bạn đã liên kết.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên đăng nhập của bạn</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isRequestingOtp ? 'Đang gửi...' : 'Gửi mã OTP qua Telegram'}
              </button>
            </form>
          </div>
        )}

        {view === 'FORGOT_STEP_2' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setView('FORGOT_STEP_1')} className="text-slate-400 hover:text-white mb-6 flex items-center space-x-2 transition-colors">
              <ArrowLeft size={16} /> <span>Quay lại</span>
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg mb-4">
                <KeyRound size={32} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Xác Nhận OTP</h1>
              <p className="text-slate-400 mt-2 text-sm text-center">
                Vui lòng kiểm tra tin nhắn Telegram của bot để lấy mã.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mã OTP (6 số)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-[0.5em] font-mono"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                    placeholder="Ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
              <button
                type="submit"
                disabled={isResettingPassword}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isResettingPassword ? 'Đang xử lý...' : 'Xác nhận Đổi mật khẩu'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
