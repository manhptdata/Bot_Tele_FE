import { useEffect, useMemo, useState } from 'react';
import { BellRing, Boxes, Loader2, Save, Search, Send, ShoppingCart, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  NotificationProductScope,
  OwnerNotificationSettings,
  useGetOwnerNotificationSettingsQuery,
  useTestOwnerNotificationMutation,
  useUpdateOwnerNotificationSettingsMutation,
} from '../api/ownerNotificationSettingsApi';

const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}>
    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
);

export const NotificationSettingsPage = () => {
  const { data, isLoading, isError } = useGetOwnerNotificationSettingsQuery();
  const [saveSettings, { isLoading: isSaving }] = useUpdateOwnerNotificationSettingsMutation();
  const [sendTest, { isLoading: isTesting }] = useTestOwnerNotificationMutation();
  const [form, setForm] = useState<OwnerNotificationSettings | null>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (data) setForm(structuredClone(data));
  }, [data]);

  const filteredProducts = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase('vi');
    return form?.products.filter((product) => product.productName.toLocaleLowerCase('vi').includes(query)) || [];
  }, [form?.products, keyword]);

  const patchProduct = (productId: number, patch: Partial<OwnerNotificationSettings['products'][number]>) => {
    setForm((current) => current ? {
      ...current,
      products: current.products.map((item) => item.productId === productId ? { ...item, ...patch } : item),
    } : current);
  };

  const setScope = (productScope: NotificationProductScope) => setForm((current) => current ? { ...current, productScope } : current);

  const handleSave = async () => {
    if (!form) return;
    if (form.enabled && !form.adminChatConfigured) {
      toast.error('Hãy cấu hình Admin Chat ID trước khi bật thông báo');
      return;
    }
    try {
      const saved = await saveSettings({
        enabled: form.enabled,
        orderEnabled: form.orderEnabled,
        stockEnabled: form.stockEnabled,
        productScope: form.productScope,
        defaultStockThreshold: Math.max(0, Number(form.defaultStockThreshold) || 0),
        products: form.products.map((item) => ({
          productId: item.productId,
          selected: item.selected,
          orderEnabled: item.orderEnabled,
          stockEnabled: item.stockEnabled,
          stockThreshold: item.stockThreshold == null ? null : Math.max(0, Number(item.stockThreshold) || 0),
        })),
      }).unwrap();
      setForm(saved);
      toast.success('Đã lưu cấu hình thông báo');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể lưu cấu hình thông báo');
    }
  };

  const handleTest = async () => {
    try {
      await sendTest().unwrap();
      toast.success('Đã gửi thông báo thử tới Admin Chat ID');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể gửi thông báo thử');
    }
  };

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
  if (isError || !form) return <div className="text-rose-400">Không tải được cấu hình thông báo.</div>;

  const selectedCount = form.products.filter((item) => item.selected).length;
  const notificationsDisabled = !form.enabled;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white"><BellRing className="text-blue-400" /> Thông báo chủ shop</h1>
          <p className="mt-1 text-sm text-slate-400">Chọn sự kiện và sản phẩm sẽ được bot gửi về Admin Chat ID.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleTest} disabled={isTesting || !form.adminChatConfigured}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40">
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Gửi thử
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu cấu hình
          </button>
        </div>
      </div>

      {!form.adminChatConfigured && <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        <TriangleAlert size={19} className="mt-0.5 shrink-0" />
        <span>Chưa có Admin Chat ID. Hãy nhập Chat ID trong trang Cấu hình bot trước khi bật hoặc gửi thử thông báo.</span>
      </div>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="font-semibold text-white">Thông báo Telegram</h2><p className="mt-1 text-xs text-slate-400">Công tắc tổng có quyền ưu tiên cao nhất.</p></div>
          <Toggle checked={form.enabled} disabled={!form.adminChatConfigured} onChange={(enabled) => setForm({ ...form, enabled })} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 ${notificationsDisabled ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><ShoppingCart className="text-emerald-400" /><div><h2 className="font-semibold text-white">Đơn hàng mới</h2><p className="text-xs text-slate-400">Báo sau khi đơn được tạo thành công.</p></div></div>
            <Toggle checked={form.orderEnabled} disabled={notificationsDisabled} onChange={(orderEnabled) => setForm({ ...form, orderEnabled })} />
          </div>
        </section>
        <section className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 ${notificationsDisabled ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><Boxes className="text-amber-400" /><div><h2 className="font-semibold text-white">Cảnh báo tồn kho</h2><p className="text-xs text-slate-400">Báo sắp hết và hết hàng.</p></div></div>
            <Toggle checked={form.stockEnabled} disabled={notificationsDisabled} onChange={(stockEnabled) => setForm({ ...form, stockEnabled })} />
          </div>
          <label className="mt-4 block text-xs text-slate-400">Ngưỡng mặc định</label>
          <input type="number" min={0} disabled={notificationsDisabled || !form.stockEnabled} value={form.defaultStockThreshold}
            onChange={(event) => setForm({ ...form, defaultStockThreshold: Math.max(0, Number(event.target.value)) })}
            className="mt-1 w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-40" />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="font-semibold text-white">Phạm vi sản phẩm</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([['ALL', 'Toàn bộ hệ thống', 'Tự áp dụng cho cả sản phẩm tạo mới.'], ['SELECTED', 'Chọn từng sản phẩm', 'Chỉ gửi cho những mặt hàng được tích chọn.']] as const).map(([value, label, description]) => (
            <button key={value} type="button" disabled={notificationsDisabled} onClick={() => setScope(value)}
              className={`rounded-xl border p-4 text-left transition-colors disabled:opacity-40 ${form.productScope === value ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
              <div className="font-semibold text-white">{label}</div><div className="mt-1 text-xs text-slate-400">{description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-white">Cấu hình theo sản phẩm</h2><p className="mt-1 text-xs text-slate-400">{form.productScope === 'SELECTED' ? `Đã chọn ${selectedCount}/${form.products.length} sản phẩm.` : 'Có thể tắt loại thông báo hoặc đặt ngưỡng riêng cho từng sản phẩm.'}</p></div>
          <div className="flex gap-2">
            {form.productScope === 'SELECTED' && <button type="button" onClick={() => setForm({ ...form, products: form.products.map((item) => ({ ...item, selected: true })) })} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">Chọn tất cả</button>}
            <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-slate-500" /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm sản phẩm" className="rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-blue-500" /></div>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-800/60 text-left text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Chọn</th><th className="px-5 py-3">Sản phẩm</th><th className="px-5 py-3">Kho</th><th className="px-5 py-3">Báo đơn</th><th className="px-5 py-3">Báo tồn kho</th><th className="px-5 py-3">Ngưỡng riêng</th></tr></thead>
          <tbody className="divide-y divide-slate-800">{filteredProducts.map((product) => {
            const rowEnabled = form.productScope === 'ALL' || product.selected;
            return <tr key={product.productId} className={!product.productActive ? 'opacity-50' : ''}>
              <td className="px-5 py-4"><input type="checkbox" disabled={form.productScope === 'ALL' || notificationsDisabled} checked={form.productScope === 'ALL' || product.selected} onChange={(e) => patchProduct(product.productId, { selected: e.target.checked })} className="h-4 w-4 accent-blue-600" /></td>
              <td className="px-5 py-4"><div className="font-medium text-white">{product.productName}</div><div className="text-xs text-slate-500">{product.productActive ? 'Đang bán' : 'Ngừng bán'}</div></td>
              <td className={`px-5 py-4 font-mono ${product.currentStock === 0 ? 'text-rose-400' : 'text-slate-300'}`}>{product.currentStock}</td>
              <td className="px-5 py-4"><Toggle checked={product.orderEnabled} disabled={notificationsDisabled || !rowEnabled || !form.orderEnabled} onChange={(orderEnabled) => patchProduct(product.productId, { orderEnabled })} /></td>
              <td className="px-5 py-4"><Toggle checked={product.stockEnabled} disabled={notificationsDisabled || !rowEnabled || !form.stockEnabled} onChange={(stockEnabled) => patchProduct(product.productId, { stockEnabled })} /></td>
              <td className="px-5 py-4"><input type="number" min={0} placeholder={String(form.defaultStockThreshold)} disabled={notificationsDisabled || !rowEnabled || !form.stockEnabled || !product.stockEnabled} value={product.stockThreshold ?? ''} onChange={(e) => patchProduct(product.productId, { stockThreshold: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })} className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 disabled:opacity-40" /></td>
            </tr>;
          })}</tbody>
        </table></div>
      </section>
    </div>
  );
};
