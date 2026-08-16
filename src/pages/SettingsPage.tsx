import { useState, useEffect, useRef } from 'react';
import { useGetPaymentConfigsQuery, useGetWebhookInfoQuery, useCreatePaymentConfigMutation } from '../api/paymentApi';
import { Save, CreditCard, Loader2, ChevronDown, ChevronUp, Search, Clock, Sliders, Zap, Copy, Check, BookOpen, ExternalLink, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { data: configs = [], isLoading } = useGetPaymentConfigsQuery();
  const { data: webhookInfo } = useGetWebhookInfoQuery();
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
    guideContent: defaultConfig?.guideContent || '',
  });

  const [isBankConfigOpen, setIsBankConfigOpen] = useState(true);
  const [isWebhookConfigOpen, setIsWebhookConfigOpen] = useState(true);
  const [isOrderConfigOpen, setIsOrderConfigOpen] = useState(true);
  const [isGuideConfigOpen, setIsGuideConfigOpen] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSePayGuide, setShowSePayGuide] = useState(false);
  const [isCopiedWebhook, setIsCopiedWebhook] = useState(false);

  const DEFAULT_GUIDE_TEMPLATE = `ℹ️ *Hướng dẫn sử dụng BotShop*

🛒 *Xem sản phẩm* — Xem danh mục và mua hàng
💳 *Ví của tôi* — Xem số dư và nạp tiền
📞 *Liên hệ Admin* — Hỗ trợ khi cần

*Chính sách & Bảo hành:*
• Bảo hành 1 đổi 1 trong 24h nếu tài khoản bị lỗi.
• Hỗ trợ kỹ thuật 24/7 qua nút Liên hệ Admin.

*Các lệnh nhanh:*
\`/start\` — Khởi động Bot
\`/menu\` — Xem sản phẩm
\`/wallet\` — Xem ví
\`/help\` — Xem hướng dẫn`;

  // Link Webhook được trích xuất tự động 100% từ biến môi trường của Backend hoặc Domain máy chủ
  const webhookUrl = webhookInfo?.sepayWebhookUrl || (
    typeof window !== 'undefined'
      ? (import.meta.env.VITE_API_BASE_URL
          ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/api/webhook/sepay'
          : `${window.location.origin}/api/webhook/sepay`)
      : 'http://localhost:8080/api/webhook/sepay'
  );

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setIsCopiedWebhook(true);
    toast.success('Đã sao chép URL Webhook!');
    setTimeout(() => setIsCopiedWebhook(false), 2000);
  };

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
        guideContent: defaultConfig.guideContent || '',
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
      const payload: any = {
        ...formData,
        paymentTimeoutMinutes: Number(formData.paymentTimeoutMinutes) || 5,
        bankFeeAmount: Number(formData.bankFeeAmount) || 0,
        id: defaultConfig?.id,
        isDefault: true
      };
      if (!formData.webhookApiKey || formData.webhookApiKey.trim() === '') {
        delete payload.webhookApiKey;
      }
      await createConfig(payload).unwrap();
      toast.success('Lưu cấu hình thanh toán thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình');
    }
  };

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
                      <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* URL Webhook cần dán vào SePay */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              🔗 <strong>URL Webhook của bạn</strong> (Dán vào SePay)
                            </span>
                            <span className="text-[11px] text-emerald-400 font-normal">Sẵn sàng nhận dữ liệu</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={webhookUrl}
                              className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleCopyWebhook}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              {isCopiedWebhook ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                              <span>{isCopiedWebhook ? 'Đã chép' : 'Sao chép'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Nút bật/tắt Hướng dẫn 3 bước */}
                        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                              <BookOpen size={15} className="text-blue-400" />
                              Hướng dẫn kết nối SePay trong 3 bước (Người mới)
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowSePayGuide(!showSePayGuide)}
                              className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
                            >
                              {showSePayGuide ? 'Thu gọn' : 'Xem chi tiết'}
                            </button>
                          </div>

                          {showSePayGuide && (
                            <div className="text-xs text-slate-300 space-y-2.5 pt-2 border-t border-blue-900/40 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                                <div>
                                  Đăng nhập vào <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-blue-400 underline font-medium inline-flex items-center gap-0.5">my.sepay.vn <ExternalLink size={11} /></a> $\rightarrow$ Menu bên trái chọn <strong>Tích hợp Webhook</strong> $\rightarrow$ Bấm <strong>Tạo Webhook mới</strong>.
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                                <div>
                                  Dán <strong>URL Webhook</strong> vừa copy ở trên vào ô URL. Ở mục <em>Điều kiện gửi Webhook</em>, chọn: <strong>"Gửi tất cả giao dịch"</strong> (Mặc định).
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                                <div>
                                  Copy chuỗi <strong>API Key</strong> bí mật trên SePay dán vào ô <em>Webhook API Key</em> bên dưới $\rightarrow$ Bấm <strong>Lưu Cấu Hình</strong> là hoàn tất!
                                </div>
                              </div>

                              <div className="bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-lg text-amber-300 text-[11px] leading-relaxed">
                                💡 <strong>Không cần cấu hình mã:</strong> Server BotShop đã tự động nhận diện cả mã Đơn hàng (<code>ORD_...</code>) và Nạp ví (<code>NAP_...</code>). Bạn <strong>không cần</strong> phải vào mục <em>"Cấu hình mã thanh toán"</em> hay cài Regex phức tạp!
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Webhook API Key */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              Webhook API Key
                              {defaultConfig?.isWebhookApiKeyConfigured && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                                  ✓ Đã cấu hình an toàn
                                </span>
                              )}
                            </span>
                            <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                              Lấy API Key trên SePay <ExternalLink size={12} />
                            </a>
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              name="webhookApiKey"
                              value={formData.webhookApiKey}
                              onChange={handleChange}
                              placeholder={defaultConfig?.isWebhookApiKeyConfigured ? '•••••••• (Để trống nếu giữ nguyên API Key hiện tại)' : 'Dán mã API Key lấy từ SePay vào đây'}
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
                          {defaultConfig?.isWebhookApiKeyConfigured && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              API Key được lưu trữ mã hóa trên server. Chỉ nhập vào ô trên khi bạn muốn thay đổi mã key mới.
                            </p>
                          )}
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

              {/* ACCORDION 4: CẤU HÌNH HƯỚNG DẪN & CHÍNH SÁCH BOT */}
              <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setIsGuideConfigOpen(!isGuideConfigOpen)}
                  className="w-full p-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-800/70 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Hướng dẫn & Chính sách Bot</h4>
                      <p className="text-xs text-slate-400">Nội dung hiển thị khi khách bấm "Hướng dẫn" trên Telegram</p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isGuideConfigOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isGuideConfigOpen && (
                  <div className="p-4 space-y-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-200">
                        Nội dung Hướng dẫn (Hỗ trợ Markdown Telegram)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, guideContent: DEFAULT_GUIDE_TEMPLATE })}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Zap size={13} />
                        Áp dụng mẫu mặc định
                      </button>
                    </div>

                    <textarea
                      name="guideContent"
                      rows={8}
                      value={formData.guideContent}
                      onChange={(e) => setFormData({ ...formData, guideContent: e.target.value })}
                      placeholder={DEFAULT_GUIDE_TEMPLATE}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed custom-scrollbar"
                    />

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 <em>Gợi ý:</em> Bạn có thể tự thêm thông tin bảo hành, quy định nạp tiền, link group chat... Nếu để trống, Bot sẽ tự động sử dụng mẫu hướng dẫn mặc định.
                    </p>
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
      </div>
    </div>
  );
};
