import { useState, useEffect, useRef } from 'react';
import { 
  useGetPaymentConfigsQuery, 
  useGetWebhookInfoQuery, 
  useCreatePaymentConfigMutation, 
  useUpdatePaymentConfigMutation 
} from '../api/paymentApi';
import {
  useGetActiveBotConfigQuery,
  useUpdateBotConfigMutation,
  useDisconnectBotMutation,
} from '../api/botConfigApi';
import { 
  Save, 
  CreditCard, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Clock, 
  Sliders, 
  Zap, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Lock, 
  X, 
  AlertTriangle,
  Bot,
  Radio,
  Globe,
  Power,
  Phone,
  MessageSquare,
  UserCheck,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentConfigSaveRequest, BotMode, BotConfigSaveRequest } from '../types';
import { ConnectBotModal } from '../components/bot/ConnectBotModal';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'BOT' | 'PAYMENT'>('BOT');

  // ==================== BOT CONFIG STATE ====================
  const { data: botConfig, isLoading: isBotLoading } = useGetActiveBotConfigQuery();
  const [updateBotConfig, { isLoading: isUpdatingBot }] = useUpdateBotConfigMutation();
  const [disconnectBot, { isLoading: isDisconnectingBot }] = useDisconnectBotMutation();
  const [isConnectBotModalOpen, setIsConnectBotModalOpen] = useState(false);

  const [botFormData, setBotFormData] = useState<{
    mode: BotMode;
    webhookUrl: string;
    webhookSecretToken: string;
    clearWebhookSecret: boolean;
    adminChatId: string;
    contactTelegram: string;
    contactPhone: string;
  }>({
    mode: 'LONG_POLLING',
    webhookUrl: '',
    webhookSecretToken: '',
    clearWebhookSecret: false,
    adminChatId: '',
    contactTelegram: '',
    contactPhone: '',
  });

  const [isBotPasswordModalOpen, setIsBotPasswordModalOpen] = useState(false);
  const [botAdminPassword, setBotAdminPassword] = useState('');
  const [showBotAdminPassword, setShowBotAdminPassword] = useState(false);
  const [botActionType, setBotActionType] = useState<'SAVE' | 'DISCONNECT'>('SAVE');

  useEffect(() => {
    if (botConfig) {
      setBotFormData({
        mode: botConfig.mode || 'LONG_POLLING',
        webhookUrl: botConfig.webhookUrl || '',
        webhookSecretToken: '',
        clearWebhookSecret: false,
        adminChatId: botConfig.adminChatId ? String(botConfig.adminChatId) : '',
        contactTelegram: botConfig.contactTelegram || '',
        contactPhone: botConfig.contactPhone || '',
      });
    }
  }, [botConfig]);

  const handleBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBotActionType('SAVE');
    setBotAdminPassword('');
    setIsBotPasswordModalOpen(true);
  };

  const handleDisconnectClick = () => {
    setBotActionType('DISCONNECT');
    setBotAdminPassword('');
    setIsBotPasswordModalOpen(true);
  };

  const handleConfirmBotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botAdminPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu Admin để xác nhận');
      return;
    }

    try {
      if (botActionType === 'DISCONNECT') {
        await disconnectBot({ adminPassword: botAdminPassword.trim() }).unwrap();
        toast.success('Đã ngắt kết nối Telegram Bot an toàn!');
      } else {
        const payload: BotConfigSaveRequest = {
          mode: botFormData.mode,
          webhookUrl: botFormData.mode === 'WEBHOOK' ? (botFormData.webhookUrl?.trim() || undefined) : undefined,
          webhookSecretToken: botFormData.webhookSecretToken?.trim() || undefined,
          clearWebhookSecret: botFormData.clearWebhookSecret,
          adminChatId: botFormData.adminChatId ? Number(botFormData.adminChatId) : undefined,
          contactTelegram: botFormData.contactTelegram?.trim() || undefined,
          contactPhone: botFormData.contactPhone?.trim() || undefined,
          adminPassword: botAdminPassword.trim(),
        };
        await updateBotConfig(payload).unwrap();
        toast.success('Cập nhật cấu hình Telegram Bot thành công!');
      }
      setIsBotPasswordModalOpen(false);
      setBotAdminPassword('');
    } catch (err: any) {
      const msg = err?.data?.message || err?.error || 'Thao tác thất bại';
      toast.error(msg);
    }
  };

  // ==================== PAYMENT CONFIG STATE ====================
  const { data: configs = [], isLoading: isPaymentLoading } = useGetPaymentConfigsQuery();
  const { data: webhookInfo } = useGetWebhookInfoQuery();
  const [createConfig, { isLoading: isCreating }] = useCreatePaymentConfigMutation();
  const [updateConfig, { isLoading: isUpdating }] = useUpdatePaymentConfigMutation();

  const isSavingPayment = isCreating || isUpdating;
  const defaultConfig = configs.find(c => c.isDefault) || null;

  const [paymentFormData, setPaymentFormData] = useState({
    bankName: defaultConfig?.bankName || 'ACB',
    accountNumber: defaultConfig?.accountNumber || '',
    accountHolder: defaultConfig?.accountHolder || '',
    webhookProvider: defaultConfig?.webhookProvider || 'SEPAY',
    webhookApiKey: '',
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

  const [isPaymentPasswordModalOpen, setIsPaymentPasswordModalOpen] = useState(false);
  const [paymentAdminPassword, setPaymentAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [pendingPaymentPayload, setPendingPaymentPayload] = useState<PaymentConfigSaveRequest | null>(null);

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

  const sepayWebhookUrl = webhookInfo?.sepayWebhookUrl || (
    typeof window !== 'undefined'
      ? (import.meta.env.VITE_API_BASE_URL
          ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/api/webhook/sepay'
          : `${window.location.origin}/api/webhook/sepay`)
      : 'http://localhost:8080/api/webhook/sepay'
  );

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(sepayWebhookUrl);
    setIsCopiedWebhook(true);
    toast.success('Đã sao chép URL Webhook SePay!');
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (defaultConfig) {
      setPaymentFormData({
        bankName: defaultConfig.bankName,
        accountNumber: defaultConfig.accountNumber,
        accountHolder: defaultConfig.accountHolder,
        webhookProvider: defaultConfig.webhookProvider || 'SEPAY',
        webhookApiKey: '',
        paymentTimeoutMinutes: defaultConfig.paymentTimeoutMinutes !== undefined ? defaultConfig.paymentTimeoutMinutes : 5,
        bankFeeType: defaultConfig.bankFeeType || 'FIXED',
        bankFeeAmount: defaultConfig.bankFeeAmount !== undefined ? defaultConfig.bankFeeAmount : 0,
        guideContent: defaultConfig.guideContent || '',
      });
    }
  }, [defaultConfig]);

  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then((res) => res.json())
      .then((data) => {
        if (data.code === '00' && data.data) {
          setBanks(data.data);
        }
      })
      .catch((err) => console.error('Error fetching banks:', err));
  }, []);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentFormData({ ...paymentFormData, [e.target.name]: e.target.value });
  };

  const hasSensitivePaymentChanges = () => {
    if (!defaultConfig) return true;
    const bankNameChanged = paymentFormData.bankName?.trim() !== defaultConfig.bankName?.trim();
    const accNumChanged = paymentFormData.accountNumber?.trim() !== defaultConfig.accountNumber?.trim();
    const accHolderChanged = paymentFormData.accountHolder?.trim() !== defaultConfig.accountHolder?.trim();
    const providerChanged = paymentFormData.webhookProvider !== defaultConfig.webhookProvider;
    const apiKeyChanged = !!paymentFormData.webhookApiKey && paymentFormData.webhookApiKey.trim() !== '';
    return bankNameChanged || accNumChanged || accHolderChanged || providerChanged || apiKeyChanged;
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PaymentConfigSaveRequest = {
      bankName: paymentFormData.bankName?.trim(),
      accountNumber: paymentFormData.accountNumber?.trim(),
      accountHolder: paymentFormData.accountHolder?.trim().toUpperCase(),
      webhookProvider: paymentFormData.webhookProvider,
      paymentTimeoutMinutes: Number(paymentFormData.paymentTimeoutMinutes) || 5,
      bankFeeType: paymentFormData.bankFeeType as 'FIXED' | 'PERCENT',
      bankFeeAmount: Number(paymentFormData.bankFeeAmount) || 0,
      guideContent: paymentFormData.guideContent,
    };
    if (paymentFormData.webhookApiKey && paymentFormData.webhookApiKey.trim() !== '') {
      payload.webhookApiKey = paymentFormData.webhookApiKey.trim();
    }
    if (hasSensitivePaymentChanges()) {
      setPendingPaymentPayload(payload);
      setPaymentAdminPassword('');
      setIsPaymentPasswordModalOpen(true);
    } else {
      executeSavePayment(payload);
    }
  };

  const executeSavePayment = async (payload: PaymentConfigSaveRequest) => {
    try {
      if (defaultConfig?.id) {
        await updateConfig({ id: defaultConfig.id, data: payload }).unwrap();
      } else {
        await createConfig(payload).unwrap();
      }
      toast.success('Lưu cấu hình thanh toán thành công!');
      setIsPaymentPasswordModalOpen(false);
      setPaymentAdminPassword('');
      setPendingPaymentPayload(null);
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.error || 'Lỗi khi lưu cấu hình';
      toast.error(errorMsg);
    }
  };

  const handleConfirmPaymentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAdminPassword || paymentAdminPassword.trim() === '') {
      toast.error('Vui lòng nhập mật khẩu xác thực');
      return;
    }
    if (pendingPaymentPayload) {
      executeSavePayment({ ...pendingPaymentPayload, adminPassword: paymentAdminPassword.trim() });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Sliders className="text-blue-500" />
            Cấu Hình Hệ Thống
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quản lý Telegram Bot động, cổng thanh toán tự động SePay và tham số vận hành
          </p>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex gap-1 shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('BOT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'BOT'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bot size={16} />
            <span>Telegram Bot</span>
          </button>
          <button
            onClick={() => setActiveTab('PAYMENT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'PAYMENT'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CreditCard size={16} />
            <span>Thanh Toán & SePay</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: TELEGRAM BOT CONFIG ==================== */}
      {activeTab === 'BOT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Card Trạng Thái & Thông Tin Bot Hiện Tại */}
          <div className="glass p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Trạng Thái Telegram Bot</h3>
                    <p className="text-xs text-slate-400">Kết nối thời gian thực</p>
                  </div>
                </div>
                {botConfig?.status && (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      botConfig.status === 'RUNNING'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : botConfig.status === 'STARTING'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
                        : botConfig.status === 'FAILED'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {botConfig.status}
                  </span>
                )}
              </div>

              {isBotLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : botConfig?.botUsername ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Tên Bot:</span>
                      <a
                        href={`https://t.me/${botConfig.botUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        @{botConfig.botUsername}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Token (Mã hóa):</span>
                      <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {botConfig.maskedToken || '••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Phương thức:</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        {botConfig.mode === 'WEBHOOK' ? (
                          <>
                            <Globe size={14} className="text-blue-400" />
                            Webhook (HTTPS)
                          </>
                        ) : (
                          <>
                            <Radio size={14} className="text-amber-400" />
                            Long Polling
                          </>
                        )}
                      </span>
                    </div>
                    {botConfig.errorMessage && (
                      <div className="p-2.5 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-[11px] leading-relaxed">
                        ⚠️ <strong>Lỗi:</strong> {botConfig.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <p className="text-slate-400 text-xs">Chưa có Telegram Bot nào được kết nối với hệ thống.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConnectBotModalOpen(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Bot size={16} />
                <span>{botConfig?.botUsername ? 'Đổi Bot Token Mới' : 'Kết Nối Telegram Bot'}</span>
              </button>

              {botConfig?.botUsername && (
                <button
                  type="button"
                  onClick={handleDisconnectClick}
                  disabled={isDisconnectingBot}
                  className="w-full py-2.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Power size={15} />
                  <span>Ngắt Kết Nối Bot</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Cấu Hình Chi Tiết Bot */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <Sliders size={20} className="text-blue-400" />
              <h3 className="text-base font-bold text-white">Tham Số Vận Hành Telegram Bot</h3>
            </div>

            <form onSubmit={handleBotSubmit} className="space-y-4">
              {/* Metadata Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-cyan-400" />
                      Admin Telegram ID
                    </label>
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Lấy ID ở @userinfobot
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={botFormData.adminChatId}
                    onChange={(e) => setBotFormData({ ...botFormData, adminChatId: e.target.value.replace(/\D/g, '') })}
                    placeholder="VD: 123456789"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs placeholder:text-slate-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Dùng nhận thông báo đơn hàng & mã OTP</p>

                  {/* Khung hướng dẫn lấy ID */}
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 mt-2">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                      <Info size={13} />
                      <span>Hướng dẫn lấy ID (cho người mới):</span>
                    </div>
                    <ol className="space-y-1 text-slate-300 text-[10px] leading-relaxed list-decimal list-inside pl-0.5">
                      <li>Mở Telegram, tìm bot <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">@userinfobot</a></li>
                      <li>Bấm <strong>START</strong> (hoặc gõ <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300 font-mono">/start</code>)</li>
                      <li>Copy dãy số ở dòng <strong>Id:</strong> (ví dụ: <code className="text-slate-400 font-mono">1234567890</code>) và dán vào ô trên</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-400" />
                    Telegram Hỗ Trợ
                  </label>
                  <input
                    type="text"
                    value={botFormData.contactTelegram}
                    onChange={(e) => setBotFormData({ ...botFormData, contactTelegram: e.target.value })}
                    placeholder="VD: @admin_support"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Hiển thị ở nút "Liên hệ Admin"</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-400" />
                    Số Điện Thoại / Zalo
                  </label>
                  <input
                    type="text"
                    value={botFormData.contactPhone}
                    onChange={(e) => setBotFormData({ ...botFormData, contactPhone: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kênh hỗ trợ dự phòng</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isUpdatingBot || !botConfig?.botUsername}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                >
                  {isUpdatingBot ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>Lưu Cấu Hình Telegram Bot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PAYMENT & SEPAY CONFIG ==================== */}
      {activeTab === 'PAYMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <div className="glass p-6 rounded-xl border border-slate-700/50">
            <div className="flex items-center space-x-2 mb-6 border-b border-slate-700/50 pb-4">
              <CreditCard className="text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Cấu hình Thanh toán</h2>
            </div>

            {isPaymentLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-slate-500" size={32} />
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
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
                          <span className={paymentFormData.bankName ? 'text-white font-medium' : 'text-gray-400'}>
                            {paymentFormData.bankName
                              ? banks.find((b) => b.shortName === paymentFormData.bankName)?.name || paymentFormData.bankName
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
                                .filter(
                                  (bank) =>
                                    bank.name.toLowerCase().includes(searchBank.toLowerCase()) ||
                                    bank.shortName.toLowerCase().includes(searchBank.toLowerCase())
                                )
                                .map((bank: any) => (
                                  <div
                                    key={bank.id}
                                    className="px-4 py-2 hover:bg-blue-600/20 cursor-pointer text-sm text-slate-200 flex flex-col"
                                    onClick={() => {
                                      setPaymentFormData({ ...paymentFormData, bankName: bank.shortName });
                                      setIsDropdownOpen(false);
                                      setSearchBank('');
                                    }}
                                  >
                                    <span className="font-medium text-blue-400">{bank.shortName}</span>
                                    <span className="text-xs text-slate-400">{bank.name}</span>
                                  </div>
                                ))}
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
                          value={paymentFormData.accountNumber}
                          onChange={handlePaymentChange}
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
                          value={paymentFormData.accountHolder}
                          onChange={handlePaymentChange}
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
                        <h4 className="text-sm font-semibold text-white">Cổng Thanh toán Tự động (SePay Webhook)</h4>
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
                          value={paymentFormData.webhookProvider}
                          onChange={handlePaymentChange}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm mb-2"
                        >
                          <option value="NONE">Tắt (Admin tự kiểm tra và duyệt đơn thủ công)</option>
                          <option value="SEPAY">SePay (sepay.vn) - Tự động đối soát & giao hàng</option>
                        </select>
                      </div>

                      {paymentFormData.webhookProvider === 'SEPAY' && (
                        <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
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
                                value={sepayWebhookUrl}
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
                              </div>
                            )}
                          </div>

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
                            </label>
                            <div className="relative">
                              <input
                                type={showApiKey ? 'text' : 'password'}
                                name="webhookApiKey"
                                value={paymentFormData.webhookApiKey}
                                onChange={handlePaymentChange}
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
                            value={paymentFormData.paymentTimeoutMinutes}
                            onChange={handlePaymentChange}
                            className="w-24 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center font-bold"
                          />
                          <span className="text-xs text-slate-400 leading-relaxed">
                            Sau <strong className="text-amber-400">{paymentFormData.paymentTimeoutMinutes || 5} phút</strong>, mã QR sẽ tự động bị xóa khỏi chat.
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <label className="block text-xs font-semibold text-slate-200">Phí giao dịch (Khách chịu)</label>
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            name="bankFeeType"
                            value={paymentFormData.bankFeeType}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, bankFeeType: e.target.value as 'FIXED' | 'PERCENT' })}
                            className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="FIXED">Cố định (VNĐ)</option>
                            <option value="PERCENT">Phần trăm (%)</option>
                          </select>
                          <input
                            type="number"
                            name="bankFeeAmount"
                            value={paymentFormData.bankFeeAmount}
                            onChange={handlePaymentChange}
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
                          onClick={() => setPaymentFormData({ ...paymentFormData, guideContent: DEFAULT_GUIDE_TEMPLATE })}
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Zap size={13} />
                          Áp dụng mẫu mặc định
                        </button>
                      </div>

                      <textarea
                        name="guideContent"
                        rows={8}
                        value={paymentFormData.guideContent}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, guideContent: e.target.value })}
                        placeholder={DEFAULT_GUIDE_TEMPLATE}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed custom-scrollbar"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="btn btn-primary w-full bg-blue-600 hover:bg-blue-500 py-3 flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
                  >
                    {isSavingPayment ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>{isSavingPayment ? 'Đang lưu...' : 'Lưu Cấu Hình Thanh Toán'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="glass p-6 rounded-xl border border-slate-700/50 h-fit">
            <h2 className="text-xl font-semibold text-white mb-4">Mô phỏng VietQR</h2>
            <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center border border-slate-700 border-dashed min-h-[300px]">
              {paymentFormData.bankName && paymentFormData.accountNumber ? (
                <>
                  <img
                    key={`${paymentFormData.bankName}-${paymentFormData.accountNumber}`}
                    src={`https://img.vietqr.io/image/${paymentFormData.bankName}-${paymentFormData.accountNumber}-compact2.png?amount=50000&addInfo=TEST_QR&accountName=${encodeURIComponent(paymentFormData.accountHolder)}`}
                    alt="VietQR Preview"
                    className="w-48 h-48 rounded-lg shadow-xl mb-4 bg-white p-2"
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
      )}

      {/* ==================== MODAL XÁC THỰC MẬT KHẨU BOT CONFIG ==================== */}
      {isBotPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Xác Nhận Bảo Mật Admin</h3>
                  <p className="text-xs text-slate-400">Yêu cầu xác thực tài khoản Quản trị</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBotPasswordModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                {botActionType === 'DISCONNECT'
                  ? 'Bạn sắp ngắt kết nối Bot Telegram khỏi hệ thống. Bot sẽ ngừng phản hồi khách hàng ngay lập tức.'
                  : 'Bạn đang thay đổi cấu hình runtime/phương thức nhận tin của Bot Telegram. Vui lòng xác thực mật khẩu Admin.'}
              </div>
            </div>

            <form onSubmit={handleConfirmBotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} className="text-blue-400" />
                  Mật khẩu tài khoản Admin
                </label>
                <div className="relative">
                  <input
                    type={showBotAdminPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={botAdminPassword}
                    onChange={(e) => setBotAdminPassword(e.target.value)}
                    placeholder="Nhập mật khẩu Admin của bạn"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotAdminPassword(!showBotAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showBotAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBotPasswordModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBot || isDisconnectingBot || !botAdminPassword.trim()}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors"
                >
                  {isUpdatingBot || isDisconnectingBot ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  <span>Xác Nhận</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL XÁC THỰC MẬT KHẨU PAYMENT ==================== */}
      {isPaymentPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Xác nhận Bảo Mật</h3>
                  <p className="text-xs text-slate-400">Yêu cầu quyền Quản trị viên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentPasswordModalOpen(false);
                  setPaymentAdminPassword('');
                  setPendingPaymentPayload(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                Bạn đang thay đổi <strong>Số tài khoản ngân hàng</strong> hoặc <strong>Khóa Webhook</strong> nhận tiền. Vui lòng nhập mật khẩu tài khoản Admin để xác nhận.
              </div>
            </div>

            <form onSubmit={handleConfirmPaymentPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} className="text-blue-400" />
                  Mật khẩu tài khoản Admin hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={paymentAdminPassword}
                    onChange={(e) => setPaymentAdminPassword(e.target.value)}
                    placeholder="Nhập mật khẩu Admin của bạn"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentPasswordModalOpen(false);
                    setPaymentAdminPassword('');
                    setPendingPaymentPayload(null);
                  }}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment || !paymentAdminPassword.trim()}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors"
                >
                  {isSavingPayment ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  <span>{isSavingPayment ? 'Đang lưu...' : 'Xác Nhận & Lưu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Bot Modal */}
      <ConnectBotModal
        isOpen={isConnectBotModalOpen}
        onClose={() => setIsConnectBotModalOpen(false)}
      />
    </div>
  );
};
