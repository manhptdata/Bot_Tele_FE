import React, { useState } from 'react';
import {
  useGetCustomersQuery,
  useGetCustomerWalletTransactionsQuery,
  useGetCustomerOrdersQuery,
  useSoftDeleteCustomerMutation,
  useSoftDeleteBatchMutation,
  useRestoreCustomerMutation,
  useRestoreBatchMutation,
  useHardDeleteCustomerMutation,
  TelegramCustomer,
} from '../api/customerApi';
import { Pagination } from '../components/ui/Pagination';
import {
  Users,
  Search,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Clock,
  ShoppingBag,
  CircleDollarSign,
  UserCheck,
  UserX,
  X,
  Eye,
  Copy,
  Check,
  User,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomersPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'DELETED' | 'ALL'>('ACTIVE');
  const [page, setPage] = useState(0);
  const size = 10;

  const isDeletedParam =
    statusTab === 'ACTIVE' ? false : statusTab === 'DELETED' ? true : undefined;

  const { data, isLoading } = useGetCustomersQuery({
    keyword: keyword.trim() || undefined,
    isDeleted: isDeletedParam,
    page,
    size,
  });

  const [softDeleteCustomer] = useSoftDeleteCustomerMutation();
  const [softDeleteBatch, { isLoading: isBatchDeleting }] = useSoftDeleteBatchMutation();
  const [restoreCustomer] = useRestoreCustomerMutation();
  const [restoreBatch, { isLoading: isBatchRestoring }] = useRestoreBatchMutation();
  const [hardDeleteCustomer, { isLoading: isHardDeleting }] = useHardDeleteCustomerMutation();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewCustomer, setViewCustomer] = useState<TelegramCustomer | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<TelegramCustomer | null>(null);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.content) {
      setSelectedIds(data.content.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSoftDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mềm (ẩn) tài khoản này?')) {
      try {
        await softDeleteCustomer(id).unwrap();
        toast.success('Đã xóa mềm khách hàng thành công');
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      } catch (err: any) {
        toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleBatchSoftDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa mềm ${selectedIds.length} khách hàng đã chọn?`)) {
      try {
        await softDeleteBatch(selectedIds).unwrap();
        toast.success(`Đã xóa mềm ${selectedIds.length} khách hàng`);
        setSelectedIds([]);
      } catch (err: any) {
        toast.error(err?.data?.message || 'Có lỗi xảy ra');
      }
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreCustomer(id).unwrap();
      toast.success('Đã khôi phục tài khoản thành công');
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi khôi phục');
    }
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      await restoreBatch(selectedIds).unwrap();
      toast.success(`Đã khôi phục ${selectedIds.length} khách hàng`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi khôi phục');
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    try {
      await hardDeleteCustomer(hardDeleteTarget.id).unwrap();
      toast.success('Đã xóa vĩnh viễn khách hàng thành công');
      if (viewCustomer?.id === hardDeleteTarget.id) {
        setViewCustomer(null);
      }
      setHardDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((item) => item !== hardDeleteTarget.id));
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi xóa vĩnh viễn');
    }
  };

  const formatMoney = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" />
            Quản lý Khách hàng
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi danh sách khách hàng, số dư ví, lịch sử nạp tiền và giao dịch
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => {
              setStatusTab('ACTIVE');
              setPage(0);
              setSelectedIds([]);
            }}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              statusTab === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            Đang hoạt động
          </button>
          <button
            onClick={() => {
              setStatusTab('DELETED');
              setPage(0);
              setSelectedIds([]);
            }}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              statusTab === 'DELETED'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserX size={14} />
            Đã xóa mềm
          </button>
          <button
            onClick={() => {
              setStatusTab('ALL');
              setPage(0);
              setSelectedIds([]);
            }}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm ID, username, tên..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-800/60 p-3 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="text-sm text-blue-200 flex items-center gap-2">
            <span className="font-semibold">{selectedIds.length}</span> khách hàng đang được chọn
          </div>
          <div className="flex items-center gap-2">
            {statusTab !== 'DELETED' && (
              <button
                onClick={handleBatchSoftDelete}
                disabled={isBatchDeleting}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                Xóa mềm ({selectedIds.length})
              </button>
            )}

            {statusTab !== 'ACTIVE' && (
              <button
                onClick={handleBatchRestore}
                disabled={isBatchRestoring}
                className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={13} />
                Khôi phục ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      data?.content &&
                      data.content.length > 0 &&
                      selectedIds.length === data.content.length
                    }
                    onChange={handleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Telegram ID</th>
                <th className="p-4">Username</th>
                <th className="p-4">Họ & Tên</th>
                <th className="p-4 text-right">Số dư ví</th>
                <th className="p-4 text-center">Đơn hàng</th>
                <th className="p-4 text-right">Tổng chi tiêu</th>
                <th className="p-4">Tham gia / Lần cuối</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách khách hàng...
                    </div>
                  </td>
                </tr>
              ) : !data?.content || data.content.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Không tìm thấy khách hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                data.content.map((customer) => {
                  const isSelected = selectedIds.includes(customer.id);
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setViewCustomer(customer)}
                      className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-900/20' : ''
                      } ${customer.isDeleted ? 'opacity-60' : ''}`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(customer.id)}
                          className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-200">
                        {customer.telegramId}
                      </td>
                      <td className="p-4">{customer.username ? `@${customer.username}` : '-'}</td>
                      <td className="p-4 font-medium text-white">
                        {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || (
                          <span className="text-slate-500 italic">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-medium">
                        <span className="inline-flex items-center gap-1 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          <Wallet size={12} className="text-emerald-400" />
                          {formatMoney(customer.walletBalance)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <ShoppingBag size={12} />
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-amber-400">
                        <span className="inline-flex items-center gap-1">
                          <CircleDollarSign size={13} />
                          {formatMoney(customer.totalSpent)}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1"><Calendar size={12} /> {formatDate(customer.firstSeen)}</div>
                        <div className="flex items-center gap-1 text-slate-300"><Clock size={12} /> {formatDate(customer.lastSeen)}</div>
                      </td>
                      <td className="p-4 text-center">
                        {customer.isDeleted ? (
                          <span className="text-red-400 text-xs font-medium">Đã xóa</span>
                        ) : (
                          <span className="text-emerald-400 text-xs font-medium">Hoạt động</span>
                        )}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => setViewCustomer(customer)} className="text-slate-400 hover:text-blue-400"><Eye size={16} /></button>
                           {!customer.isDeleted ? (
                            <button onClick={() => handleSoftDelete(customer.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                           ) : (
                            <button onClick={() => handleRestore(customer.id)} className="text-slate-400 hover:text-emerald-400"><RotateCcw size={16} /></button>
                           )}
                           <button onClick={() => setHardDeleteTarget(customer)} className="text-slate-400 hover:text-rose-500"><AlertTriangle size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <Pagination
            currentPage={data.pageNumber}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            pageSize={data.pageSize}
            onPageChange={(p) => {
              setPage(p);
              setSelectedIds([]);
            }}
          />
        )}
      </div>

      {/* Modal Chi tiết Khách Hàng (Customer Detail Modal with Wallet & Orders) */}
      {viewCustomer && (
        <CustomerDetailModal
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
          formatMoney={formatMoney}
          formatDate={formatDate}
        />
      )}

      {/* Modal Cảnh báo Xóa Cứng (Hard Delete Confirmation Modal) */}
      {hardDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border-2 border-red-600/80 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-red-950/50 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                <AlertTriangle size={28} />
              </div>
              <button
                onClick={() => setHardDeleteTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Xác nhận Xóa Vĩnh Viễn?</h3>
              <p className="text-sm text-red-400 mt-1 font-medium">
                Cảnh báo nguy hiểm: Hành động này KHÔNG THỂ HOÀN TÁC!
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Telegram ID:</span>
                <span className="font-mono font-bold text-white">{hardDeleteTarget.telegramId}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-medium text-white">
                  {[hardDeleteTarget.firstName, hardDeleteTarget.lastName].filter(Boolean).join(' ') || 'N/A'}{' '}
                  {hardDeleteTarget.username ? `(@${hardDeleteTarget.username})` : ''}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Số dư ví:</span>
                <span className="font-semibold text-emerald-400">{formatMoney(hardDeleteTarget.walletBalance)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Tổng chi tiêu:</span>
                <span className="font-semibold text-amber-400">{formatMoney(hardDeleteTarget.totalSpent)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Khách hàng này và bản ghi ví liên kết sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu. Nếu bạn chỉ muốn ẩn khách hàng khỏi danh sách, vui lòng sử dụng chức năng <strong>Xóa mềm</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHardDeleteTarget(null)}
                disabled={isHardDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmHardDelete}
                disabled={isHardDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-red-600/30 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isHardDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xóa vĩnh viễn
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

{/* SUB-COMPONENT: CUSTOMER DETAIL MODAL */}
interface CustomerDetailModalProps {
  customer: TelegramCustomer;
  onClose: () => void;
  formatMoney: (amount: number | undefined | null) => string;
  formatDate: (dateStr: string | undefined) => string;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  formatMoney,
  formatDate,
}) => {
  const [activeTab, setActiveTab] = useState<'WALLET' | 'ORDERS'>('WALLET');
  const [copiedId, setCopiedId] = useState(false);

  const { data: transactions = [], isLoading: isTxLoading } = useGetCustomerWalletTransactionsQuery(customer.id);
  const { data: orders = [], isLoading: isOrdersLoading } = useGetCustomerOrdersQuery(customer.id);

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-semibold">
            <ArrowDownLeft size={13} /> Nạp tiền
          </span>
        );
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-xs font-semibold">
            <ArrowUpRight size={13} /> Mua hàng
          </span>
        );
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-xs font-semibold">
            <RotateCcw size={12} /> Hoàn tiền
          </span>
        );
      case 'DEPOSIT_REQUEST':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-semibold">
            <Clock size={12} /> Chờ nạp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-xs font-semibold">
            {type}
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">Thành công</span>;
      case 'PENDING':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">Chờ thanh toán</span>;
      case 'CANCELLED':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">Đã hủy</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <User size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">
                  {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Khách hàng ẩn danh'}
                </h3>
                {customer.isDeleted ? (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[11px]">
                    Đã xóa mềm
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                    Hoạt động
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                {customer.username ? (
                  <a
                    href={`https://t.me/${customer.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    @{customer.username}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="italic">Chưa có username</span>
                )}
                <span>•</span>
                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                  ID: {customer.telegramId}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(customer.telegramId));
                    setCopiedId(true);
                    toast.success('Đã sao chép Telegram ID');
                    setTimeout(() => setCopiedId(false), 2000);
                  }}
                  className="text-slate-400 hover:text-white p-0.5 hover:bg-slate-800 rounded transition-colors"
                  title="Sao chép ID"
                >
                  {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3 Thẻ Thống Kê Tổng Quan */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-emerald-950/20 border border-emerald-800/40 p-3.5 rounded-xl">
            <span className="text-xs text-emerald-400/80 font-medium block">Số dư Ví Bot</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Wallet size={18} />
              {formatMoney(customer.walletBalance)}
            </span>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-800/40 p-3.5 rounded-xl">
            <span className="text-xs text-indigo-400/80 font-medium block">Tổng đơn hàng</span>
            <span className="text-lg font-bold text-indigo-300 mt-1 flex items-center gap-1.5">
              <ShoppingBag size={18} />
              {customer.totalOrders} đơn
            </span>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-xl">
            <span className="text-xs text-amber-400/80 font-medium block">Tổng chi tiêu</span>
            <span className="text-lg font-bold text-amber-400 mt-1 flex items-center gap-1.5">
              <CircleDollarSign size={18} />
              {formatMoney(customer.totalSpent)}
            </span>
          </div>
        </div>

        {/* Tabs Điều hướng: Lịch sử ví vs Đơn hàng */}
        <div className="flex border-b border-slate-800 gap-6 shrink-0 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`pb-3 relative flex items-center gap-2 transition-colors ${
              activeTab === 'WALLET' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet size={16} />
            Lịch sử Ví & Nạp tiền ({transactions.length})
            {activeTab === 'WALLET' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 relative flex items-center gap-2 transition-colors ${
              activeTab === 'ORDERS' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag size={16} />
            Lịch sử Đơn hàng ({orders.length})
            {activeTab === 'ORDERS' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Nội dung Tab Cuộn được */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-3 min-h-[220px]">
          {activeTab === 'WALLET' && (
            isTxLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải lịch sử giao dịch ví...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Wallet size={36} className="mx-auto opacity-30" />
                <p>Khách hàng chưa có giao dịch ví nào.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.map((tx) => {
                  const isPositive = Number(tx.amount) > 0;
                  return (
                    <div
                      key={tx.id}
                      className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTxTypeBadge(tx.type)}
                          {tx.referenceCode && (
                            <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {tx.referenceCode}
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{formatDate(tx.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-300">{tx.description || '-'}</p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <span>Số dư:</span>
                          <span>{formatMoney(tx.balanceBefore)}</span>
                          <span>$\rightarrow$</span>
                          <span className="font-bold text-slate-200">{formatMoney(tx.balanceAfter)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {activeTab === 'ORDERS' && (
            isOrdersLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải lịch sử đơn hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShoppingBag size={36} className="mx-auto opacity-30" />
                <p>Khách hàng chưa có đơn hàng nào.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400 text-sm">{order.orderCode}</span>
                        {getOrderStatusBadge(order.status)}
                        <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Hình thức:</span>
                        <span className="font-medium text-slate-300">
                          {order.paymentMethod === 'WALLET' ? '💳 Ví Bot' : '🏦 Ngân hàng'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-white">
                        {formatMoney(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={12} /> Hoạt động gần nhất: {formatDate(customer.lastSeen)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
