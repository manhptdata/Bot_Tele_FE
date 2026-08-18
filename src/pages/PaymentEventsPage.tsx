import { useState } from 'react';
import {
  useGetPaymentEventsQuery,
  useCreditWalletFromEventMutation,
  useLinkOrderFromEventMutation,
  PaymentWebhookEvent,
} from '../api/paymentEventApi';
import {
  Receipt,
  Search,
  Wallet,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  X,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentEventsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: events = [], isLoading } = useGetPaymentEventsQuery(
    statusFilter === 'ALL' ? undefined : { status: statusFilter }
  );

  const [creditWallet, { isLoading: isCrediting }] = useCreditWalletFromEventMutation();
  const [linkOrder, { isLoading: isLinking }] = useLinkOrderFromEventMutation();

  // State Modal Cộng Ví
  const [creditTarget, setCreditTarget] = useState<PaymentWebhookEvent | null>(null);
  const [telegramIdInput, setTelegramIdInput] = useState<string>('');
  const [creditNoteInput, setCreditNoteInput] = useState<string>('');

  // State Modal Ghép Đơn
  const [linkTarget, setLinkTarget] = useState<PaymentWebhookEvent | null>(null);
  const [orderCodeInput, setOrderCodeInput] = useState<string>('');
  const [linkNoteInput, setLinkNoteInput] = useState<string>('');

  // State Sao Chép
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = events.filter((ev) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      ev.providerTransactionId?.toLowerCase().includes(term) ||
      ev.referenceCode?.toLowerCase().includes(term) ||
      ev.rawContent?.toLowerCase().includes(term) ||
      ev.resolutionNote?.toLowerCase().includes(term) ||
      ev.amount?.toString().includes(term)
    );
  });

  const handleCreditWalletSubmit = async () => {
    if (!creditTarget) return;
    const tid = Number(telegramIdInput.trim());
    if (!tid || isNaN(tid)) {
      toast.error('Vui lòng nhập Telegram ID hợp lệ (chữ số)');
      return;
    }

    try {
      await creditWallet({
        id: creditTarget.id,
        telegramId: tid,
        note: creditNoteInput.trim() || undefined,
      }).unwrap();
      toast.success(`Đã cộng ${creditTarget.amount.toLocaleString()}đ vào ví của Telegram ID ${tid} thành công!`);
      setCreditTarget(null);
      setTelegramIdInput('');
      setCreditNoteInput('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi cộng tiền ví.');
    }
  };

  const handleLinkOrderSubmit = async () => {
    if (!linkTarget) return;
    const ocode = orderCodeInput.trim();
    if (!ocode) {
      toast.error('Vui lòng nhập Mã đơn hàng (ví dụ: ORD_12345678)');
      return;
    }

    try {
      await linkOrder({
        id: linkTarget.id,
        orderCode: ocode,
        note: linkNoteInput.trim() || undefined,
      }).unwrap();
      toast.success(`Đã ghép giao dịch vào đơn hàng ${ocode} thành công!`);
      setLinkTarget(null);
      setOrderCodeInput('');
      setLinkNoteInput('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi ghép đơn hàng.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Receipt className="text-blue-500" />
          Giao Dịch Webhook & Xử Lý Treo Tiền
        </h1>
        <p className="text-gray-400 mt-1">
          Theo dõi toàn bộ biến động tiền từ SePay/Ngân hàng và xử lý 1-chạm khi khách nạp sai cú pháp hoặc quên mã đơn.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tabs Trạng thái */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({events.length})
          </button>
          <button
            onClick={() => setStatusFilter('UNRESOLVED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'UNRESOLVED'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertCircle size={13} />
            Chờ xử lý ({events.filter((e) => e.status === 'UNRESOLVED').length})
          </button>
          <button
            onClick={() => setStatusFilter('MANUALLY_RESOLVED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'MANUALLY_RESOLVED'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle size={13} />
            Đã xử lý thủ công ({events.filter((e) => e.status === 'MANUALLY_RESOLVED').length})
          </button>
          <button
            onClick={() => setStatusFilter('AUTO_RESOLVED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'AUTO_RESOLVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle size={13} />
            Tự động thành công
          </button>
        </div>

        {/* Search box */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã GD, số tiền, nội dung..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bảng danh sách Webhook Events */}
      <div className="glass rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Mã GD SePay</th>
                <th className="p-4">Cổng & Thời gian</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4">Nội dung chuyển khoản</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ghi chú xử lý</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Đang tải danh sách giao dịch...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Receipt size={40} className="mb-2 opacity-20 text-slate-400" />
                      <p>Không tìm thấy giao dịch webhook nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{ev.providerTransactionId}</span>
                        <button
                          onClick={() => handleCopy(ev.providerTransactionId, `tx-${ev.id}`)}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                          title="Sao chép"
                        >
                          {copiedId === `tx-${ev.id}` ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      <div className="font-medium text-slate-200">{ev.provider}</div>
                      <div className="text-slate-500 mt-0.5">{new Date(ev.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-400 font-bold font-mono">
                        +{ev.amount.toLocaleString()}đ
                      </div>
                    </td>
                    <td className="p-4 text-xs max-w-xs">
                      <div className="bg-slate-950/70 p-2 rounded border border-slate-800 font-mono text-slate-300 break-words whitespace-pre-wrap">
                        {ev.rawContent || ev.referenceCode || 'Không có nội dung'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          ev.status === 'UNRESOLVED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : ev.status === 'MANUALLY_RESOLVED'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {ev.status === 'UNRESOLVED' ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                        {ev.status === 'UNRESOLVED'
                          ? 'Treo / Chờ xử lý'
                          : ev.status === 'MANUALLY_RESOLVED'
                          ? 'Đã duyệt tay'
                          : 'Tự động'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 max-w-xs">
                      {ev.resolutionNote ? (
                        <div className="text-slate-300">{ev.resolutionNote}</div>
                      ) : (
                        <span className="text-slate-600 italic">Chưa có</span>
                      )}
                      {ev.resolvedBy && (
                        <div className="text-[11px] text-slate-500 mt-0.5">Bởi: {ev.resolvedBy}</div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ev.status === 'UNRESOLVED' ? (
                          <>
                            <button
                              onClick={() => {
                                setCreditTarget(ev);
                                setTelegramIdInput('');
                                setCreditNoteInput(`Cộng tiền từ giao dịch SePay #${ev.providerTransactionId}`);
                              }}
                              className="btn bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-2.5 py-1 text-xs flex items-center gap-1 shadow-sm"
                              title="Cộng tiền trực tiếp vào Ví Bot của khách"
                            >
                              <Wallet size={13} />
                              Cộng Ví
                            </button>
                            <button
                              onClick={() => {
                                setLinkTarget(ev);
                                setOrderCodeInput('');
                                setLinkNoteInput(`Ghép đơn thủ công từ SePay #${ev.providerTransactionId}`);
                              }}
                              className="btn bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-2.5 py-1 text-xs flex items-center gap-1 shadow-sm"
                              title="Ghép tiền vào đơn hàng bị thiếu mã"
                            >
                              <LinkIcon size={13} />
                              Ghép Đơn
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Đã hoàn tất</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Cộng Tiền Vào Ví Khách */}
      {creditTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 text-blue-400">
                <Wallet size={20} />
                Cộng tiền ví từ giao dịch SePay
              </h3>
              <button onClick={() => setCreditTarget(null)} className="text-gray-400 hover:text-white p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-950/40 border border-blue-800/50 p-3 rounded-xl text-sm text-blue-300">
                Số tiền: <b className="text-white text-base">+{creditTarget.amount.toLocaleString()}đ</b>
                <div className="text-xs text-slate-400 mt-1">
                  Mã giao dịch SePay: <span className="font-mono text-slate-200">{creditTarget.providerTransactionId}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Telegram ID của Khách hàng (*)
                </label>
                <input
                  type="number"
                  value={telegramIdInput}
                  onChange={(e) => setTelegramIdInput(e.target.value)}
                  placeholder="Ví dụ: 8621276989"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Khách hàng có thể lấy Telegram ID bằng cách gõ lệnh /wallet trên Bot.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ghi chú xử lý (Tùy chọn)
                </label>
                <textarea
                  value={creditNoteInput}
                  onChange={(e) => setCreditNoteInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setCreditTarget(null)}
                  className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCreditWalletSubmit}
                  disabled={isCrediting}
                  className="btn bg-blue-600 text-white hover:bg-blue-500 px-5 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isCrediting ? 'Đang cộng ví...' : 'Xác nhận cộng ví'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Ghép Giao Dịch Vào Đơn Hàng */}
      {linkTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 text-emerald-400">
                <LinkIcon size={20} />
                Ghép giao dịch vào Đơn hàng
              </h3>
              <button onClick={() => setLinkTarget(null)} className="text-gray-400 hover:text-white p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl text-sm text-emerald-300">
                Số tiền: <b className="text-white text-base">+{linkTarget.amount.toLocaleString()}đ</b>
                <div className="text-xs text-slate-400 mt-1">
                  Mã giao dịch SePay: <span className="font-mono text-slate-200">{linkTarget.providerTransactionId}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mã Đơn Hàng Cần Khớp (*)
                </label>
                <input
                  type="text"
                  value={orderCodeInput}
                  onChange={(e) => setOrderCodeInput(e.target.value)}
                  placeholder="Ví dụ: ORD_A1B2C3D4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ghi chú xử lý (Tùy chọn)
                </label>
                <textarea
                  value={linkNoteInput}
                  onChange={(e) => setLinkNoteInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[60px]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setLinkTarget(null)}
                  className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleLinkOrderSubmit}
                  disabled={isLinking}
                  className="btn bg-emerald-600 text-white hover:bg-emerald-500 px-5 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isLinking ? 'Đang ghép đơn...' : 'Xác nhận ghép đơn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
