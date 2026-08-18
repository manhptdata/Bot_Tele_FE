import React, { useState } from 'react';
import { OrderDetail } from '../../types';
import {
  useReleaseReservedAccountMutation,
  useCompleteManualDeliveryMutation,
} from '../../api/orderApi';
import { AvailableAccountPicker } from './AvailableAccountPicker';
import {
  Package,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  Plus,
  AlertCircle,
  ShieldCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface ManualDeliveryPanelProps {
  order: OrderDetail;
  onSuccess?: () => void;
}

export const ManualDeliveryPanel: React.FC<ManualDeliveryPanelProps> = ({ order, onSuccess }) => {
  const [deliverySource, setDeliverySource] = useState<'INVENTORY' | 'CUSTOM'>('INVENTORY');
  const [customContent, setCustomContent] = useState(order.manualDeliveryContent || '');
  const [releaseExistingReservations, setReleaseExistingReservations] = useState(false);
  const [showSwitchWarningModal, setShowSwitchWarningModal] = useState(false);
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);

  // Picker state
  const [pickerTarget, setPickerTarget] = useState<{
    orderItemId: number;
    productName: string;
    maxNeeded: number;
    currentCount: number;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [releaseAccount, { isLoading: isReleasing }] = useReleaseReservedAccountMutation();
  const [completeDelivery, { isLoading: isCompleting }] = useCompleteManualDeliveryMutation();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Tổng số tài khoản RESERVED hiện có trong đơn
  const totalReservedCount = order.items.reduce(
    (sum, it) => sum + (it.reservedAccounts?.length || 0),
    0
  );

  // Kiểm tra từng item đã chọn đủ tài khoản chưa
  const isInventoryFullySelected = order.items.every(
    (it) => (it.reservedAccounts?.length || 0) === it.quantity
  );

  // Xử lý chuyển Radio source
  const handleSourceChange = (newSource: 'INVENTORY' | 'CUSTOM') => {
    if (newSource === 'CUSTOM' && totalReservedCount > 0) {
      setShowSwitchWarningModal(true);
    } else {
      setDeliverySource(newSource);
      setReleaseExistingReservations(false);
    }
  };

  const confirmSwitchToCustom = () => {
    setDeliverySource('CUSTOM');
    setReleaseExistingReservations(true);
    setShowSwitchWarningModal(false);
  };

  // Bỏ chọn 1 tài khoản
  const handleRelease = async (orderItemId: number, accountId: number) => {
    setErrorMsg(null);
    try {
      await releaseAccount({ orderId: order.id, orderItemId, accountId }).unwrap();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.data?.error || 'Không thể bỏ chọn tài khoản này.');
    }
  };

  // Tạo nội dung Live Preview tin nhắn Telegram
  const generatePreviewMessage = () => {
    let credentialSection = '';
    if (deliverySource === 'INVENTORY') {
      const reservedList = order.items.flatMap((it) =>
        (it.reservedAccounts || []).map((acc) => ({
          productName: it.productName,
          data: acc.accountData.join(' | '),
        }))
      );
      if (reservedList.length === 0) {
        credentialSection = '⏳ [Chưa có tài khoản nào được chọn từ kho]';
      } else {
        credentialSection = reservedList
          .map((acc, idx) => `${idx + 1}. [${acc.productName}] ${acc.data}`)
          .join('\n');
      }
    } else {
      credentialSection = customContent.trim() || '⏳ [Chưa nhập nội dung tài khoản / link bàn giao]';
    }

    return `📦 THÔNG TIN BÀN GIAO ĐƠN HÀNG #${order.orderCode}
━━━━━━━━━━━━━━━━━━
👤 Khách hàng: ${order.customer?.firstName || 'Quý khách'} (@${order.customer?.username || 'N/A'})
🛒 Sản phẩm:
${order.items.map((it) => `  • ${it.productName} (x${it.quantity})`).join('\n')}
💵 Tổng thanh toán: ${order.totalAmount.toLocaleString('vi-VN')} đ
━━━━━━━━━━━━━━━━━━
🔐 THÔNG TIN BÀN GIAO:
${credentialSection}
━━━━━━━━━━━━━━━━━━
🛡️ CHÍNH SÁCH BẢO HÀNH:
• Bảo hành 1 đổi 1 trọn thời gian sử dụng nếu có lỗi phát sinh.
• Vui lòng liên hệ Admin nếu cần hỗ trợ kỹ thuật!`;
  };

  const telegramMessage = generatePreviewMessage();

  // Xác nhận hoàn tất giao hàng
  const handleFinalSubmit = async () => {
    setErrorMsg(null);
    setShowConfirmCompleteModal(false);
    try {
      await completeDelivery({
        orderId: order.id,
        source: deliverySource,
        content: deliverySource === 'CUSTOM' ? customContent.trim() : undefined,
        releaseExistingReservations: deliverySource === 'CUSTOM' ? releaseExistingReservations : false,
      }).unwrap();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.data?.error || 'Có lỗi xảy ra khi hoàn tất đơn hàng.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Radio Chọn Nguồn Giao Hàng Cấp Đơn */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Phương Thức Bàn Giao Cho Đơn Hàng:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSourceChange('INVENTORY')}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
              deliverySource === 'INVENTORY'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                deliverySource === 'INVENTORY' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Lấy từ kho (INVENTORY)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Bốc tài khoản có sẵn trong kho hàng</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSourceChange('CUSTOM')}
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
              deliverySource === 'CUSTOM'
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                deliverySource === 'CUSTOM' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Tự nhập (CUSTOM)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tự nhập Email, Link mời hoặc Giftcode</div>
            </div>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Khối Lựa Chọn INVENTORY */}
      {deliverySource === 'INVENTORY' && (
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Danh Sách Mặt Hàng Cần Giao ({order.items.length} món)
            </h4>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                isInventoryFullySelected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {isInventoryFullySelected ? 'Đã chọn đủ tài khoản' : 'Chưa đủ tài khoản'}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => {
              const reserved = item.reservedAccounts || [];
              const isItemFull = reserved.length >= item.quantity;

              return (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{item.productName}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        (Cần: <strong className="text-slate-200">{item.quantity}</strong> acc)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-md font-bold ${
                          isItemFull
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        Đã chọn {reserved.length}/{item.quantity}
                      </span>
                      {!isItemFull && (
                        <button
                          type="button"
                          onClick={() =>
                            setPickerTarget({
                              orderItemId: item.id,
                              productName: item.productName,
                              maxNeeded: item.quantity,
                              currentCount: reserved.length,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1 shadow-md shadow-blue-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Chọn từ kho</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Danh sách các tài khoản đang RESERVED */}
                  {reserved.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {reserved.map((acc) => (
                        <div
                          key={acc.accountId}
                          className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs gap-2"
                        >
                          <div className="flex-1 min-w-0 font-mono text-emerald-300 font-medium truncate">
                            #{acc.accountId} • {acc.accountData.join(' | ')}
                          </div>
                          <button
                            type="button"
                            disabled={isReleasing}
                            onClick={() => handleRelease(item.id, acc.accountId)}
                            className="px-2 py-1 rounded-md text-[11px] font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 shrink-0"
                            title="Bỏ chọn (Hoàn lại kho)"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Bỏ chọn</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Khối Lựa Chọn CUSTOM */}
      {deliverySource === 'CUSTOM' && (
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Nội Dung Bàn Giao (Email | Mật khẩu, Link mời, Giftcode...):
          </label>
          <textarea
            rows={4}
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Ví dụ:
Email: client@gmail.com | Pass: MatKhau123
Hoặc: Link mời nhóm Canva: https://canva.me/invite/..."
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
          <p className="text-[11px] text-slate-400">
            💡 Nội dung này sẽ được lưu cố định vào đơn hàng để phục vụ bảo hành, đối soát. Kho hàng không bị trừ thêm.
          </p>
        </div>
      )}

      {/* Khung Live Preview Tin Nhắn Telegram */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>💬 Mẫu Tin Nhắn Gửi Khách Hàng (Live Preview)</span>
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

        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
          {telegramMessage}
        </div>
      </div>

      {/* Nút Hoàn Tất Giao Hàng */}
      <button
        type="button"
        disabled={
          isCompleting ||
          (deliverySource === 'INVENTORY' && !isInventoryFullySelected) ||
          (deliverySource === 'CUSTOM' && !customContent.trim())
        }
        onClick={() => setShowConfirmCompleteModal(true)}
        className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span>🚀 Xác nhận và Giao hàng</span>
      </button>

      {/* Picker Modal */}
      {pickerTarget && (
        <AvailableAccountPicker
          orderId={order.id}
          orderItemId={pickerTarget.orderItemId}
          productName={pickerTarget.productName}
          maxNeeded={pickerTarget.maxNeeded}
          currentCount={pickerTarget.currentCount}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* Warning Modal Khi Chuyển Sang CUSTOM */}
      {showSwitchWarningModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Xác nhận chuyển sang Tự nhập</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đơn hàng đang giữ <strong>{totalReservedCount}</strong> tài khoản trong kho. Nếu xác nhận giao bằng nội
                dung tự nhập, các tài khoản đang giữ sẽ được hoàn về kho khả dụng khi bạn chốt đơn.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSwitchWarningModal(false)}
                className="py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmSwitchToCustom}
                className="py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-colors"
              >
                Tiếp tục chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal Trước Khi Chốt Đơn */}
      {showConfirmCompleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Xác nhận hoàn tất giao hàng</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Chỉ xác nhận sau khi bạn đã sao chép và gửi nội dung cho khách hàng. Sau khi xác nhận:
                <br />
                {deliverySource === 'INVENTORY'
                  ? '• Các tài khoản đã chọn sẽ chuyển thành SOLD (Đã bán).'
                  : '• Nội dung tự nhập sẽ được lưu lại làm bằng chứng bàn giao.'}
                <br />• Trạng thái đơn hàng sẽ chuyển thành <strong>COMPLETED</strong>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmCompleteModal(false)}
                className="py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                disabled={isCompleting}
                onClick={handleFinalSubmit}
                className="py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-1.5"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang chốt...</span>
                  </>
                ) : (
                  <span>Đồng ý và Chốt</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
