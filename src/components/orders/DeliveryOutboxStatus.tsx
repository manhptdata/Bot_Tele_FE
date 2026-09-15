import React from 'react';
import toast from 'react-hot-toast';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { OrderDetail } from '../../types';
import { useRetryDeliveryMutation } from '../../api/orderApi';

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

/** Trạng thái gửi Telegram (Delivery Outbox) của đơn đã hoàn tất, kèm nút Gửi lại khi thất bại. */
export const DeliveryOutboxStatus: React.FC<DeliveryOutboxStatusProps> = ({ order }) => {
  const [retryDelivery, { isLoading }] = useRetryDeliveryMutation();

  if (order.status !== 'COMPLETED') return null;

  const view = order.deliveryOutboxStatus ? STATUS_VIEW[order.deliveryOutboxStatus] : undefined;

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
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Gửi lại
        </button>
      )}
      {order.deliveryOutboxStatus === 'FAILED' && order.deliveryOutboxError && (
        <span className="w-full text-[11px] text-rose-300/80 font-mono break-all">{order.deliveryOutboxError}</span>
      )}
    </div>
  );
};
