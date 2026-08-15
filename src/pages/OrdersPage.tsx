import { useGetOrdersQuery, useConfirmOrderMutation, useGetOrderByIdQuery } from '../api/orderApi';
import { ShoppingCart, CheckCircle, Clock, XCircle, Search, Eye, X, Package, User, Wallet, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Pagination } from '../components/ui/Pagination';
import { useDebounce } from '../hooks/useDebounce';

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

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const { data: orderDetail, isLoading: isDetailLoading } = useGetOrderByIdQuery(selectedOrderId as number, {
    skip: selectedOrderId === null
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Quản lý Đơn hàng</h1>
        <p className="text-gray-400 mt-1">Theo dõi giao dịch và duyệt đơn hàng</p>
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
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => {
              setSelectedStatus('PENDING');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={13} />
            Chờ thanh toán
          </button>
          <button
            onClick={() => {
              setSelectedStatus('COMPLETED');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle size={13} />
            Hoàn thành
          </button>
          <button
            onClick={() => {
              setSelectedStatus('CANCELLED');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle size={13} />
            Đã hủy
          </button>
          <button
            onClick={() => {
              setSelectedStatus('REFUNDED');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              selectedStatus === 'REFUNDED'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw size={13} />
            Đã hoàn tiền
          </button>
        </div>

        {/* Ô Tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm mã đơn, tên khách..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="p-4 font-semibold text-slate-300">Mã đơn</th>
                <th className="p-4 font-semibold text-slate-300">Khách hàng</th>
                <th className="p-4 font-semibold text-slate-300">Tổng tiền</th>
                <th className="p-4 font-semibold text-slate-300">Thanh toán</th>
                <th className="p-4 font-semibold text-slate-300">Trạng thái</th>
                <th className="p-4 font-semibold text-slate-300">Ngày tạo</th>
                <th className="p-4 font-semibold text-slate-300 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
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
                    className="border-b border-slate-700/20 hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-medium text-white">{order.orderCode}</td>
                    <td className="p-4">
                      <div className="text-blue-300 font-medium">{order.customer.firstName}</div>
                      <div className="text-xs text-slate-400">@{order.customer.username}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-400 font-medium">{order.totalAmount.toLocaleString()}đ</div>
                      {order.feeAmount && order.feeAmount > 0 ? (
                        <div className="text-[11px] text-amber-400/80">
                          (Gồm +{order.feeAmount.toLocaleString()}đ phí CK)
                        </div>
                      ) : null}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      <div className="flex items-center space-x-1">
                        <span>{order.paymentMethod === 'BANK_TRANSFER' ? '🏦 Ngân hàng' : '💳 Ví'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 w-max ${
                        order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'PAID' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {order.status === 'COMPLETED' && <CheckCircle size={12} />}
                        {order.status === 'PENDING' && <Clock size={12} />}
                        {order.status === 'CANCELLED' && <XCircle size={12} />}
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setSelectedOrderId(order.id)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === 'PENDING' && order.paymentMethod === 'BANK_TRANSFER' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirm(order.orderCode);
                            }}
                            disabled={isConfirming}
                            className="btn bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-3 py-1 text-sm disabled:opacity-50"
                          >
                            Duyệt đơn
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

      {/* Chi tiết đơn hàng Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="text-blue-500" />
                Chi tiết đơn hàng #{orderDetail?.orderCode}
              </h2>
              <button onClick={() => setSelectedOrderId(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isDetailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : orderDetail ? (
                <div className="space-y-6">
                  {/* Thông tin chung */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold border-b border-slate-700/50 pb-2">
                        <User size={18} /> Khách Hàng
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Tên:</span> <span className="text-white font-medium">{orderDetail.customer.firstName}</span></p>
                        <p><span className="text-slate-400">Username:</span> <span className="text-blue-400">@{orderDetail.customer.username}</span></p>
                        <p><span className="text-slate-400">Telegram ID:</span> <span className="text-white font-mono">{orderDetail.customer.telegramId}</span></p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold border-b border-slate-700/50 pb-2">
                        <Wallet size={18} /> Thanh Toán
                      </div>
                      <div className="space-y-2 text-sm">
                        {orderDetail.subtotalAmount && orderDetail.feeAmount && orderDetail.feeAmount > 0 ? (
                          <>
                            <p><span className="text-slate-400">Tiền hàng:</span> <span className="text-white font-medium">{orderDetail.subtotalAmount.toLocaleString()}đ</span></p>
                            <p><span className="text-slate-400">Phí chuyển khoản:</span> <span className="text-amber-400 font-medium">+{orderDetail.feeAmount.toLocaleString()}đ</span></p>
                          </>
                        ) : null}
                        <p><span className="text-slate-400">Tổng thanh toán:</span> <span className="text-green-400 font-bold text-base">{orderDetail.totalAmount.toLocaleString()}đ</span></p>
                        <p><span className="text-slate-400">Phương thức:</span> <span className="text-white">{orderDetail.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Ví'}</span></p>
                        <p>
                          <span className="text-slate-400 mr-2">Trạng thái:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            orderDetail.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                            orderDetail.status === 'PAID' ? 'bg-blue-500/20 text-blue-400' :
                            orderDetail.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {orderDetail.status}
                          </span>
                        </p>
                        <p><span className="text-slate-400">Giao hàng:</span> <span className="text-white">{orderDetail.deliveryMode}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Sản phẩm & Tài khoản đã giao */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Package size={20} className="text-blue-400" /> Mặt Hàng Đã Mua
                    </h3>
                    
                    <div className="space-y-4">
                      {orderDetail.items.map((item) => (
                        <div key={item.id} className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
                          <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                            <div>
                              <div className="font-bold text-white text-lg">{item.productName}</div>
                              <div className="text-sm text-slate-400">Số lượng: <span className="text-white font-medium">{item.quantity}</span> x {item.unitPrice.toLocaleString()}đ</div>
                            </div>
                            <div className="text-green-400 font-bold text-lg">
                              {item.subtotal.toLocaleString()}đ
                            </div>
                          </div>
                          
                          {/* Tài khoản chi tiết */}
                          {item.deliveredAccounts && item.deliveredAccounts.length > 0 ? (
                            <div className="p-4">
                              <p className="text-sm font-semibold text-slate-300 mb-2">Tài khoản đã xuất kho:</p>
                              <div className="space-y-2">
                                {item.deliveredAccounts.map((accInfo, idx) => (
                                  <div key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 font-mono text-sm">
                                    <div className="text-blue-400 mb-1">#{idx + 1}</div>
                                    <div className="text-slate-300 break-words whitespace-pre-wrap leading-relaxed">
                                      {accInfo.join(' | ')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-slate-500 text-sm italic text-center">
                              {orderDetail.status === 'PENDING' ? 'Chưa giao hàng (chờ thanh toán)' : 'Đơn hàng này không có tài khoản tự động nào được giao.'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">Không tìm thấy thông tin đơn hàng</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
