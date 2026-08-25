import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Layers,
  Users,
  Percent,
  Coins,
  X,
  Tag,
  ShieldAlert,
  TrendingUp,
  Filter,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useToggleVoucherMutation,
  useDeleteVoucherMutation,
  useRestoreVoucherMutation,
  useHardDeleteVoucherMutation,
  Voucher,
  VoucherCreateRequest,
} from '../api/voucherApi';
import { useGetProductsQuery } from '../api/productApi';
import { useGetCustomersQuery } from '../api/customerApi';
import { Pagination } from '../components/ui/Pagination';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { useDebounce } from '../hooks/useDebounce';

export const VouchersPage = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'TRASH'>('ALL');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: voucherPage, isLoading } = useGetVouchersQuery({
    page,
    size: 10,
    keyword: debouncedSearchTerm || undefined,
    status: activeFilter,
  });

  const { data: productPage } = useGetProductsQuery({ size: 100 });
  const { data: customerPage } = useGetCustomersQuery({ size: 100 });

  const allProducts = productPage?.content || [];
  const allCustomers = customerPage?.content || [];

  const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
  const [updateVoucher, { isLoading: isUpdating }] = useUpdateVoucherMutation();
  const [toggleVoucher] = useToggleVoucherMutation();
  const [deleteVoucher] = useDeleteVoucherMutation();
  const [restoreVoucher] = useRestoreVoucherMutation();
  const [hardDeleteVoucher] = useHardDeleteVoucherMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  // Search inside modal
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number | '';
    maxDiscountAmount: number | '';
    minOrderAmount: number | '';
    scope: 'ALL' | 'PRODUCTS';
    target: 'PUBLIC' | 'SPECIFIC';
    totalQuantity: number | '';
    maxUsagePerCustomer: number | '';
    startDate: string;
    endDate: string;
    productIds: number[];
    customerIds: number[];
  }>({
    code: '',
    description: '',
    discountType: 'FIXED',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '',
    scope: 'ALL',
    target: 'PUBLIC',
    totalQuantity: '',
    maxUsagePerCustomer: 1,
    startDate: '',
    endDate: '',
    productIds: [],
    customerIds: [],
  });

  const handleOpenModal = (voucher?: Voucher) => {
    setProductSearch('');
    setCustomerSearch('');
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        description: voucher.description || '',
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountAmount ?? '',
        minOrderAmount: voucher.minOrderAmount ?? '',
        scope: voucher.scope,
        target: voucher.target,
        totalQuantity: voucher.totalQuantity ?? '',
        maxUsagePerCustomer: voucher.maxUsagePerCustomer ?? 1,
        startDate: voucher.startDate ? voucher.startDate.slice(0, 16) : '',
        endDate: voucher.endDate ? voucher.endDate.slice(0, 16) : '',
        productIds: voucher.productIds || [],
        customerIds: voucher.customerIds || [],
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'FIXED',
        discountValue: '',
        maxDiscountAmount: '',
        minOrderAmount: '',
        scope: 'ALL',
        target: 'PUBLIC',
        totalQuantity: '',
        maxUsagePerCustomer: 1,
        startDate: '',
        endDate: '',
        productIds: [],
        customerIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã code');
      return;
    }
    if (formData.discountValue === '' || Number(formData.discountValue) <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0');
      return;
    }

    try {
      if (editingVoucher) {
        await updateVoucher({
          id: editingVoucher.id,
          data: {
            description: formData.description,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            maxDiscountAmount: formData.maxDiscountAmount !== '' ? Number(formData.maxDiscountAmount) : null,
            minOrderAmount: formData.minOrderAmount !== '' ? Number(formData.minOrderAmount) : 0,
            scope: formData.scope,
            target: formData.target,
            totalQuantity: formData.totalQuantity !== '' ? Number(formData.totalQuantity) : null,
            maxUsagePerCustomer: formData.maxUsagePerCustomer !== '' ? Number(formData.maxUsagePerCustomer) : 1,
            startDate: formData.startDate ? formData.startDate + ':00' : null,
            endDate: formData.endDate ? formData.endDate + ':00' : null,
            productIds: formData.scope === 'PRODUCTS' ? formData.productIds : [],
            customerIds: formData.target === 'SPECIFIC' ? formData.customerIds : [],
          },
        }).unwrap();
        toast.success('Cập nhật mã giảm giá thành công!');
      } else {
        const payload: VoucherCreateRequest = {
          code: formData.code.trim().toUpperCase(),
          description: formData.description,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          maxDiscountAmount: formData.maxDiscountAmount !== '' ? Number(formData.maxDiscountAmount) : undefined,
          minOrderAmount: formData.minOrderAmount !== '' ? Number(formData.minOrderAmount) : undefined,
          scope: formData.scope,
          target: formData.target,
          totalQuantity: formData.totalQuantity !== '' ? Number(formData.totalQuantity) : undefined,
          maxUsagePerCustomer: formData.maxUsagePerCustomer !== '' ? Number(formData.maxUsagePerCustomer) : 1,
          startDate: formData.startDate ? formData.startDate + ':00' : undefined,
          endDate: formData.endDate ? formData.endDate + ':00' : undefined,
          productIds: formData.scope === 'PRODUCTS' ? formData.productIds : [],
          customerIds: formData.target === 'SPECIFIC' ? formData.customerIds : [],
        };
        await createVoucher(payload).unwrap();
        toast.success('Tạo mã giảm giá thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Có lỗi xảy ra khi lưu mã giảm giá');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleVoucher(id).unwrap();
      toast.success('Đã cập nhật trạng thái');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const handleMoveToTrash = async (id: number, code: string) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển mã giảm giá "${code}" vào Thùng rác không?`)) {
      return;
    }
    try {
      await deleteVoucher(id).unwrap();
      toast.success(`Đã chuyển mã "${code}" vào Thùng rác`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi chuyển vào thùng rác');
    }
  };

  const handleRestore = async (id: number, code: string) => {
    if (!window.confirm(`Khôi phục mã giảm giá "${code}" về danh sách hoạt động?`)) {
      return;
    }
    try {
      await restoreVoucher(id).unwrap();
      toast.success(`Đã khôi phục mã "${code}" thành công`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi khôi phục voucher');
    }
  };

  const handleHardDelete = async (id: number, code: string) => {
    if (!window.confirm(`⚠️ CẢNH BÁO NGUY HIỂM:\nBạn có chắc muốn XÓA VĨNH VIỄN mã "${code}" khỏi Database không?\nThao tác này KHÔNG THỂ khôi phục!`)) {
      return;
    }
    try {
      await hardDeleteVoucher(id).unwrap();
      toast.success(`Đã xóa vĩnh viễn mã "${code}" khỏi hệ thống`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Không thể xóa vĩnh viễn voucher này');
    }
  };

  const toggleProductSelection = (productId: number) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const toggleCustomerSelection = (customerId: number) => {
    setFormData((prev) => ({
      ...prev,
      customerIds: prev.customerIds.includes(customerId)
        ? prev.customerIds.filter((id) => id !== customerId)
        : [...prev.customerIds, customerId],
    }));
  };

  const vouchers = voucherPage?.content || [];

  // Filtered products & customers for modal
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    return allProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [allProducts, productSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers;
    const term = customerSearch.toLowerCase();
    return allCustomers.filter(
      (c) =>
        (c.username && c.username.toLowerCase().includes(term)) ||
        (c.firstName && c.firstName.toLowerCase().includes(term)) ||
        (c.lastName && c.lastName.toLowerCase().includes(term)) ||
        String(c.telegramId).includes(term)
    );
  }, [allCustomers, customerSearch]);

  // Summary stats
  const totalCount = voucherPage?.totalElements || 0;
  const activeCount = vouchers.filter((v) => v.isActive).length;
  const totalUsedSum = vouchers.reduce((acc, v) => acc + (v.usedCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-indigo-400" />
            Quản lý Mã Giảm Giá
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập các chương trình khuyến mãi, chiết khấu và phát hành voucher cho khách hàng
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-slate-700/50 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tổng số voucher</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-slate-700/50 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Đang hoạt động</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-slate-700/50 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Lượt sử dụng (trang này)</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{totalUsedSum}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Trạng thái:
          </span>
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setActiveFilter('ACTIVE');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang bật
            </button>
            <button
              onClick={() => {
                setActiveFilter('INACTIVE');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'INACTIVE'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang tắt
            </button>
            <button
              onClick={() => {
                setActiveFilter('TRASH');
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeFilter === 'TRASH'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Thùng rác</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl border border-slate-700/50 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã Code</th>
                <th className="py-3.5 px-4">Loại & Mức giảm</th>
                <th className="py-3.5 px-4">Phạm vi</th>
                <th className="py-3.5 px-4">Đối tượng</th>
                <th className="py-3.5 px-4">Đã dùng / Tổng</th>
                <th className="py-3.5 px-4">Thời hạn</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Ticket className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-30 stroke-[1.5]" />
                    <p className="text-slate-400 font-medium">Chưa có mã giảm giá nào phù hợp</p>
                    <p className="text-xs text-slate-500 mt-1">Bấm "Tạo mã mới" để tạo voucher đầu tiên của bạn</p>
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const isExpired = v.endDate && new Date(v.endDate) < new Date();
                  const isNotStarted = v.startDate && new Date(v.startDate) > new Date();

                  return (
                    <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                            {v.code}
                          </span>
                        </div>
                        {v.description && (
                          <p className="text-xs text-slate-400 mt-1 max-w-[220px] truncate" title={v.description}>
                            {v.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5 font-mono">
                          {v.discountType === 'PERCENT' ? (
                            <>
                              <Percent className="w-4 h-4 text-amber-400" />
                              <span className="text-amber-300 font-bold">{v.discountValue}%</span>
                              {v.maxDiscountAmount && (
                                <span className="text-xs text-slate-400 font-normal font-sans">
                                  (tối đa {v.maxDiscountAmount.toLocaleString()}đ)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Coins className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">{v.discountValue.toLocaleString()}đ</span>
                            </>
                          )}
                        </div>
                        {v.minOrderAmount && v.minOrderAmount > 0 ? (
                          <span className="text-[11px] text-slate-400">
                            Đơn tối thiểu: {v.minOrderAmount.toLocaleString()}đ
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Không yêu cầu đơn tối thiểu</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {v.scope === 'ALL' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md">
                            <Layers className="w-3 h-3 text-indigo-400" /> Toàn bộ SP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-md">
                            <Tag className="w-3 h-3 text-blue-400" /> {v.productIds?.length || 0} sản phẩm
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {v.target === 'PUBLIC' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-md">
                            <Users className="w-3 h-3 text-teal-400" /> Toàn shop
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-md">
                            <ShieldAlert className="w-3 h-3 text-purple-400" /> {v.customerIds?.length || 0} khách
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-semibold text-white">{v.usedCount}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">{v.totalQuantity !== null ? v.totalQuantity : '∞'}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Max {v.maxUsagePerCustomer} lượt/khách</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs space-y-0.5 font-mono">
                          {v.startDate && (
                            <div className="text-slate-400 flex items-center gap-1">
                              <span className="text-slate-500">Từ:</span> {new Date(v.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(v.startDate).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                          {v.endDate && (
                            <div className="text-slate-400 flex items-center gap-1">
                              <span className="text-slate-500">Đến:</span> {new Date(v.endDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(v.endDate).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                          {!v.startDate && !v.endDate && <span className="text-slate-500 italic font-sans">Vô thời hạn</span>}
                          {isExpired && (
                            <span className="inline-block text-[10px] text-rose-400 font-semibold bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded font-sans">
                              Đã hết hạn
                            </span>
                          )}
                          {isNotStarted && (
                            <span className="inline-block text-[10px] text-amber-400 font-semibold bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded font-sans">
                              Chưa bắt đầu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {activeFilter === 'TRASH' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Trash2 className="w-3.5 h-3.5" /> Đã xóa
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggle(v.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              v.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {v.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {v.isActive ? 'Đang bật' : 'Đang tắt'}
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {activeFilter === 'TRASH' ? (
                            <>
                              <button
                                onClick={() => handleRestore(v.id, v.code)}
                                className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Khôi phục voucher"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleHardDelete(v.id, v.code)}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Xóa vĩnh viễn khỏi Database"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenModal(v)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMoveToTrash(v.id, v.code)}
                                className="p-2 text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Chuyển vào Thùng rác"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {voucherPage && voucherPage.totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
            <Pagination
              currentPage={page}
              totalPages={voucherPage.totalPages}
              totalElements={voucherPage.totalElements}
              pageSize={voucherPage.pageSize}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-indigo-400" />
                {editingVoucher ? `Chỉnh sửa Voucher: ${editingVoucher.code}` : 'Tạo Mã Giảm Giá Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
              {/* Mã & Mô tả */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mã Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingVoucher}
                    placeholder="VD: SALE50K, TET2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giảm 50k tri ân khách hàng"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Loại giảm & Giá trị giảm & Trần giảm */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Loại giảm giá
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="FIXED">Số tiền cố định (đ)</option>
                    <option value="PERCENT">Theo phần trăm (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mức giảm *
                  </label>
                  {formData.discountType === 'PERCENT' ? (
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      placeholder="VD: 20 (%)"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                  ) : (
                    <CurrencyInput
                      required
                      placeholder="VD: 50.000 (đ)"
                      value={formData.discountValue}
                      onChange={(val) => setFormData({ ...formData, discountValue: val })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                      suffix="đ"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Giảm tối đa (đ)
                  </label>
                  <CurrencyInput
                    disabled={formData.discountType !== 'PERCENT'}
                    placeholder={formData.discountType === 'PERCENT' ? 'VD: 100.000' : 'Không áp dụng'}
                    value={formData.maxDiscountAmount}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: val,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-40 font-mono"
                    suffix={formData.discountType === 'PERCENT' ? 'đ' : undefined}
                  />
                </div>
              </div>

              {/* Đơn tối thiểu & Giới hạn số lượng */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Đơn tối thiểu (đ)
                  </label>
                  <CurrencyInput
                    placeholder="0 = Không yêu cầu"
                    value={formData.minOrderAmount}
                    onChange={(val) =>
                      setFormData({ ...formData, minOrderAmount: val })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    suffix="đ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tổng số lượt
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Để trống = Vô hạn"
                    value={formData.totalQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, totalQuantity: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Lượt dùng / Khách
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Mặc định: 1"
                    value={formData.maxUsagePerCustomer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsagePerCustomer: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Thời hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DateTimePicker
                  label="Thời gian bắt đầu"
                  placeholder="dd/mm/yyyy --:--"
                  value={formData.startDate}
                  onChange={(val) => setFormData({ ...formData, startDate: val })}
                />
                <DateTimePicker
                  label="Thời gian kết thúc"
                  placeholder="dd/mm/yyyy --:--"
                  value={formData.endDate}
                  minDate={formData.startDate}
                  onChange={(val) => setFormData({ ...formData, endDate: val })}
                />
              </div>

              {/* Phạm vi sản phẩm */}
              <div className="space-y-2 border-t border-slate-700/60 pt-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Phạm vi áp dụng sản phẩm
                </label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={formData.scope === 'ALL'}
                      onChange={() => setFormData({ ...formData, scope: 'ALL' })}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-slate-300">Toàn bộ sản phẩm trong shop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={formData.scope === 'PRODUCTS'}
                      onChange={() => setFormData({ ...formData, scope: 'PRODUCTS' })}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-slate-300">Chỉ định sản phẩm ({formData.productIds.length} đã chọn)</span>
                  </label>
                </div>

                {formData.scope === 'PRODUCTS' && (
                  <div className="mt-2.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700/70 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm sản phẩm..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-2">Không tìm thấy sản phẩm nào</p>
                      ) : (
                        filteredProducts.map((p) => (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2.5 text-xs p-2 rounded-lg cursor-pointer transition-colors ${
                              formData.productIds.includes(p.id)
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-slate-300 hover:bg-slate-700/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.productIds.includes(p.id)}
                              onChange={() => toggleProductSelection(p.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                            />
                            <span className="font-medium flex-1">{p.name}</span>
                            <span className="text-slate-400 font-mono">({p.price.toLocaleString()}đ)</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Đối tượng khách hàng */}
              <div className="space-y-2 border-t border-slate-700/60 pt-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Đối tượng khách hàng áp dụng
                </label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      checked={formData.target === 'PUBLIC'}
                      onChange={() => setFormData({ ...formData, target: 'PUBLIC' })}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-slate-300">Tất cả khách hàng (Public)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      checked={formData.target === 'SPECIFIC'}
                      onChange={() => setFormData({ ...formData, target: 'SPECIFIC' })}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-slate-300">Khách hàng chỉ định ({formData.customerIds.length} đã chọn)</span>
                  </label>
                </div>

                {formData.target === 'SPECIFIC' && (
                  <div className="mt-2.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700/70 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm khách theo tên, username, ID..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-2">Không tìm thấy khách hàng nào</p>
                      ) : (
                        filteredCustomers.map((c) => (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2.5 text-xs p-2 rounded-lg cursor-pointer transition-colors ${
                              formData.customerIds.includes(c.id)
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-slate-300 hover:bg-slate-700/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.customerIds.includes(c.id)}
                              onChange={() => toggleCustomerSelection(c.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                            />
                            <span className="font-medium flex-1">
                              {c.firstName} {c.lastName} ({c.username ? `@${c.username}` : `ID: ${c.telegramId}`})
                            </span>
                            <span className="text-slate-400 font-mono">Đơn: {c.totalOrders}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isCreating || isUpdating ? 'Đang lưu...' : editingVoucher ? 'Cập nhật' : 'Tạo mã ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
