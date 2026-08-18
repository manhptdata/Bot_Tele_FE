import React, { useState } from 'react';
import { useGetAvailableAccountsForItemQuery, useReserveAccountMutation } from '../../api/orderApi';
import { X, Check, Loader2, Package, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

interface AvailableAccountPickerProps {
  orderId: number;
  orderItemId: number;
  productName: string;
  maxNeeded: number;
  currentCount: number;
  onClose: () => void;
  onReservedSuccess?: () => void;
}

export const AvailableAccountPicker: React.FC<AvailableAccountPickerProps> = ({
  orderId,
  orderItemId,
  productName,
  maxNeeded,
  currentCount,
  onClose,
  onReservedSuccess,
}) => {
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const { data, isLoading, isFetching, error, refetch } = useGetAvailableAccountsForItemQuery({
    orderId,
    orderItemId,
    page,
    size: pageSize,
  });

  const [reserveAccount, { isLoading: isReserving }] = useReserveAccountMutation();
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const handleSelectAccount = async (accountId: number) => {
    setReserveError(null);
    setReservingId(accountId);
    try {
      await reserveAccount({ orderId, orderItemId, accountId }).unwrap();
      if (onReservedSuccess) onReservedSuccess();
      onClose();
    } catch (err: any) {
      setReserveError(err?.data?.message || err?.data?.error || 'Không thể giữ chỗ tài khoản này (có thể vừa được người khác chọn).');
      refetch();
    } finally {
      setReservingId(null);
    }
  };

  const isFull = currentCount >= maxNeeded;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Chọn Tài Khoản Trong Kho</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sản phẩm: <span className="text-blue-400 font-semibold">{productName}</span> • Đã chọn:{' '}
                <span className={isFull ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {currentCount}/{maxNeeded}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {reserveError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{reserveError}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs">Đang tải tài khoản khả dụng...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-xs">
              Không thể tải danh sách tài khoản kho hoặc phiên làm việc đã hết hạn.
            </div>
          ) : !data || data.accounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Kho hàng hiện không còn tài khoản khả dụng nào cho sản phẩm này.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Còn khả dụng: <strong className="text-emerald-400">{data.availableCount}</strong> tài khoản</span>
                {isFetching && <span className="text-blue-400 animate-pulse text-[11px]">Đang cập nhật...</span>}
              </div>

              {data.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl border border-slate-800 hover:border-blue-500/50 bg-slate-800/40 hover:bg-slate-800/80 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300">
                        #{acc.id}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-semibold">Khả dụng</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {acc.maskedValues.map((val, vIdx) => {
                        const fieldName = acc.fieldNames[vIdx] || `Cột ${vIdx + 1}`;
                        return (
                          <div key={vIdx} className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[11px]">{fieldName}:</span>
                            <span className="font-mono text-slate-200 font-medium truncate max-w-[200px]">
                              {val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    disabled={isFull || isReserving}
                    onClick={() => handleSelectAccount(acc.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {reservingId === acc.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang giữ...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Chọn acc này</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/80">
            <span className="text-xs text-slate-400">
              Trang {data.page + 1} / {data.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.totalPages - 1 || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
