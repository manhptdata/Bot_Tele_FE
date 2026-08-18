import React, { useState } from 'react';
import { OrderDetail } from '../../types';
import { useMarkManuallyDeliveredMutation } from '../../api/orderApi';
import {
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface FailedAutoDeliveryPanelProps {
  order: OrderDetail;
  onSuccess?: () => void;
}

export const FailedAutoDeliveryPanel: React.FC<FailedAutoDeliveryPanelProps> = ({ order, onSuccess }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [markDelivered, { isLoading }] = useMarkManuallyDeliveredMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Gom toàn bộ tài khoản SOLD từ các OrderItem
  const deliveredAccountsSummary = order.items.flatMap((item) =>
    (item.deliveredAccounts || []).map((acc) => ({
      productName: item.productName,
      data: acc.join(' | '),
    }))
  );

  const telegramMessage = `📦 THÔNG TIN BÀN GIAO ĐƠN HÀNG #${order.orderCode}
━━━━━━━━━━━━━━━━━━
👤 Khách hàng: ${order.customer?.firstName || 'Quý khách'} (@${order.customer?.username || 'N/A'})
🛒 Sản phẩm:
${order.items.map((it) => `  • ${it.productName} (x${it.quantity})`).join('\n')}
💵 Tổng thanh toán: ${order.totalAmount.toLocaleString('vi-VN')} đ
━━━━━━━━━━━━━━━━━━
🔐 THÔNG TIN TÀI KHOẢN:
${deliveredAccountsSummary.map((acc, idx) => `${idx + 1}. [${acc.productName}] ${acc.data}`).join('\n')}
━━━━━━━━━━━━━━━━━━
⚠️ Lưu ý: Vui lòng đổi mật khẩu sau khi nhận và liên hệ Admin nếu cần hỗ trợ!`;

  const handleConfirmDelivered = async () => {
    setErrorMsg(null);
    try {
      await markDelivered({
        orderId: order.id,
        note: adminNote.trim() || 'Admin đã copy và gửi thủ công qua Telegram',
      }).unwrap();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.data?.error || 'Có lỗi xảy ra khi cập nhật đơn hàng.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-200">Đơn hàng tự động gửi thất bại qua Telegram (DELIVERY_FAILED)</p>
          <p className="text-amber-300/90 leading-relaxed">
            Hệ thống đã cấp sẵn tài khoản cho đơn hàng này từ lúc thanh toán. Bạn chỉ cần sao chép thông tin tài khoản bên
            dưới để gửi bù cho khách qua Telegram, sau đó bấm <strong>"Xác nhận đã xử lý giao tay"</strong>.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Danh sách tài khoản đã cấp */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>🔐 Tài khoản đã cấp cho đơn hàng</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {deliveredAccountsSummary.length} tài khoản
          </span>
        </h4>

        {deliveredAccountsSummary.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">Chưa tìm thấy bản ghi tài khoản cụ thể cho đơn hàng này.</p>
        ) : (
          <div className="space-y-2">
            {deliveredAccountsSummary.map((acc, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-400 font-semibold mb-0.5">{acc.productName}</div>
                  <div className="font-mono text-emerald-300 font-medium select-all break-all">{acc.data}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(acc.data, `acc-${index}`)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shrink-0 transition-colors"
                  title="Sao chép tài khoản này"
                >
                  {copiedKey === `acc-${index}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soạn tin nhắn Live Preview */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>💬 Mẫu tin nhắn gửi khách hàng (Live Preview)</span>
          </h4>
          <div className="flex items-center gap-2">
            {order.customer?.username && (
              <a
                href={`https://t.me/${order.customer.username}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở chat @{order.customer.username}</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => handleCopy(telegramMessage, 'msg')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              {copiedKey === 'msg' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép tin nhắn</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
          {telegramMessage}
        </div>
      </div>

      {/* Ghi chú & Nút Xác Nhận */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ghi chú xử lý (Tùy chọn):</label>
          <input
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Ví dụ: Đã gửi qua Telegram riêng lúc 14:30..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          disabled={isLoading}
          onClick={handleConfirmDelivered}
          className="w-full py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận đã xử lý giao tay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
