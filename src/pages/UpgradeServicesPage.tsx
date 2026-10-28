import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  UpgradeFormField, UpgradeService, UpgradeServicePayload,
  useCreateUpgradeServiceMutation, useDeleteUpgradeServiceMutation,
  useGetUpgradeServicesQuery, useUpdateUpgradeServiceMutation,
} from '../api/upgradeApi';
import { Pagination } from '../components/ui/Pagination';

const blankField = (): UpgradeFormField => ({ key: '', label: '', type: 'text', placeholder: '', required: false, sensitive: false, maxLength: 255 });
const slugify = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const empty = () => ({ name: '', slug: '', description: '', imageUrl: '', price: '', isActive: true, maxQuantityPerOrder: 5, estimatedProcessingTime: '', sensitiveDataRetention: 'NEVER', bulkInputGuide: '', bulkInputExample: '', bulkInputSensitive: false, fields: [blankField()] });

const fieldsWithGeneratedKeys = (fields: UpgradeFormField[]) => {
  const used = new Set<string>();
  return fields.map((field, index) => {
    const rawKey = slugify(field.label).replace(/-/g, '_');
    const generated = (rawKey && /^[a-z]/.test(rawKey) ? rawKey : `field_${rawKey || index + 1}`).slice(0, 42);
    const preferred = field.key.trim() || generated;
    let key = preferred;
    let suffix = 2;
    while (used.has(key)) key = `${preferred.slice(0, 46)}_${suffix++}`;
    used.add(key);
    return { ...field, key, label: field.label.trim(), maxLength: Number(field.maxLength) };
  });
};

