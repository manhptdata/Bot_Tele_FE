import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { UpgradeFormField, UpgradeSubmission } from '../api/upgradeApi';

interface MiniData {
  orderCode: string;
  serviceName: string;
  quantity: number;
  serviceStatus: string;
  correctionReason?: string;
  formSchema: { fields: UpgradeFormField[] };
  formUiSchema?: { bulkInputGuide?: string; bulkInputExample?: string };
  submissions?: UpgradeSubmission[];
}

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const UpgradeMiniAppPage = () => {
  const { token } = useParams();
  const [data, setData] = useState<MiniData | null>(null);
  const [items, setItems] = useState<Record<string, string>[]>([]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<'FORM' | 'BULK'>('FORM');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    (window as any).Telegram?.WebApp?.ready?.();
    fetch(`${apiBase}/miniapp/upgrade-orders/${token}`, { cache: 'no-store' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.message || 'Liên kết không hợp lệ');
        setData(body);
        const existing: Record<number, Record<string, unknown>> = {};
        body.submissions?.forEach((submission: UpgradeSubmission) => { existing[submission.itemIndex] = submission.formData; });
        setItems(Array.from({ length: body.quantity }, (_, itemIndex) => Object.fromEntries(
          body.formSchema.fields.map((field: UpgradeFormField) => {
            const value = existing[itemIndex + 1]?.[field.key];
            return [field.key, value === '••••••••' || value == null ? '' : String(value)];
          }),
        )));
        const existingBulk = Array.from({ length: body.quantity }, (_, itemIndex) => existing[itemIndex + 1]?._bulkLine)
          .filter(value => value != null && value !== '••••••••')
          .map(String);
        if (existingBulk.length) {
          setMode('BULK');
          setBulkText(existingBulk.join('\n'));
        }
      })
      .catch(reason => setError(reason.message))
      .finally(() => setLoading(false));
  }, [token]);

  const fields = data?.formSchema?.fields || [];
  const progress = useMemo(() => items
    .map(item => fields.filter(field => field.required).every(field => String(item[field.key] || '').trim()))
    .filter(Boolean).length, [items, fields]);
  const bulkLines = useMemo(() => bulkText.split(/\r?\n/).map(line => line.trim()).filter(Boolean), [bulkText]);
  const set = (key: string, value: string) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));

  const submit = async () => {
    if (!data) return;
    let body: { submissionMode?: string; items: { itemIndex: number; formData: Record<string, string> }[] };
    if (mode === 'BULK') {
      if (bulkLines.length !== data.quantity) {
        setError(`Bạn đã nhập ${bulkLines.length}/${data.quantity} tài khoản. Mỗi dòng phải là một tài khoản.`);
        return;
      }
      body = { submissionMode: 'BULK', items: bulkLines.map((line, itemIndex) => ({ itemIndex: itemIndex + 1, formData: { _bulkLine: line } })) };
    } else {
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const missing = fields.find(field => field.required && !String(items[itemIndex][field.key] || '').trim());
        if (missing) {
          setIndex(itemIndex);
          setError(`Vui lòng nhập ${missing.label} cho tài khoản ${itemIndex + 1}`);
          return;
        }
      }
      body = { submissionMode: 'FORM', items: items.map((formData, itemIndex) => ({ itemIndex: itemIndex + 1, formData })) };
    }
    setSending(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/miniapp/upgrade-orders/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || 'Không thể gửi thông tin');
      setDone(true);
      (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Shell><div className="min-h-[70vh] flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2" />Đang tải form...</div></Shell>;
  if (error && !data) return <Shell><div className="p-8 text-center text-rose-400">{error}</div></Shell>;
  if (done || ['SUBMITTED', 'PROCESSING', 'COMPLETED'].includes(data?.serviceStatus || '')) return <Shell><div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8"><CheckCircle size={64} className="text-emerald-400 mb-4" /><h1 className="text-2xl font-bold text-white">Đã gửi thông tin</h1><p className="text-slate-400 mt-2">Shop đã tiếp nhận đơn {data?.orderCode} và sẽ thông báo khi hoàn tất.</p></div></Shell>;

  return <Shell><div className="p-4 max-w-xl mx-auto">
    <div className="py-4"><div className="text-xs uppercase tracking-wider text-blue-400">{data?.orderCode}</div><h1 className="text-xl font-bold text-white mt-1">{data?.serviceName}</h1></div>
    {data?.serviceStatus === 'NEEDS_CORRECTION' && <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3 rounded-xl text-sm mb-4">Admin yêu cầu bổ sung: {data.correctionReason}</div>}
    {(data?.quantity || 0) > 1 && <div className="grid grid-cols-2 gap-2 mb-4">
      <button type="button" onClick={() => { setMode('FORM'); setError(''); }} className={`py-2.5 rounded-xl text-sm ${mode === 'FORM' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Nhập từng tài khoản</button>
      <button type="button" onClick={() => { setMode('BULK'); setError(''); }} className={`py-2.5 rounded-xl text-sm ${mode === 'BULK' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Dán danh sách hàng loạt</button>
    </div>}

    {mode === 'BULK' ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
      <div><h2 className="font-semibold text-white">Nhập thông tin của {data?.quantity} tài khoản</h2><div className="text-xs text-slate-400 mt-2 space-y-1"><p>• Mỗi dòng tương ứng với 1 tài khoản.</p><p>• Nhập theo hướng dẫn và mẫu của Admin bên dưới.</p><p>• Các dòng trống sẽ được bỏ qua.</p></div></div>
      {data?.formUiSchema?.bulkInputGuide && <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-100"><div className="text-xs text-blue-400 mb-1">Hướng dẫn của Admin</div>{data.formUiSchema.bulkInputGuide}</div>}
      {data?.formUiSchema?.bulkInputExample && <div className="text-xs text-slate-400">Ví dụ: <code className="text-amber-300 break-all">{data.formUiSchema.bulkInputExample}</code></div>}
      <textarea value={bulkText} onChange={event => setBulkText(event.target.value)} placeholder={`Dán ${data?.quantity || 0} dòng vào đây...`} className="input w-full min-h-56 font-mono text-sm" />
      <div className={`text-sm ${bulkLines.length === data?.quantity ? 'text-emerald-400' : 'text-amber-300'}`}>Đã nhập {bulkLines.length}/{data?.quantity} tài khoản</div>
    </div> : <>
      <div className="flex justify-between text-xs text-slate-400 mb-2"><span>Đã đủ thông tin {progress}/{data?.quantity}</span><span>Tài khoản {index + 1}/{data?.quantity}</span></div>
      <div className="h-1.5 bg-slate-800 rounded mb-4"><div className="h-full bg-blue-500 rounded" style={{ width: `${data ? progress / data.quantity * 100 : 0}%` }} /></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"><h2 className="font-semibold text-white">Thông tin tài khoản {index + 1}</h2>{fields.map(field => <label key={field.key} className="block text-sm text-slate-300">{field.label}{field.required && <span className="text-rose-400"> *</span>}{field.placeholder && <span className="block text-xs text-blue-300 mt-1">Gợi ý (không bắt buộc): <code className="text-amber-300">{field.placeholder}</code></span>}{field.type === 'textarea' ? <textarea value={items[index]?.[field.key] || ''} onChange={event => set(field.key, event.target.value)} placeholder={field.placeholder} maxLength={field.maxLength} className={`input mt-1 w-full min-h-28 ${field.sensitive ? 'masked-input' : ''}`} /> : <input type={field.type === 'password' ? 'password' : 'text'} value={items[index]?.[field.key] || ''} onChange={event => set(field.key, event.target.value)} placeholder={field.placeholder} maxLength={field.maxLength} className="input mt-1 w-full" />}{field.sensitive && <span className="text-[11px] text-slate-500">Ký tự được che khi nhập; Admin vẫn nhận đủ nội dung.</span>}</label>)}</div>
    </>}

    {error && <div className="text-sm text-rose-400 mt-3">{error}</div>}
    {mode === 'FORM' && index + 1 < (data?.quantity || 0) ? <div className="flex gap-3 mt-5"><button disabled={index === 0} onClick={() => setIndex(value => value - 1)} className="flex-1 py-3 bg-slate-800 disabled:opacity-30 rounded-xl text-white flex justify-center items-center"><ChevronLeft />Trước</button><button onClick={() => setIndex(value => value + 1)} className="flex-1 py-3 bg-blue-600 rounded-xl text-white flex justify-center items-center">Tiếp<ChevronRight /></button></div> : <button disabled={sending} onClick={submit} className="w-full mt-5 py-3 bg-emerald-600 disabled:opacity-50 rounded-xl text-white font-semibold">{sending ? 'Đang gửi...' : mode === 'BULK' ? `Gửi ${bulkLines.length} tài khoản` : 'Gửi thông tin'}</button>}
  </div></Shell>;
};

const Shell = ({ children }: { children: React.ReactNode }) => <div className="min-h-screen bg-slate-950 text-white">{children}</div>;
