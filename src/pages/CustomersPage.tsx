import React, { useState } from 'react';
import {
  useGetCustomersQuery,
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

  const [softDeleteCustomer, { isLoading: isSoftDeleting }] = useSoftDeleteCustomerMutation();
  const [softDeleteBatch, { isLoading: isBatchDeleting }] = useSoftDeleteBatchMutation();
  const [restoreCustomer, { isLoading: isRestoring }] = useRestoreCustomerMutation();
  const [restoreBatch, { isLoading: isBatchRestoring }] = useRestoreBatchMutation();
  const [hardDeleteCustomer, { isLoading: isHardDeleting }] = useHardDeleteCustomerMutation();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Customer Detail modal state
  const [viewCustomer, setViewCustomer] = useState<TelegramCustomer | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Hard delete modal
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
      toast.error(err?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!hardDeleteTarget) return;
    try {
      await hardDeleteCustomer(hardDeleteTarget.id).unwrap();
      toast.success('Đã xóa vĩnh viễn khách hàng khỏi hệ thống');
      setSelectedIds((prev) => prev.filter((item) => item !== hardDeleteTarget.id));
      setHardDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể xóa vĩnh viễn khách hàng');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatMoney = (amount?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-500" />
            Khách hàng Telegram
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý và theo dõi danh sách tất cả người dùng đã từng nhắn tin hoặc tương tác với Bot.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass rounded-xl p-4 border border-slate-700/60 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Status Tabs */}
          <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-700/60 self-start">
            <button
              onClick={() => {
                setStatusTab('ACTIVE');
                setPage(0);
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                statusTab === 'ACTIVE'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserCheck size={16} />
              Đang hoạt động
            </button>
            <button
              onClick={() => {
                setStatusTab('DELETED');
                setPage(0);
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                statusTab === 'DELETED'
                  ? 'bg-red-600/80 text-white shadow-lg shadow-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserX size={16} />
              Đã xóa mềm
            </button>
            <button
              onClick={() => {
                setStatusTab('ALL');
                setPage(0);
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                statusTab === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px] md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo ID, username, tên..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/60 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-950/40 border border-blue-800/50 px-4 py-2.5 rounded-lg text-sm animate-in fade-in">
            <span className="text-blue-300 font-medium">
              Đã chọn <strong className="text-white">{selectedIds.length}</strong> khách hàng
            </span>
            <div className="flex items-center gap-2">
              {statusTab !== 'DELETED' && (
                <button
                  onClick={handleBatchSoftDelete}
                  disabled={isBatchDeleting}
                  className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Xóa mềm đã chọn
                </button>
              )}
              {(statusTab === 'DELETED' || statusTab === 'ALL') && (
                <button
                  onClick={handleBatchRestore}
                  disabled={isBatchRestoring}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Khôi phục đã chọn
                </button>
              )}
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Hủy chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="glass rounded-xl border border-slate-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700/60">
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
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách khách hàng...
                    </div>
                  </td>
                </tr>
              ) : !data?.content || data.content.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
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
                      } ${customer.isDeleted ? 'opacity-60 bg-red-950/10' : ''}`}
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
                        <span className="bg-slate-800/80 px-2.5 py-1 rounded-md text-xs border border-slate-700/50">
                          {customer.telegramId}
                        </span>
                      </td>
                      <td className="p-4">
                        {customer.username ? (
                          <a
                            href={`https://t.me/${customer.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 hover:underline"
                          >
                            @{customer.username}
                            <ExternalLink size={12} className="opacity-70" />
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">Không có</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {[customer.firstName, customer.lastName].filter(Boolean).join(' ') || (
                          <span className="text-slate-500 italic">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <ShoppingBag size={12} />
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <CircleDollarSign size={13} />
                          {formatMoney(customer.totalSpent)}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5" title="Ngày bắt đầu nhắn">
                          <Calendar size={12} className="text-slate-500" />
                          <span>{formatDate(customer.firstSeen)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300" title="Hoạt động gần nhất">
                          <Clock size={12} className="text-blue-400" />
                          <span>{formatDate(customer.lastSeen)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {customer.isDeleted ? (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs">
                            Đã xóa mềm
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewCustomer(customer)}
                            title="Xem chi tiết khách hàng"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Eye size={16} />
                          </button>

                          {!customer.isDeleted ? (
                            <button
                              onClick={() => handleSoftDelete(customer.id)}
                              disabled={isSoftDeleting}
                              title="Xóa mềm (Ẩn khách hàng)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(customer.id)}
                              disabled={isRestoring}
                              title="Khôi phục tài khoản"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}

                          {/* Nút Xóa Cứng / Xóa Vĩnh Viễn */}
                          <button
                            onClick={() => setHardDeleteTarget(customer)}
                            title="Xóa vĩnh viễn (Nguy hiểm)"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-900/30 transition-colors"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Component */}
        {data && data.totalPages > 1 && (
          <Pagination
            currentPage={data.pageNumber}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            pageSize={data.pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        )}
      </div>

      {/* Modal Chi Tiết Khách Hàng */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <User size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {[viewCustomer.firstName, viewCustomer.lastName].filter(Boolean).join(' ') || 'Khách hàng ẩn danh'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewCustomer.username ? `@${viewCustomer.username}` : 'Không có username'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewCustomer(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Thẻ thông tin định danh */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-400" />
                  Thông tin định danh Telegram
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Telegram ID:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded border border-slate-700/60">
                        {viewCustomer.telegramId}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(viewCustomer.telegramId));
                          setCopiedId(true);
                          toast.success('Đã sao chép Telegram ID');
                          setTimeout(() => setCopiedId(false), 2000);
                        }}
                        className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                        title="Sao chép ID"
                      >
                        {copiedId ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-xs">Trạng thái:</span>
                    <span className="mt-1 inline-block">
                      {viewCustomer.isDeleted ? (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs">
                          Đã xóa mềm
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">
                          Đang hoạt động
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thẻ thống kê & Hoạt động */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-emerald-400" />
                  Hoạt động mua hàng
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block">Tổng đơn hàng</span>
                    <span className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                      <ShoppingBag size={16} className="text-indigo-400" />
                      {viewCustomer.totalOrders} đơn
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 block">Tổng chi tiêu</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CircleDollarSign size={16} />
                      {formatMoney(viewCustomer.totalSpent)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" />
                      Bắt đầu tương tác:
                    </span>
                    <span className="text-slate-300 font-medium">{formatDate(viewCustomer.firstSeen)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-400" />
                      Hoạt động lần cuối:
                    </span>
                    <span className="text-slate-300 font-medium">{formatDate(viewCustomer.lastSeen)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {viewCustomer.username ? (
                <a
                  href={`https://t.me/${viewCustomer.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 border border-blue-500/30"
                >
                  <ExternalLink size={15} />
                  Mở Telegram chat
                </a>
              ) : (
                <span className="text-xs text-slate-500 italic">Khách chưa đặt Username Telegram</span>
              )}

              <button
                type="button"
                onClick={() => setViewCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
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
                <span className="text-slate-400">Tổng chi tiêu:</span>
                <span className="font-semibold text-emerald-400">{formatMoney(hardDeleteTarget.totalSpent)}</span>
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
