import React from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCheck, Loader2, RefreshCw, Send } from 'lucide-react';
import { OrderDetail } from '../../types';
import { useMarkManuallyDeliveredMutation, useRetryDeliveryMutation } from '../../api/orderApi';

interface DeliveryOutboxStatusProps {
  order: OrderDetail;
}

const STATUS_VIEW: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Đang chờ bot gửi', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  PROCESSING: { label: 'Bot đang gửi', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  SENT: { label: 'Bot đã gửi cho khách', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  SENT_REVIEW_REQUIRED: { label: 'Đã gửi (cần kiểm tra)', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  PARTIAL_SENT_REVIEW_REQUIRED: { label: 'Đã gửi một phần (cần kiểm tra)', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  FAILED: { label: 'Bot gửi thất bại', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  MANUALLY_DELIVERED: { label: 'Admin đã giao tay', className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

/** Trạng thái này che khuất mọi cảnh báo nếu chỉ hiện với đơn COMPLETED — đơn hỏng mới là đơn cần nhìn. */
const VISIBLE_ORDER_STATUSES = ['COMPLETED', 'DELIVERY_FAILED', 'DELIVERY_REVIEW_REQUIRED'];

export const UNCERTAIN_REASON_LABEL: Record<string, string> = {
  SEND_TIMEOUT_OR_5XX: 'lần gửi trước bị timeout hoặc lỗi máy chủ Telegram',
  LOCK_EXPIRED_WHILE_PROCESSING: 'tiến trình gửi bị chết giữa chừng, không ghi lại được kết quả',
};

/** Trạng thái gửi Telegram (Delivery Outbox), kèm nút Gửi lại và cảnh báo khách có thể đã nhận tài khoản. */
export const DeliveryOutboxStatus: React.FC<DeliveryOutboxStatusProps> = ({ order }) => {
  const [retryDelivery, { isLoading: isRetrying }] = useRetryDeliveryMutation();
  const [markManuallyDelivered, { isLoading: isMarking }] = useMarkManuallyDeliveredMutation();
  const isLoading = isRetrying || isMarking;

  if (!VISIBLE_ORDER_STATUSES.includes(order.status)) return null;

  const view = order.deliveryOutboxStatus ? STATUS_VIEW[order.deliveryOutboxStatus] : undefined;
  // Đơn thủ công đã chốt nhưng bot gửi lỗi: Admin tự nhắn hàng cho khách thì phải đóng lại, nếu không đơn vẫn hoàn tiền được
  const canMarkDeliveredOutsideBot =
    order.deliveryMode === 'MANUAL' && order.status === 'COMPLETED' && order.deliveryOutboxStatus === 'FAILED';

  const handleMarkDeliveredOutsideBot = async () => {
    if (
      !window.confirm(
        'Xác nhận bạn ĐÃ tự gửi hàng cho khách (ngoài bot)? Sau khi đánh dấu, đơn này sẽ KHÔNG thể hoàn tiền hoặc gửi lại.'
      )
    )
      return;
    try {
      await markManuallyDelivered({ orderId: order.id, note: 'Đã gửi hàng cho khách qua chat riêng' }).unwrap();
      toast.success('Đã đánh dấu giao hàng ngoài bot.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể đánh dấu đã giao ngoài bot.');
    }
  };

  const handleRetry = async () => {
    try {
      await retryDelivery(order.id).unwrap();
      toast.success('Đã đưa nội dung bàn giao vào hàng đợi gửi lại.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể gửi lại cho khách.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate-400 flex items-center gap-1">
        <Send className="w-3.5 h-3.5" /> Gửi qua bot:
      </span>
      {view ? (
        <span className={`px-2 py-0.5 rounded-md border font-semibold ${view.className}`}>{view.label}</span>
      ) : (
        <span className="px-2 py-0.5 rounded-md border font-semibold bg-slate-500/15 text-slate-400 border-slate-500/30">
          Không gửi qua bot
        </span>
      )}
      {order.deliveryOutboxStatus === 'FAILED' && (
        <button
          type="button"
          disabled={isLoading}
          onClick={handleRetry}
          className="px-2 py-0.5 rounded-md border font-semibold bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600 hover:text-white disabled:opacity-50 flex items-center gap-1"
        >
          {isRetrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Gửi lại
        </button>
      )}
      {canMarkDeliveredOutsideBot && (
        <button
          type="button"
          disabled={isLoading}
          onClick={handleMarkDeliveredOutsideBot}
          className="px-2 py-0.5 rounded-md border font-semibold bg-slate-600/20 text-slate-300 border-slate-500/30 hover:bg-slate-600 hover:text-white disabled:opacity-50 flex items-center gap-1"
        >
          {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
          Đã giao ngoài bot
        </button>
      )}
      {order.deliveryOutboxStatus === 'FAILED' && order.deliveryOutboxError && (
        <span className="w-full text-[11px] text-rose-300/80 font-mono break-all">{order.deliveryOutboxError}</span>
      )}
      {order.deliveryUncertain && <DeliveryUncertainWarning order={order} />}
    </div>
  );
};

/** Cảnh báo phải hiện TRƯỚC khi Admin bấm hoàn tiền, không phải sau khi backend từ chối. */
export const DeliveryUncertainWarning: React.FC<{ order: OrderDetail }> = ({ order }) => {
  const reason = order.deliveryUncertainReason
    ? UNCERTAIN_REASON_LABEL[order.deliveryUncertainReason] ?? order.deliveryUncertainReason
    : 'không xác định được kết quả lần gửi trước';
  const at = order.deliveryUncertainAt ? new Date(order.deliveryUncertainAt).toLocaleString('vi-VN') : null;

  return (
    <div className="w-full mt-1 p-2 rounded-md border border-rose-500/40 bg-rose-500/10 text-[11px] text-rose-200 flex gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold">Khách CÓ THỂ đã nhận tài khoản — {reason}{at ? ` (${at})` : ''}.</p>
        <p>
          Hãy kiểm tra chat với khách rồi <b>Gửi lại</b> hoặc <b>Đánh dấu đã giao tay</b>. Hoàn tiền sẽ bị chặn cho
          đến khi bạn xác nhận chấp nhận rủi ro: tài khoản đã gửi đi thì <b>không thu hồi được</b>, cách ly chỉ ngăn
          bán lại cho khách khác.
        </p>
      </div>
    </div>
  );
};