export const UpgradeServicesPage = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const { data, isLoading, isFetching } = useGetUpgradeServicesQuery({
    keyword: keyword.trim() || undefined,
    page,
    size: pageSize,
  });
  const [createService] = useCreateUpgradeServiceMutation();
  const [updateService] = useUpdateUpgradeServiceMutation();
  const [deleteService] = useDeleteUpgradeServiceMutation();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(empty());

  const open = (service?: UpgradeService) => {
    setEditing(service?.id ?? null);
    setForm(service ? {
      name: service.name, slug: service.slug, description: service.description || '', imageUrl: service.imageUrl || '',
      price: String(service.price), isActive: service.isActive, maxQuantityPerOrder: service.maxQuantityPerOrder,
      estimatedProcessingTime: service.estimatedProcessingTime || '', sensitiveDataRetention: service.sensitiveDataRetention,
      bulkInputGuide: service.formUiSchema?.bulkInputGuide || '',
      bulkInputExample: service.formUiSchema?.bulkInputExample || '',
      bulkInputSensitive: Boolean(service.formUiSchema?.bulkInputSensitive),
      fields: service.formSchema?.fields?.length ? service.formSchema.fields.map(field => ({
        ...field,
        type: (field.type === 'textarea' ? 'textarea' : 'text') as UpgradeFormField['type'],
        sensitive: field.sensitive || field.type === 'password',
      })) : [blankField()],
    } : empty());
    setModal(true);
  };

  const updateField = (index: number, patch: Partial<UpgradeFormField>) => {
    const fields = form.fields.map((f, i) => i === index ? { ...f, ...patch } : f);
    setForm({ ...form, fields });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fields.length || form.fields.some(f => !f.label.trim())) return toast.error('Vui lòng nhập tên cho các trường thông tin');
    const payload: UpgradeServicePayload = {
      name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(), imageUrl: form.imageUrl.trim(),
      price: form.price, isActive: form.isActive, maxQuantityPerOrder: Number(form.maxQuantityPerOrder),
      estimatedProcessingTime: form.estimatedProcessingTime.trim(), sensitiveDataRetention: form.sensitiveDataRetention,
      formSchema: { fields: fieldsWithGeneratedKeys(form.fields).map(field => ({
        ...field,
        type: field.type === 'textarea' ? 'textarea' : field.sensitive ? 'password' : 'text',
      })) }, formUiSchema: {
        bulkInputGuide: form.bulkInputGuide.trim(),
        bulkInputExample: form.bulkInputExample.trim(),
        bulkInputSensitive: form.bulkInputSensitive,
      },
    };
    try {
      if (editing) await updateService({ id: editing, data: payload }).unwrap();
      else await createService(payload).unwrap();
      toast.success(editing ? 'Đã cập nhật dịch vụ' : 'Đã tạo dịch vụ'); setModal(false);
    } catch (err: any) { toast.error(err?.data?.message || 'Không thể lưu dịch vụ'); }
  };

  const services = useMemo(() => data?.content || [], [data]);
  return <div className="p-4 md:p-8 space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-white">Gói nâng cấp</h1><p className="text-sm text-slate-400 mt-1">Danh mục dịch vụ độc lập với sản phẩm trong kho.</p></div>
      <button onClick={() => open()} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white flex items-center gap-2"><Plus size={18}/>Thêm dịch vụ</button>
    </div>
    <div className="glass border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
      <div className="p-4 border-b border-slate-800 bg-slate-900/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} placeholder="Tìm theo tên hoặc mã dịch vụ..." className="input w-full pl-10" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <PackageOpen size={17} className="text-blue-400" />
          <span><strong className="text-white">{data?.totalElements || 0}</strong> gói dịch vụ</span>
          {isFetching && !isLoading && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
        </div>
      </div>
      {isLoading ? <div className="p-8 text-slate-400">Đang tải...</div> : services.length === 0 ? <div className="p-10 text-center text-slate-500">Chưa có dịch vụ nâng cấp.</div> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-900/70 text-slate-400"><tr><th className="text-left p-4">Dịch vụ</th><th className="text-left p-4">Giá</th><th className="text-left p-4">Form</th><th className="text-left p-4">Trạng thái</th><th className="p-4"/></tr></thead>
      <tbody>{services.map(s => <tr key={s.id} className="border-t border-slate-800 text-slate-200 hover:bg-blue-500/5 transition-colors">
        <td className="p-4"><div className="font-semibold text-white">{s.name}</div><div className="text-xs text-slate-500">{s.slug}</div></td>
        <td className="p-4 font-semibold text-emerald-400">{Number(s.price).toLocaleString('vi-VN')}đ</td>
        <td className="p-4">{s.formSchema?.fields?.length || 0} trường · tối đa {s.maxQuantityPerOrder}</td>
        <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs ${s.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>{s.isActive ? 'Đang mở' : 'Đã ẩn'}</span></td>
        <td className="p-4"><div className="flex justify-end gap-2"><button title="Sửa" onClick={() => open(s)} className="p-2 hover:bg-slate-700 rounded-lg"><Pencil size={16}/></button><button title="Ngừng dịch vụ" onClick={async()=>{if(confirm('Ngừng hiển thị dịch vụ này?')){await deleteService(s.id);toast.success('Đã ngừng dịch vụ')}}} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg"><Trash2 size={16}/></button></div></td>
      </tr>)}</tbody></table></div>}
      {data && data.totalElements > 0 && <Pagination
        currentPage={data.pageNumber}
        totalPages={data.totalPages}
        totalElements={data.totalElements}
        pageSize={data.pageSize}
        onPageChange={setPage}
        onPageSizeChange={size => { setPageSize(size); setPage(0); }}
        pageSizeOptions={[10, 20, 50, 100]}
      />}
    </div>

    {modal && <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"><form onSubmit={submit} className="w-full max-w-4xl glass bg-slate-950 border border-slate-700 rounded-2xl my-6">
      <div className="p-5 border-b border-slate-800 flex justify-between"><div><h2 className="text-xl font-bold text-white">{editing ? 'Sửa gói nâng cấp' : 'Thêm gói nâng cấp'}</h2><p className="text-xs text-slate-500 mt-1">Form khách hàng sẽ được tạo từ danh sách trường bên dưới.</p></div><button type="button" onClick={()=>setModal(false)}><X className="text-slate-400"/></button></div>
      <div className="p-5 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-300">Tên dịch vụ<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:editing?form.slug:slugify(e.target.value)})} placeholder="Ví dụ: YouTube Premium" className="input mt-1 w-full"/></label>
          <label className="text-sm text-slate-300">Giá<input required type="number" min="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="input mt-1 w-full"/></label>
          <label className="text-sm text-slate-300">Số lượng tối đa<input required type="number" min="1" max="100" value={form.maxQuantityPerOrder} onChange={e=>setForm({...form,maxQuantityPerOrder:Number(e.target.value)})} className="input mt-1 w-full"/></label>
          <label className="text-sm text-slate-300">Thời gian xử lý dự kiến<input value={form.estimatedProcessingTime} onChange={e=>setForm({...form,estimatedProcessingTime:e.target.value})} placeholder="15–60 phút" className="input mt-1 w-full"/></label>
        </div>
        <label className="text-sm text-slate-300 block">Mô tả<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="input mt-1 w-full min-h-24"/></label>
        <div className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/><span className="text-sm text-slate-300">Hiển thị trên Bot</span></div>
        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4 space-y-3">
          <div><h3 className="font-semibold text-white">Nhập nhiều tài khoản cùng lúc</h3><p className="text-xs text-slate-400 mt-1">Khi khách mua từ 2 tài khoản, Bot cho phép dán danh sách; mỗi dòng được giữ nguyên và tính là một tài khoản.</p></div>
          <label className="text-sm text-slate-300 block">Hướng dẫn nhập hàng loạt<textarea maxLength={1000} value={form.bulkInputGuide} onChange={e=>setForm({...form,bulkInputGuide:e.target.value})} placeholder="Ví dụ: Mỗi dòng nhập theo mẫu tài khoản|mật khẩu|mã 2FA" className="input mt-1 w-full min-h-20"/></label>
          <label className="text-sm text-slate-300 block">Dữ liệu mẫu<input maxLength={500} value={form.bulkInputExample} onChange={e=>setForm({...form,bulkInputExample:e.target.value})} placeholder="Ví dụ: email@gmail.com|matkhau|ABC123" className="input mt-1 w-full"/></label>
          <label title="Che danh sách trong thông báo Telegram gửi Admin và màn xem nhanh. Admin vẫn có thể mở chi tiết để xem đầy đủ." className="text-sm text-slate-300 flex items-center gap-2"><input type="checkbox" checked={form.bulkInputSensitive} onChange={e=>setForm({...form,bulkInputSensitive:e.target.checked})}/><span>Che nội dung hàng loạt trên thông báo Admin</span></label>
          <p className="text-xs text-blue-300/80">ℹ️ Hệ thống không tách hoặc kiểm tra định dạng trong từng dòng; chỉ kiểm tra số dòng có đúng số lượng khách đã mua.</p>
        </div>
        <div className="border-t border-slate-800 pt-5"><div className="flex items-center justify-between mb-3"><div><h3 className="font-semibold text-white">Thông tin khách cần điền</h3><p className="text-xs text-slate-500">Chỉ cần đặt tên trường và đưa mẫu nhập rõ ràng. Hệ thống tự xử lý phần kỹ thuật.</p></div><button type="button" onClick={()=>setForm({...form,fields:[...form.fields,blankField()]})} className="text-sm px-3 py-2 bg-slate-800 rounded-lg text-blue-300">+ Thêm trường</button></div>
          <div className="mb-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-200">Ví dụ muốn nhận chung một dòng: đặt tên <b>Tài khoản | Mật khẩu</b>, mẫu nhập <code className="text-amber-300">email@gmail.com|matkhau</code> và bật <b>Ẩn nội dung khi khách nhập</b>.</div>
          <div className="space-y-3">{form.fields.map((f,i)=><div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-300">Trường {i + 1}</span><button type="button" title="Xóa trường" onClick={()=>setForm({...form,fields:form.fields.filter((_,x)=>x!==i)})} className="text-rose-400 p-1 hover:bg-rose-500/10 rounded"><Trash2 size={17}/></button></div>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">Tên hiển thị<input required value={f.label} onChange={e=>updateField(i,{label:e.target.value})} placeholder="Ví dụ: Email tài khoản" className="input mt-1 w-full"/></label>
              <label className="text-xs text-slate-400">Mẫu / hướng dẫn cho khách <span className="text-slate-600">(không bắt buộc)</span><input value={f.placeholder||''} onChange={e=>updateField(i,{placeholder:e.target.value})} placeholder="Ví dụ: email@gmail.com|matkhau" className="input mt-1 w-full"/></label>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2"><input type="checkbox" checked={f.required} onChange={e=>updateField(i,{required:e.target.checked})}/><span>Bắt buộc nhập</span></label>
              <label className="text-sm text-slate-300 flex items-center gap-2"><input type="checkbox" checked={f.type==='textarea'} onChange={e=>updateField(i,{type:e.target.checked?'textarea':'text',maxLength:e.target.checked?2000:255})}/><span>Ô nhập nhiều dòng</span></label>
              <label title="Che ký tự trên form, xóa tin nhắn sau khi Bot ghi nhận và không hiện giá trị trong thông báo Telegram. Admin vẫn xem được trong chi tiết đơn." className="text-sm text-slate-300 flex items-center gap-2"><input type="checkbox" checked={f.sensitive} onChange={e=>updateField(i,{sensitive:e.target.checked})}/><span>Ẩn nội dung khi khách nhập</span></label>
            </div>
            <p className="text-xs text-blue-300/80">ℹ️ {f.sensitive
              ? `Phù hợp cho ${f.type === 'textarea' ? 'cookie, token hoặc nội dung dài nhạy cảm' : 'mật khẩu, mã khôi phục hoặc thông tin nhạy cảm'}.`
              : f.type === 'textarea'
                ? 'Khách có thể nhập ghi chú hoặc nội dung dài.'
                : 'Nhận tự do email, username, mã 2FA, số điện thoại, đường dẫn hoặc mọi thông tin ngắn.'}</p>
          </div>)}</div>
        </div>
      </div>
      <div className="p-5 border-t border-slate-800 flex justify-end gap-3"><button type="button" onClick={()=>setModal(false)} className="px-4 py-2 text-slate-400">Hủy</button><button className="px-5 py-2.5 bg-blue-600 rounded-xl text-white">Lưu dịch vụ</button></div>
    </form></div>}
  </div>;
};
