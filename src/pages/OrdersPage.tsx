import {
  useGetOrdersQuery,
  useConfirmOrderMutation,
  useGetOrderByIdQuery,
  useRetryDeliveryMutation,
  useCompleteManualDeliveryMutation,
  useMarkManuallyDeliveredMutation,
  useRefundOrderMutation,
} from '../api/orderApi';
import {
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Eye,
  X,
  Package,
  User,
  Wallet,
  RotateCcw,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Send,
  MessageSquare,
  Truck,
  RefreshCw,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Pagination } from '../components/ui/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { ManualDeliveryPanel } from '../components/orders/ManualDeliveryPanel';
import { FailedAutoDeliveryPanel } from '../components/orders/FailedAutoDeliveryPanel';

interface OrderStatusConfig {
  label: string;
  style: string;
  icon: LucideIcon;
}

const ORDER_STATUS_CONFIG: Record<string, OrderStatusConfig> = {
  COMPLETED: { label: 'Đã hoàn thành', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  PENDING: { label: 'Chờ thanh toán', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  PAID: { label: 'Đã thanh toán', style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: CheckCircle },
  DELIVERY_PENDING: { label: 'Đang xử lý giao', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Clock },
  PAID_MANUAL_PENDING: { label: 'Chờ giao tay', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Clock },
  PAID_REVIEW_REQUIRED: { label: 'Cần kiểm tra TT', style: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  DELIVERY_FAILED: { label: 'Giao thất bại', style: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertTriangle },
  DELIVERY_REVIEW_REQUIRED: { label: 'Cần kiểm tra giao hàng', style: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  CANCELLED_UNDERPAID: { label: 'Thiếu tiền (Đã hoàn ví)', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle },
  CANCELLED: { label: 'Đã hủy', style: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle },
  REFUNDED: { label: 'Đã hoàn tiền', style: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: RefreshCw },
  EXPIRED: { label: 'Hết hạn', style: 'bg-rose-950/40 text-rose-400 border-rose-800/40', icon: Clock },
};

const renderOrderStatusBadge = (status: string) => {
  const cfg = ORDER_STATUS_CONFIG[status] || {
    label: status,
    style: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: Clock,
  };
  const IconComponent = cfg.icon;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 border ${cfg.style}`}>
      <IconComponent size={11} />
      <span>{cfg.label}</span>
    </span>
  );
};

export const OrdersPage = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: pageResponse, isLoading } = useGetOrdersQuery({
    page,
    size: 10,
    keyword: debouncedSearchTerm || undefined,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
  });

  const orders = pageResponse?.content || [];
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();
  const [retryDelivery, { isLoading: isRetrying }] = useRetryDeliveryMutation();
  const [completeManualDelivery, { isLoading: isCompletingManual }] = useCompleteManualDeliveryMutation();
  const [markManuallyDelivered, { isLoading: isMarkingDelivered }] = useMarkManuallyDeliveredMutation();
  const [refundOrder, { isLoading: isRefunding }] = useRefundOrderMutation();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [refundTargetOrder, setRefundTargetOrder] = useState<{ id: number; orderCode: string; totalAmount: number; customerName: string } | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // State cho Modal Giao Hàng Thủ Công
  const [manualDeliveryTarget, setManualDeliveryTarget] = useState<{
    id: number;
    orderCode: string;
    customerName: string;
    customerUsername?: string;
    totalAmount: number;
    deliveryMode: 'AUTO' | 'MANUAL';
  } | null>(null);
  const [manualDeliveryNote, setManualDeliveryNote] = useState('');
  // State cho hiệu ứng Copy
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(successMsg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const { data: orderDetail, isLoading: isDetailLoading } = useGetOrderByIdQuery(selectedOrderId as number, {
    skip: selectedOrderId === null,
  });

  const handleConfirm = async (orderCode: string) => {
    if (window.confirm(`Xác nhận đã nhận tiền cho đơn hàng ${orderCode}? Hệ thống sẽ tự động giao hàng (nếu là AUTO).`)) {
      try {
        await confirmOrder(orderCode).unwrap();
        toast.success('Xác nhận thành công!');
      } catch (err) {
        toast.error('Lỗi khi xác nhận đơn hàng');
      }
    }
  };

  const handleRetryDelivery = async (orderId: number) => {
    if (!window.confirm('Gửi lại thông tin tài khoản cho khách hàng?')) return;
    try {
      await retryDelivery(orderId).unwrap();
      toast.success('Đã đưa đơn hàng vào hàng đợi giao lại.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể giao lại đơn hàng.');
    }
  };

  const handleManualDeliverySubmit = async () => {
    if (!manualDeliveryTarget) return;
    try {
      if (manualDeliveryTarget.deliveryMode === 'MANUAL') {
        const content = manualDeliveryNote.trim() || 'Đã bàn giao tài khoản qua chat Telegram';
        await completeManualDelivery({
          orderId: manualDeliveryTarget.id,
          source: 'CUSTOM',
          content: content,
          releaseExistingReservations: true,
        }).unwrap();
      } else {
        await markManuallyDelivered({
          orderId: manualDeliveryTarget.id,
          note: manualDeliveryNote.trim() || 'Đã giao thủ công bởi Admin',
        }).unwrap();
      }
      toast.success('Đã đánh dấu đơn hàng hoàn thành!');
      setManualDeliveryTarget(null);
      setManualDeliveryNote('');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || 'Không thể đánh dấu đã giao.');
    }
  };

  const handleRefundSubmit = async () => {
    if (!refundTargetOrder) return;
    try {
      const res = await refundOrder({ id: refundTargetOrder.id, reason: refundReason.trim() || undefined }).unwrap();
      toast.success(res.message || 'Đã hoàn tiền vào ví khách hàng thành công!');
      setRefundTargetOrder(null);
      setRefundReason('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi hoàn tiền đơn hàng.');
    }
  };

  // Tạo mẫu tin nhắn Telegram trả hàng cho khách hoàn chỉnh nhất
  const generateTelegramDeliveryMessage = () => {
    if (!orderDetail) return '';
    const itemsText = orderDetail.items?.map((i) => `• *${i.productName}* (x${i.quantity})`).join('\n') || '';

    let accountsBlock = '';
    if (orderDetail.deliveryMode === 'AUTO') {
      const accs = orderDetail.items?.flatMap((i) => i.deliveredAccounts || []) || [];
      if (accs.length > 0) {
        accountsBlock = accs.map((a, idx) => `👉 Acc #${idx + 1}: ${a.join(' | ')}`).join('\n');
      }
    }

    const payload = orderDetail.manualDeliveryContent || accountsBlock || orderDetail.adminNote || '[Chưa nhập tài khoản]';

    return `🎉 CẢM ƠN BẠN ĐÃ MUA HÀNG TẠI SHOP!
──────────────────────────
📦 Mã đơn hàng: #${orderDetail.orderCode}
👤 Khách hàng: ${orderDetail.customer?.firstName || 'Khách'} ${orderDetail.customer?.username ? `(@${orderDetail.customer.username})` : ''}
🛒 Mặt hàng:
${itemsText}
💰 Đã thanh toán: ${orderDetail.totalAmount?.toLocaleString()}đ
⏰ Thời gian: ${new Date(orderDetail.createdAt).toLocaleString('vi-VN')}

🔑 THÔNG TIN TÀI KHOẢN / BÀN GIAO:
${payload}

🛡️ Bảo hành: Hỗ trợ 1 đổi 1 trong suốt thời gian sử dụng
📞 Cần hỗ trợ xin nhắn tin trực tiếp cho Admin!`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Đơn hàng</h1>
        <p className="text-gray-400 mt-1">Theo dõi giao dịch, duyệt đơn và bàn giao tài khoản cho khách</p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tabs Trạng thái */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => {
              setSelectedStatus('ALL');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setSelectedStatus('COMPLETED');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <CheckCircle size={13} />
            Đã hoàn thành
          </button>
          <button
            onClick={() => {
              setSelectedStatus('PAID_MANUAL_PENDING');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatus === 'PAID_MANUAL_PENDING'
                ? 'bg-purple-600 text-white shadow'
                : 'text-purple-400 hover:bg-slate-800'
            }`}
          >
            <Clock size={13} />
            Chờ giao thủ công
          </button>
          <button
            onClick={() => {
              setSelectedStatus('PENDING');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Clock size={13} />
            Chờ thanh toán
          </button>
          <button
            onClick={() => {
              setSelectedStatus('DELIVERY_FAILED');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatus === 'DELIVERY_FAILED'
                ? 'bg-rose-600 text-white shadow'
                : 'text-rose-400 hover:bg-slate-800'
            }`}
          >
            <XCircle size={13} />
            Giao lỗi
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Mã đơn / Tên khách..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Thanh toán</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày tạo</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <ShoppingCart size={48} className="mb-2 opacity-20" />
                      <p>Chưa có đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono font-medium text-white">
                        <span>{order.orderCode}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(order.orderCode, `TABLE_ORD_${order.id}`, 'Đã chép mã đơn');
                          }}
                          className="text-slate-500 hover:text-blue-400 p-0.5"
                          title="Sao chép mã đơn"
                        >
                          {copiedKey === `TABLE_ORD_${order.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-blue-300 font-medium">{order.customer.firstName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        {order.customer.username ? (
                          <a
                            href={`https://t.me/${order.customer.username}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:underline flex items-center gap-0.5"
                          >
                            @{order.customer.username}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="italic text-slate-500">ID: {order.customer.telegramId}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-400 font-bold font-mono">{order.totalAmount.toLocaleString()}đ</div>
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <div className="text-[11px] text-amber-400 font-mono flex items-center gap-0.5">
                          <Ticket size={10} /> -{order.discountAmount.toLocaleString()}đ ({order.voucherCode || 'Mã'})
                        </div>
                      ) : null}
                      {order.feeAmount && order.feeAmount > 0 ? (
                        <div className="text-[11px] text-slate-400">
                          (+{order.feeAmount.toLocaleString()}đ phí)
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      <span>{order.paymentMethod === 'BANK_TRANSFER' ? '🏦 Ngân hàng' : '💳 Ví Bot'}</span>
                    </td>
                    <td className="p-4">
                      {renderOrderStatusBadge(order.status)}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        {order.status === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirm(order.orderCode);
                            }}
                            disabled={isConfirming}
                            className="btn bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-2.5 py-1 text-xs disabled:opacity-50 font-semibold"
                          >
                            Duyệt đơn
                          </button>
                        )}
                        {order.status === 'DELIVERY_FAILED' && order.deliveryMode === 'AUTO' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryDelivery(order.id);
                            }}
                            disabled={isRetrying || isMarkingDelivered}
                            className="btn bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600 hover:text-white px-2.5 py-1 text-xs disabled:opacity-50 font-semibold"
                          >
                            Giao lại
                          </button>
                        )}
                        {((order.status === 'DELIVERY_FAILED' && order.deliveryMode === 'AUTO') ||
                          (order.status === 'PAID_MANUAL_PENDING' && order.deliveryMode === 'MANUAL')) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualDeliveryTarget({
                                id: order.id,
                                orderCode: order.orderCode,
                                customerName: order.customer.firstName,
                                customerUsername: order.customer.username,
                                totalAmount: order.totalAmount,
                                deliveryMode: order.deliveryMode,
                              });
                              setManualDeliveryNote('Đã bàn giao tài khoản qua chat Telegram');
                            }}
                            disabled={isRetrying || isMarkingDelivered || isCompletingManual || isRefunding}
                            className="btn bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white px-2.5 py-1 text-xs disabled:opacity-50 font-semibold flex items-center gap-1"
                          >
                            <Truck size={12} />
                            Đã giao
                          </button>
                        )}
                        {['PAID_MANUAL_PENDING', 'PAID_REVIEW_REQUIRED', 'DELIVERY_FAILED', 'DELIVERY_REVIEW_REQUIRED'].includes(order.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRefundTargetOrder({
                                id: order.id,
                                orderCode: order.orderCode,
                                totalAmount: order.totalAmount,
                                customerName: order.customer.firstName,
                              });
                              setRefundReason('');
                            }}
                            disabled={isRefunding}
                            className="btn bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600 hover:text-white px-2.5 py-1 text-xs disabled:opacity-50"
                            title="Hoàn tiền vào ví khách hàng"
                          >
                            Hoàn tiền
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pageResponse && (
          <Pagination
            currentPage={pageResponse.pageNumber}
            totalPages={pageResponse.totalPages}
            totalElements={pageResponse.totalElements}
            pageSize={pageResponse.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal Chi Tiết Đơn Hàng Hoàn Chỉnh */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white font-mono">
                      #{orderDetail?.orderCode}
                    </h2>
                    {orderDetail && (
                      <button
                        onClick={() => handleCopyText(orderDetail.orderCode, 'MODAL_ORD', 'Đã chép mã đơn')}
                        className="text-slate-400 hover:text-blue-400 p-0.5"
                        title="Sao chép mã đơn"
                      >
                        {copiedKey === 'MODAL_ORD' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {orderDetail ? new Date(orderDetail.createdAt).toLocaleString('vi-VN') : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {orderDetail && (
                  <button
                    onClick={() => handleCopyText(generateTelegramDeliveryMessage(), 'GEN_MSG', 'Đã sao chép toàn bộ tin nhắn giao hàng!')}
                    className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30"
                    title="Sao chép tin nhắn đầy đủ để dán thẳng vào Telegram gửi khách"
                  >
                    {copiedKey === 'GEN_MSG' ? <Check size={14} /> : <Send size={14} />}
                    <span>Sao chép tin nhắn gửi khách</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {isDetailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : orderDetail ? (
                <>
                  {/* ⚠️ CẢNH BÁO THANH TOÁN THIẾU & TỰ ĐỘNG HOÀN VÍ */}
                  {orderDetail.status === 'CANCELLED_UNDERPAID' && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 shadow-lg shadow-amber-950/30">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1.5">
                        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                        <span>Đơn hàng đã hủy do thanh toán thiếu tiền</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {orderDetail.adminNote || `Khách hàng thanh toán chưa đủ tổng tiền đơn hàng (${orderDetail.totalAmount?.toLocaleString()}đ). Hệ thống đã tự động hoàn toàn bộ số tiền khách vừa chuyển vào Số dư ví của khách trên Bot.`}
                      </p>
                    </div>
                  )}

                  {/* Thông tin Khách Hàng & Thanh Toán */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Khách hàng */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><User size={15} /> Khách Hàng</span>
                        {orderDetail.customer?.username ? (
                          <a
                            href={`https://t.me/${orderDetail.customer.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-bold hover:underline bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                          >
                            <MessageSquare size={12} /> Chat @{orderDetail.customer.username}
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Khách ẩn danh</span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Tên khách:</span>
                          <span className="text-white font-medium">{orderDetail.customer?.firstName || 'Ẩn danh'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Username:</span>
                          <div className="flex items-center gap-1">
                            {orderDetail.customer?.username ? (
                              <span className="text-blue-400 font-mono">@{orderDetail.customer.username}</span>
                            ) : (
                              <span className="text-slate-500 italic">Chưa có</span>
                            )}
                            {orderDetail.customer?.username && (
                              <button
                                onClick={() => handleCopyText(`@${orderDetail.customer.username}`, 'MODAL_USER', 'Đã chép username')}
                                className="text-slate-500 hover:text-blue-400 p-0.5"
                              >
                                {copiedKey === 'MODAL_USER' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Telegram ID:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-xs">
                              {orderDetail.customer?.telegramId}
                            </span>
                            <button
                              onClick={() => handleCopyText(String(orderDetail.customer?.telegramId), 'MODAL_TGID', 'Đã chép Telegram ID')}
                              className="text-slate-500 hover:text-blue-400 p-0.5"
                            >
                              {copiedKey === 'MODAL_TGID' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thanh toán */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Wallet size={15} /> Thanh Toán</span>
                        {renderOrderStatusBadge(orderDetail.status)}
                      </div>
                      <div className="space-y-2 text-sm">
                        {orderDetail.subtotalAmount && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Tiền hàng:</span>
                            <span className="text-slate-200 font-mono">{orderDetail.subtotalAmount.toLocaleString()}đ</span>
                          </div>
                        )}
                        {orderDetail.discountAmount && orderDetail.discountAmount > 0 ? (
                          <div className="flex justify-between items-center text-xs text-amber-400">
                            <span className="flex items-center gap-1">
                              <Ticket size={12} /> Voucher ({orderDetail.voucherCode || 'Mã giảm giá'}):
                            </span>
                            <span className="font-bold font-mono">-{orderDetail.discountAmount.toLocaleString()}đ</span>
                          </div>
                        ) : null}
                        {orderDetail.feeAmount && orderDetail.feeAmount > 0 ? (
                          <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Phí giao dịch:</span>
                            <span className="font-mono">+{orderDetail.feeAmount.toLocaleString()}đ</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between items-center pt-1 border-t border-slate-700/40">
                          <span className="text-slate-300 font-medium">Tổng thanh toán:</span>
                          <span className="text-emerald-400 font-bold font-mono text-base">{orderDetail.totalAmount?.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-400">Phương thức:</span>
                          <span className="text-white font-medium">{orderDetail.paymentMethod === 'BANK_TRANSFER' ? '🏦 Chuyển khoản SePay' : '💳 Ví Bot'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Hình thức giao:</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            orderDetail.deliveryMode === 'AUTO' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-purple-500/15 text-purple-300'
                          }`}>
                            {orderDetail.deliveryMode === 'AUTO' ? '⚡ Tự động (Kho)' : '👤 Thủ công (Admin)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🚀 XỬ LÝ GIAO HÀNG THỦ CÔNG HOẶC XỬ LÝ LỖI GIAO HÀNG */}
                  {orderDetail.deliveryMode === 'MANUAL' && orderDetail.status === 'PAID_MANUAL_PENDING' ? (
                    <ManualDeliveryPanel order={orderDetail} />
                  ) : orderDetail.deliveryMode === 'AUTO' && orderDetail.status === 'DELIVERY_FAILED' ? (
                    <FailedAutoDeliveryPanel order={orderDetail} />
                  ) : (
                    <>
                      {/* THÔNG TIN BÀN GIAO ĐÃ HOÀN TẤT */}
                      {orderDetail.status === 'COMPLETED' && (
                        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle size={15} /> Đơn hàng đã bàn giao thành công
                            </span>
                            <span className="text-slate-400">
                              Nguồn giao:{' '}
                              <strong className="text-emerald-300 font-mono">
                                {orderDetail.deliverySource === 'CUSTOM' ? 'Tự nhập (CUSTOM)' : 'Kho hàng (INVENTORY)'}
                              </strong>
                            </span>
                          </div>

                          {orderDetail.manualDeliveryContent && (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap select-all">
                              {orderDetail.manualDeliveryContent}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                            <span>
                              Xử lý bởi: <strong className="text-slate-300">{orderDetail.manuallyDeliveredBy || 'Hệ thống tự động'}</strong>
                            </span>
                            {orderDetail.manuallyDeliveredAt && (
                              <span>Thời gian: {new Date(orderDetail.manuallyDeliveredAt).toLocaleString('vi-VN')}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mặt Hàng Đã Mua & Tài Khoản Đã Xuất */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Package size={16} className="text-blue-400" /> Mặt Hàng Đã Mua
                        </h3>

                        <div className="space-y-3">
                          {orderDetail.items?.map((item) => (
                            <div key={item.id} className="bg-slate-800/50 rounded-xl border border-slate-700/80 overflow-hidden">
                              <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/80 flex justify-between items-center">
                                <div>
                                   <div className="font-bold text-white text-sm">{item.productName}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    Số lượng: <span className="text-white font-semibold">{item.quantity}</span> x {item.unitPrice?.toLocaleString()}đ
                                  </div>
                                </div>
                                <div className="text-emerald-400 font-bold font-mono text-base">
                                  {item.subtotal?.toLocaleString()}đ
                                </div>
                              </div>

                              {/* Tài khoản chi tiết nếu có */}
                              {item.deliveredAccounts && item.deliveredAccounts.length > 0 ? (
                                <div className="p-3.5 space-y-2">
                                  <p className="text-xs font-semibold text-slate-300">Tài khoản đã xuất kho:</p>
                                  {item.deliveredAccounts.map((accInfo, idx) => (
                                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs flex justify-between items-center">
                                      <span className="text-emerald-300 font-medium break-all">{accInfo.join(' | ')}</span>
                                      <button
                                        onClick={() => handleCopyText(accInfo.join(' | '), `ACC_${idx}`, 'Đã chép tài khoản')}
                                        className="text-slate-400 hover:text-blue-400 ml-2 p-1"
                                        title="Sao chép tài khoản"
                                      >
                                        {copiedKey === `ACC_${idx}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 text-slate-500 text-xs italic text-center">
                                  {orderDetail.deliveryMode === 'MANUAL'
                                    ? 'Đơn hàng giao thủ công.'
                                    : orderDetail.status === 'PENDING'
                                    ? 'Chưa xuất kho (chờ thanh toán).'
                                    : 'Không có tài khoản tự động xuất kho.'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-400 py-8">Không tìm thấy thông tin đơn hàng</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Giao Hàng Thủ Công */}
      {manualDeliveryTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-purple-950/30">
              <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                <Truck size={18} />
                Xác nhận Giao Hàng Thủ Công
              </h3>
              <button
                onClick={() => setManualDeliveryTarget(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã đơn:</span>
                  <span className="text-white font-mono font-bold">{manualDeliveryTarget.orderCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Khách hàng:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-300 font-semibold">{manualDeliveryTarget.customerName}</span>
                    {manualDeliveryTarget.customerUsername && (
                      <a
                        href={`https://t.me/${manualDeliveryTarget.customerUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        @{manualDeliveryTarget.customerUsername} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tổng tiền:</span>
                  <span className="text-emerald-400 font-mono font-bold">{manualDeliveryTarget.totalAmount?.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hình thức:</span>
                  <span className="text-purple-300 font-semibold">
                    {manualDeliveryTarget.deliveryMode === 'MANUAL' ? 'Giao thủ công (Tự nhập)' : 'Giao tự động (Xử lý ngoài bot)'}
                  </span>
                </div>
              </div>

              {manualDeliveryTarget.deliveryMode === 'MANUAL' && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl text-xs text-blue-300 flex items-center justify-between">
                  <span>💡 Muốn bốc tài khoản có sẵn trong kho?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const id = manualDeliveryTarget.id;
                      setManualDeliveryTarget(null);
                      setSelectedOrderId(id);
                    }}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Mở chi tiết đơn <ExternalLink size={12} />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ghi chú / Thông tin tài khoản bàn giao (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={manualDeliveryNote}
                  onChange={(e) => setManualDeliveryNote(e.target.value)}
                  placeholder="Ví dụ: Email: abc@gmail.com | Pass: 123456 (hoặc ghi chú bảo hành...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ghi chú này sẽ được lưu lại trong đơn hàng để bạn dễ dàng tra cứu và đối soát bảo hành sau này.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualDeliveryTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleManualDeliverySubmit}
                  disabled={isMarkingDelivered || isCompletingManual}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} />
                  Hoàn Tất Giao Hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Hoàn Tiền */}
      {refundTargetOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
                <RotateCcw size={20} />
                Xác nhận hoàn tiền đơn hàng
              </h3>
              <button onClick={() => setRefundTargetOrder(null)} className="text-gray-400 hover:text-white p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-950/40 border border-red-800/50 p-3 rounded-xl text-sm text-red-300 flex items-start gap-2.5">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div>
                  Hành động này sẽ hoàn <b className="text-white">{refundTargetOrder.totalAmount.toLocaleString()}đ</b> vào <b>Ví Bot</b> của khách hàng <b className="text-white">{refundTargetOrder.customerName}</b> và gửi tin nhắn Telegram thông báo ngay lập tức.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mã đơn hàng
                </label>
                <div className="font-mono text-white font-semibold bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                  {refundTargetOrder.orderCode}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Lý do hoàn tiền (Tùy chọn)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ví dụ: Tài khoản bị lỗi, Khách đổi ý, Hết hàng thủ công..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTargetOrder(null)}
                  className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 text-sm rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleRefundSubmit}
                  disabled={isRefunding}
                  className="btn bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-lg disabled:opacity-50"
                >
                  {isRefunding ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
