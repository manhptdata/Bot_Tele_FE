import React, { useState } from 'react';
import { Bot, Lock, ShieldCheck, X, Loader2, Info, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useConnectBotMutation } from '../../api/botConfigApi';
import toast from 'react-hot-toast';

interface ConnectBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectBotModal: React.FC<ConnectBotModalProps> = ({ isOpen, onClose }) => {
  const [botToken, setBotToken] = useState('');
  const [showBotToken, setShowBotToken] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [connectBot, { isLoading }] = useConnectBotMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!botToken.trim()) {
      toast.error('Vui lòng nhập Bot Token từ @BotFather');
      return;
    }
    if (!adminPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu tài khoản Admin để xác thực');
      return;
    }

    try {
      const result = await connectBot({
        botToken: botToken.trim(),
        adminPassword: adminPassword.trim(),
      }).unwrap();

      toast.success(`Đã kết nối thành công với Bot @${result.botUsername}!`);
      onClose();
      setBotToken('');
      setAdminPassword('');
    } catch (err: any) {
      const msg = err?.data?.message || err?.error || 'Kết nối Telegram Bot thất bại';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kết Nối Telegram Bot</h3>
              <p className="text-xs text-slate-400">Cấu hình Bot Telegram kinh doanh tự động</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Telegram Bot Token</span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                Mở @BotFather
                <ExternalLink size={12} />
              </a>
            </label>
            <div className="relative">
              <input
                type={showBotToken ? 'text' : 'password'}
                required
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="VD: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowBotToken(!showBotToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showBotToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Lấy token từ @BotFather trên Telegram</p>
          </div>

          {/* Khung hướng dẫn tạo bot */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Info size={16} />
              <span>Hướng dẫn tạo Bot:</span>
            </div>
            <ol className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed list-decimal list-inside pl-1">
              <li>Mở Telegram, tìm kiếm <strong>@BotFather</strong></li>
              <li>Gửi lệnh <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300 font-mono">/newbot</code></li>
              <li>Đặt tên và username cho bot (ví dụ: <code className="text-slate-400 font-mono">myshop_bot</code>)</li>
              <li>Copy chuỗi HTTP API Token và dán vào ô bên trên</li>
            </ol>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Lock size={14} className="text-amber-400" />
              <span>Xác thực Mật khẩu Quản trị (Sudo Verification)</span>
            </div>
            <div className="relative">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Nhập mật khẩu tài khoản Admin hiện tại"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !botToken.trim() || !adminPassword.trim()}
              className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              <span>{isLoading ? 'Đang kết nối...' : 'Kết Nối'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
