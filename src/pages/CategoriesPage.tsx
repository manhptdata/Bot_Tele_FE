import { useState } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useLazyGetProductCountQuery } from '../api/categoryApi';
import { Plus, Edit2, Trash2, FolderTree, X, Search, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../components/ui/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export const CategoriesPage = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: pageResponse, isLoading } = useGetCategoriesQuery({
    page,
    size: 10,
    keyword: debouncedSearchTerm
  });
  
  const categories = pageResponse?.content || [];
  
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [getProductCount] = useLazyGetProductCountQuery();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    sortOrder: number;
    isActive: boolean;
  }>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true
  });

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '', imageUrl: '', sortOrder: 0, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory({ id: editingId, data: formData }).unwrap();
        toast.success('Đã cập nhật danh mục!');
      } else {
        await createCategory(formData).unwrap();
        toast.success('Đã thêm danh mục mới!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const count = await getProductCount(id).unwrap();
      let confirmMsg = 'Bạn có chắc chắn muốn xóa danh mục này?';
      if (count > 0) {
        confirmMsg = `⚠️ Danh mục này đang chứa ${count} sản phẩm.\n\nToàn bộ sản phẩm sẽ được tự động chuyển sang danh mục "Sản phẩm khác".\n\nBạn có chắc chắn muốn xóa?`;
      }
      if (!window.confirm(confirmMsg)) return;

      await deleteCategory(id).unwrap();
      toast.success('Đã xóa danh mục');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi xóa danh mục');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Danh mục</h1>
          <p className="text-gray-400 mt-1">Phân loại và điều chỉnh thứ tự hiển thị trên Telegram Bot</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          <span>Thêm danh mục</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm danh mục..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="glass rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-4">Thứ tự</th>
                <th className="p-4">Tên Danh mục</th>
                <th className="p-4">Ảnh bìa</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <FolderTree size={48} className="mb-2 opacity-20" />
                      <p>Chưa có danh mục nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-semibold text-blue-400">
                      #{cat.sortOrder ?? 0}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{cat.name}</span>
                        {cat.slug === 'other' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">/{cat.slug}</div>
                    </td>
                    <td className="p-4">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-600">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-400 max-w-xs truncate">{cat.description || '-'}</td>
                    <td className="p-4">
                      {cat.isActive ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">Hoạt động</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">Đã ẩn</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(cat)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      {cat.slug !== 'other' && (
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Xóa danh mục"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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

      {/* Modal Thêm / Sửa Danh Mục */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FolderTree className="text-blue-500" />
                {editingId ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tên danh mục (*)</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ví dụ: Tài khoản Netflix, Game..." />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mã (Slug) (*)</label>
                  <input 
                    required 
                    type="text" 
                    disabled={editingId !== null && categories.find(c => c.id === editingId)?.slug === 'other'}
                    title={editingId !== null && categories.find(c => c.id === editingId)?.slug === 'other' ? 'Không thể thay đổi mã của danh mục mặc định' : ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                    value={formData.slug} 
                    onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                    placeholder="netflix-premium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Thứ tự ưu tiên</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: Number(e.target.value) || 0})} placeholder="0 (nhỏ hiện trước)" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Link Ảnh Bìa (Tùy chọn)</label>
                <input type="url" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://example.com/banner.png" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mô tả danh mục</label>
                <textarea className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} placeholder="Mô tả ngắn gọn về danh mục..." />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  disabled={editingId !== null && categories.find(c => c.id === editingId)?.slug === 'other'}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500 h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed" 
                />
                <label htmlFor="isActive" className="text-sm text-gray-300 font-medium">
                  Kích hoạt hiển thị trên Bot {editingId !== null && categories.find(c => c.id === editingId)?.slug === 'other' && '(Bắt buộc bật cho danh mục mặc định)'}
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-700/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 text-sm">Hủy</button>
                <button type="submit" disabled={isCreating} className="btn bg-blue-600 text-white hover:bg-blue-500 px-5 py-2 text-sm font-semibold disabled:opacity-50">
                  {isCreating ? 'Đang lưu...' : 'Lưu Danh Mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
