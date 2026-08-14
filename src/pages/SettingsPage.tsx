import { useState, useEffect, useRef } from 'react';
import { useGetPaymentConfigsQuery, useCreatePaymentConfigMutation } from '../api/paymentApi';
import { useChangePasswordMutation, useGetMeQuery, useUpdateMeMutation } from '../api/userApi';
import { Save, CreditCard, Loader2, ChevronDown, ChevronUp, Search, KeyRound, Eye, EyeOff, MessageCircle, Clock, Sliders, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { data: configs = [], isLoading } = useGetPaymentConfigsQuery();
  const [createConfig, { isLoading: isSaving }] = useCreatePaymentConfigMutation();

  // Lấy config mặc định hiện tại (nếu có)
  const defaultConfig = configs.find(c => c.isDefault) || null;

  const [formData, setFormData] = useState({
    bankName: defaultConfig?.bankName || 'ACB',
    accountNumber: defaultConfig?.accountNumber || '',
    accountHolder: defaultConfig?.accountHolder || '',
    webhookProvider: defaultConfig?.webhookProvider || 'SEPAY',
    webhookApiKey: defaultConfig?.webhookApiKey || '',
    paymentTimeoutMinutes: defaultConfig?.paymentTimeoutMinutes !== undefined ? defaultConfig.paymentTimeoutMinutes : 5,
    bankFeeType: defaultConfig?.bankFeeType || 'FIXED',
    bankFeeAmount: defaultConfig?.bankFeeAmount !== undefined ? defaultConfig.bankFeeAmount : 0,
  });

  const [isBankConfigOpen, setIsBankConfigOpen] = useState(true);
  const [isWebhookConfigOpen, setIsWebhookConfigOpen] = useState(true);
  const [isOrderConfigOpen, setIsOrderConfigOpen] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: currentUser } = useGetMeQuery();
  const [updateMe, { isLoading: isUpdatingUser }] = useUpdateMeMutation();
  const [telegramId, setTelegramId] = useState('');

  useEffect(() => {
    if (currentUser?.telegramChatId) {
      setTelegramId(currentUser.telegramChatId);
    }
  }, [currentUser]);

  const [banks, setBanks] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchBank, setSearchBank] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (defaultConfig) {
      setFormData({
        bankName: defaultConfig.bankName,
        accountNumber: defaultConfig.accountNumber,
        accountHolder: defaultConfig.accountHolder,
        webhookProvider: defaultConfig.webhookProvider || 'SEPAY',
        webhookApiKey: defaultConfig.webhookApiKey || '',
        paymentTimeoutMinutes: defaultConfig.paymentTimeoutMinutes !== undefined ? defaultConfig.paymentTimeoutMinutes : 5,
        bankFeeType: defaultConfig.bankFeeType || 'FIXED',
        bankFeeAmount: defaultConfig.bankFeeAmount !== undefined ? defaultConfig.bankFeeAmount : 0,
      });
    }
  }, [defaultConfig]);

  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => {
        if (data.code === '00' && data.data) {
          setBanks(data.data);
        }
      })
      .catch(err => console.error("Error fetching banks:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConfig({
        ...formData,
        paymentTimeoutMinutes: Number(formData.paymentTimeoutMinutes) || 5,
        bankFeeAmount: Number(formData.bankFeeAmount) || 0,
        id: defaultConfig?.id,
        isDefault: true
      }).unwrap();
      toast.success('Lưu cấu hình thanh toán thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình');
    }
  };

  const handleUpdateTelegramId = async () => {
    if (!currentUser) return;
    try {
      await updateMe({
        fullName: currentUser.fullName,
        telegramChatId: telegramId
      }).unwrap();
      toast.success('Đã cập nhật Telegram ID nhận thông báo thành công!');
    } catch (err) {
      toast.error('Lỗi khi cập nhật Telegram ID');
    }
  };

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

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
        newPassword: passwordForm.newPassword
      }).unwrap();
      toast.success('Đổi mật khẩu thành công! Hãy dùng mật khẩu mới cho lần đăng nhập sau.');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi đổi mật khẩu (Mật khẩu cũ không đúng?)');
    }
  };

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Cấu hình Hệ thống</h1>
        <p className="text-gray-400 mt-1">Cài đặt thông tin nhận tiền, Webhook tự động và xử lý đơn hàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-6 border-b border-slate-700/50 pb-4">
            <CreditCard className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Cấu hình Thanh toán</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-slate-500" size={32} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ACCORDION 1: THÔNG TIN TÀI KHOẢN NGÂN HÀNG */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setIsBankConfigOpen(!isBankConfigOpen)}
                  className="w-full p-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Thông tin Tài khoản Ngân hàng</h4>
                      <p className="text-xs text-slate-400">Tài khoản nhận tiền và tạo mã VietQR</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isBankConfigOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isBankConfigOpen && (
                  <div className="p-4 space-y-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Ngân hàng (BIN / Tên viết tắt)</label>

                      <div
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer flex justify-between items-center text-sm"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span className={formData.bankName ? 'text-white font-medium' : 'text-gray-400'}>
                          {formData.bankName
                            ? banks.find(b => b.shortName === formData.bankName)?.name || formData.bankName
                            : '-- Chọn Ngân hàng --'}
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>

                      {isDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-2 border-b border-slate-700/50 flex items-center space-x-2 bg-slate-800/80 sticky top-0">
                            <Search size={16} className="text-gray-400" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Tìm ngân hàng (VD: MB, Vietcombank...)"
                              value={searchBank}
                              onChange={(e) => setSearchBank(e.target.value)}
                              className="w-full bg-transparent text-white focus:outline-none text-sm"
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {banks
                              .filter(bank =>
                                bank.name.toLowerCase().includes(searchBank.toLowerCase()) ||
                                bank.shortName.toLowerCase().includes(searchBank.toLowerCase())
                              )
                              .map((bank: any) => (
                                <div
                                  key={bank.id}
                                  className="px-4 py-2 hover:bg-blue-600/20 cursor-pointer text-sm text-slate-200 flex flex-col"
                                  onClick={() => {
                                    setFormData({ ...formData, bankName: bank.shortName });
                                    setIsDropdownOpen(false);
                                    setSearchBank('');
                                  }}
                                >
                                  <span className="font-medium text-blue-400">{bank.shortName}</span>
                                  <span className="text-xs text-slate-400">{bank.name}</span>
                                </div>
                              ))}
                            {banks.filter(bank =>
                              bank.name.toLowerCase().includes(searchBank.toLowerCase()) ||
                              bank.shortName.toLowerCase().includes(searchBank.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                Không tìm thấy ngân hàng
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Số Tài Khoản</label>
                      <input
                        type="text"
                        name="accountNumber"
                        required
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="Nhập số tài khoản ngân hàng"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Chủ Tài Khoản</label>
                      <input
                        type="text"
                        name="accountHolder"
                        required
                        value={formData.accountHolder}
                        onChange={handleChange}
                        placeholder="VIET HOA CHU KHONG DAU"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION 2: CỔNG THANH TOÁN TỰ ĐỘNG (WEBHOOK / SEPAY) */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setIsWebhookConfigOpen(!isWebhookConfigOpen)}
                  className="w-full p-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Cổng Thanh toán Tự động (Webhook)</h4>
                      <p className="text-xs text-slate-400">Tích hợp SePay tự động đối soát và giao hàng</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isWebhookConfigOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isWebhookConfigOpen && (
                  <div className="p-4 space-y-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Cổng thanh toán tự động</label>
                      <select
                        name="webhookProvider"
                        value={formData.webhookProvider}
                        onChange={handleChange}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm mb-2"
                      >
                        <option value="NONE">Tắt (Admin tự kiểm tra và duyệt đơn thủ công)</option>
                        <option value="SEPAY">SePay (sepay.vn) - Tự động đối soát & giao hàng</option>
                      </select>
                      <p className="text-xs text-slate-400">
                        {formData.webhookProvider === 'NONE' && 'Khi tắt, bạn sẽ phải tự kiểm tra app ngân hàng và bấm Đã Thanh Toán trên web để giao hàng.'}
                        {formData.webhookProvider === 'SEPAY' && 'SePay sẽ tự động đối soát giao dịch và duyệt đơn ngay khi có tiền vào.'}
                      </p>
                    </div>

                    {formData.webhookProvider === 'SEPAY' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-2 border-t border-slate-800">
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                          <span>Webhook API Key</span>
                          <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" title="Đăng nhập SePay -> Chọn 'Tích hợp Webhook' ở menu bên trái để lấy mã API Key" className="text-xs text-blue-400 hover:underline">
                            Lấy API Key ở đâu?
                          </a>
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            name="webhookApiKey"
                            value={formData.webhookApiKey}
                            onChange={handleChange}
                            placeholder="Mật khẩu bí mật để nhận Webhook từ SePay"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACCORDION 3: CẤU HÌNH ĐƠN HÀNG & PHÍ GIAO DỊCH */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setIsOrderConfigOpen(!isOrderConfigOpen)}
                  className="w-full p-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Sliders size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Cấu hình Đơn hàng & Phí</h4>
                      <p className="text-xs text-slate-400">Thời gian chờ & phí giao dịch</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isOrderConfigOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isOrderConfigOpen && (
                  <div className="p-4 space-y-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-400" />
                        Thời gian chờ thanh toán (Phút)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          name="paymentTimeoutMinutes"
                          value={formData.paymentTimeoutMinutes}
                          onChange={handleChange}
                          className="w-24 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center font-bold"
                        />
                        <span className="text-xs text-slate-400 leading-relaxed">
                          Sau <strong className="text-amber-400">{formData.paymentTimeoutMinutes || 5} phút</strong>, mã QR sẽ tự động bị xóa khỏi chat.
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <label className="block text-xs font-semibold text-slate-200">Phí giao dịch (Khách chịu)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          name="bankFeeType"
                          value={formData.bankFeeType}
                          onChange={(e) => setFormData({ ...formData, bankFeeType: e.target.value as 'FIXED' | 'PERCENT' })}
                          className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="FIXED">Cố định (VNĐ)</option>
                          <option value="PERCENT">Phần trăm (%)</option>
                        </select>
                        <input
                          type="number"
                          name="bankFeeAmount"
                          value={formData.bankFeeAmount}
                          onChange={handleChange}
                          className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary w-full bg-blue-600 hover:bg-blue-500 py-3 flex items-center justify-center space-x-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="glass p-6 rounded-xl border border-slate-700/50 h-fit">
          <h2 className="text-xl font-semibold text-white mb-4">Mô phỏng VietQR</h2>
          <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center border border-slate-700 border-dashed min-h-[300px]">
            {formData.bankName && formData.accountNumber ? (
              <>
                <img
                  key={`${formData.bankName}-${formData.accountNumber}`}
                  src={`https://img.vietqr.io/image/${formData.bankName}-${formData.accountNumber}-compact2.png?amount=50000&addInfo=TEST_QR&accountName=${encodeURIComponent(formData.accountHolder)}`}
                  alt="VietQR Preview"
                  className="w-48 h-48 rounded-lg shadow-xl mb-4 bg-white p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=L%E1%BB%97i+Ng%C3%A2n+H%C3%A0ng';
                  }}
                />
                <p className="text-slate-300 font-medium">Mô phỏng ảnh QR khi khách mua hàng</p>
                <p className="text-slate-500 text-sm mt-2">Dùng App ngân hàng quét thử để kiểm tra (không cần chuyển tiền thật).</p>
              </>
            ) : (
              <p className="text-slate-500">Vui lòng điền đủ Mã Ngân hàng và Số Tài Khoản để xem trước mã QR.</p>
            )}
          </div>
        </div>

        {/* Form Liên kết Telegram */}
        <div className="glass p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-6 border-b border-slate-700/50 pb-4">
            <MessageCircle className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Liên kết ID Telegram</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Cung cấp ID Telegram của bạn để nhận mã OTP lấy lại mật khẩu khi bị quên. Bạn có thể lấy ID bằng cách chat với bot @userinfobot trên Telegram.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Telegram Chat ID</label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="VD: 123456789"
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleUpdateTelegramId}
                  disabled={isUpdatingUser}
                  className="btn btn-primary bg-blue-600 hover:bg-blue-500 px-6 py-2.5 flex items-center justify-center space-x-2 rounded-lg"
                >
                  {isUpdatingUser ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Lưu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Đổi Mật Khẩu */}
        <div className="glass p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-6 border-b border-slate-700/50 pb-4">
            <KeyRound className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Đổi Mật Khẩu</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  required
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu đang sử dụng"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  required
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn btn-primary w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white py-3 flex items-center justify-center space-x-2"
              >
                {isChangingPassword ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>{isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
