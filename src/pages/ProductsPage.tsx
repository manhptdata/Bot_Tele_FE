import { useState } from 'react';
import { useGetProductsQuery, useDeleteProductMutation, useCreateProductMutation, useUpdateProductMutation } from '../api/productApi';
import { useGetCategoriesQuery } from '../api/categoryApi';
import { Plus, Edit2, Trash2, Package, X, Search, Eye, Tag, Settings, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../components/ui/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { PlusCircle, MinusCircle } from 'lucide-react';

export const ProductsPage = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: pageResponse, isLoading } = useGetProductsQuery({ 
    page, 
    size: 10,
    keyword: debouncedSearchTerm
  });
  
  const products = pageResponse?.content || [];
  const { data: categoriesPage } = useGetCategoriesQuery({ size: 100 });
  const categories = categoriesPage?.content || [];
  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProductInfo, setViewProductInfo] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [attributeList, setAttributeList] = useState<{key: string, value: string}[]>([]);
  const [formatFieldsList, setFormatFieldsList] = useState<string[]>(['Tài khoản', 'Mật khẩu']);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    price: string;
    categoryId: string;
    description: string;
    deliveryMode: 'AUTO' | 'MANUAL';
    stockCount: string;
    accountFormat: string;
    displayType: 'MULTI_LINE' | 'RAW';
    isActive: boolean;
  }>({
    name: '',
    slug: '',
    price: '',
    categoryId: '',
    description: '',
    deliveryMode: 'AUTO',
    stockCount: '0',
    accountFormat: 'Tài khoản|Mật khẩu',
    displayType: 'MULTI_LINE',
    isActive: true
  });

  const handleOpenModal = (product?: any) => {
    console.log("Opening modal for product:", product);
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        slug: product.slug,
        price: String(product.price ?? 0),
        categoryId: product.categoryId?.toString() || (categories.length > 0 ? categories[0].id.toString() : ''),
        description: product.description || '',
        deliveryMode: product.deliveryMode,
        stockCount: String(product.stockCount ?? 0),
        accountFormat: product.accountFormat || 'Tài khoản|Mật khẩu',
        displayType: product.displayType || 'MULTI_LINE',
        isActive: product.isActive
      });
      
      const formatString = product.accountFormat || 'Tài khoản|Mật khẩu';
      setFormatFieldsList(formatString.split('|').filter((f: string) => f.trim() !== ''));
      
      const attrs = product.attributes 
        ? Object.entries(product.attributes).map(([k, v]) => ({ key: k, value: String(v) })) 
        : [];
      setAttributeList(attrs);
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', 
        slug: '', 
        price: '',
        categoryId: categories.length > 0 ? categories[0].id.toString() : '',
        description: '', 
        deliveryMode: 'AUTO', 
        stockCount: '0',
        accountFormat: 'Tài khoản|Mật khẩu',
        displayType: 'MULTI_LINE',
        isActive: true 
      });
      setFormatFieldsList(['Tài khoản', 'Mật khẩu']);
      setAttributeList([]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Vui lòng chọn danh mục!');
      return;
    }
    const numericPrice = Number(formData.price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error('Giá sản phẩm phải lớn hơn 0!');
      return;
    }
    const numericStock = Number(formData.stockCount);
    if (formData.deliveryMode === 'MANUAL' &&
        (!Number.isInteger(numericStock) || numericStock < 0)) {
      toast.error('Tồn kho thủ công phải là số nguyên từ 0 trở lên!');
      return;
    }
    try {
      const attributesRecord = attributeList.reduce((acc, curr) => {
        if (curr.key.trim() && curr.value.trim()) {
            acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);
      const payload = { 
        ...formData, 
        price: formData.price.trim(),
        categoryId: Number(formData.categoryId), 
        stockCount: formData.deliveryMode === 'MANUAL' ? numericStock : undefined,
        attributes: attributesRecord,
        accountFormat: formatFieldsList.filter(f => f.trim() !== '').join('|') || 'Tài khoản'
      };
      if (editingId) {
        await updateProduct({ id: editingId, data: payload }).unwrap();
        toast.success('Đã cập nhật sản phẩm!');
      } else {
        await createProduct(payload).unwrap();
        toast.success('Đã thêm sản phẩm mới!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await deleteProduct(id).unwrap();
        toast.success('Đã xóa sản phẩm');
      } catch (err) {
        toast.error('Lỗi khi xóa sản phẩm');
      }
    }
  };

  const handleAddAttribute = () => {
    setAttributeList([...attributeList, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributeList(attributeList.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    const newList = [...attributeList];
    newList[index][field] = value;
    setAttributeList(newList);
  };

  const handleAddFormatField = () => {
    setFormatFieldsList([...formatFieldsList, '']);
  };

  const handleRemoveFormatField = (index: number) => {
    if (formatFieldsList.length > 1) {
      setFormatFieldsList(formatFieldsList.filter((_, i) => i !== index));
    }
  };

  const handleFormatFieldChange = (index: number, value: string) => {
    const newList = [...formatFieldsList];
    newList[index] = value;
    setFormatFieldsList(newList);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Sản phẩm</h1>
          <p className="text-gray-400 mt-1">Thêm, sửa, xóa các mặt hàng trong BotShop</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm theo tên, mô tả..." 
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
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="p-4 font-semibold text-slate-300">Sản phẩm</th>
                <th className="p-4 font-semibold text-slate-300">Giá (VND)</th>
                <th className="p-4 font-semibold text-slate-300">Tồn kho</th>
                <th className="p-4 font-semibold text-slate-300">Giao hàng</th>
                <th className="p-4 font-semibold text-slate-300">Trạng thái</th>
                <th className="p-4 font-semibold text-slate-300 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <Package size={48} className="mb-2 opacity-20" />
                      <p>Chưa có sản phẩm nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{product.name}</div>
                      <div className="text-xs text-slate-400">/{product.slug}</div>
                    </td>
                    <td className="p-4 text-blue-400 font-medium">{product.price.toLocaleString()}đ</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stockCount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {product.stockCount}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{product.deliveryMode === 'AUTO' ? 'Tự động' : 'Thủ công'}</td>
                    <td className="p-4">
                      {product.isActive ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 flex w-fit items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Đang bán
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 flex w-fit items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Tạm ngừng
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => setViewProductInfo(product)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 rounded transition-colors"
                        title="Sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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

      {/* Modal Thêm Sản Phẩm */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass w-full max-w-lg p-6 rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tên sản phẩm</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Mã (Slug)</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Danh mục</label>
                <select required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Giá (VNĐ)</label>
                <input required type="number" min="0.01" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Loại Giao Hàng</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" value={formData.deliveryMode} onChange={(e) => setFormData({...formData, deliveryMode: e.target.value as 'AUTO' | 'MANUAL'})}>
                  <option value="AUTO">Tự động (Giao tài khoản trong kho)</option>
                  <option value="MANUAL">Thủ công (Admin tự nhắn tin)</option>
                </select>
              </div>
              {formData.deliveryMode === 'MANUAL' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Tồn kho giao thủ công</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                  />
                </div>
              )}
              
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-300">Định dạng Kho (Cấu trúc Tài khoản)</label>
                  <button type="button" onClick={handleAddFormatField} className="text-blue-400 hover:text-blue-300 flex items-center text-xs space-x-1">
                    <PlusCircle size={14} />
                    <span>Thêm trường</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formatFieldsList.map((field, idx) => (
                    <div key={idx} className="flex space-x-2 items-center">
                      <div className="bg-slate-700/50 text-slate-400 px-3 py-1.5 rounded-lg text-sm font-mono shrink-0">
                        Cột {String.fromCharCode(65 + idx)}
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="Tên trường (vd: Tài khoản, Mật khẩu...)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        value={field}
                        onChange={(e) => handleFormatFieldChange(idx, e.target.value)}
                      />
                      {formatFieldsList.length > 1 && (
                        <button type="button" onClick={() => handleRemoveFormatField(idx)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                          <MinusCircle size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Kiểu trả cho khách</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" value={formData.displayType} onChange={(e) => setFormData({...formData, displayType: e.target.value as 'MULTI_LINE' | 'RAW'})}>
                  <option value="MULTI_LINE">Chi tiết nhiều dòng (Tài khoản: abc...)</option>
                  <option value="RAW">Một dòng thô (abc|123...)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer mt-2 bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-300">Trạng thái bán hàng</span>
                    <span className={`text-xs ${formData.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                      {formData.isActive ? 'Sản phẩm đang được mở bán' : 'Sản phẩm đang tạm ngừng bán'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Attributes Section */}
              <div className="pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-300">Thuộc tính tuỳ chỉnh (Tuỳ chọn)</label>
                  <button type="button" onClick={handleAddAttribute} className="text-blue-400 hover:text-blue-300 flex items-center text-xs space-x-1">
                    <PlusCircle size={14} />
                    <span>Thêm thuộc tính</span>
                  </button>
                </div>
                
                {attributeList.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">Chưa có thuộc tính nào. Có thể thêm Bảo hành, Định dạng...</div>
                ) : (
                  <div className="space-y-2">
                    {attributeList.map((attr, idx) => (
                      <div key={idx} className="flex space-x-2 items-start">
                        <input
                          type="text"
                          placeholder="Tên (vd: Bảo hành)"
                          className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          value={attr.key}
                          onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Giá trị (vd: 1 đổi 1)"
                          className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                        />
                        <button type="button" onClick={() => handleRemoveAttribute(idx)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors mt-0.5">
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isCreating} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg mt-6 disabled:opacity-50">
                {isCreating ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết Sản Phẩm */}
      {viewProductInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Box size={24} className="text-blue-400" />
                Chi Tiết Sản Phẩm
              </h2>
              <button onClick={() => setViewProductInfo(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-2 text-sm">
                  <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold border-b border-slate-700/50 pb-2">
                    <Package size={18} /> Thông Tin Chung
                  </div>
                  <p><span className="text-slate-400">Tên SP:</span> <span className="text-white font-medium">{viewProductInfo.name}</span></p>
                  <p><span className="text-slate-400">Mã (Slug):</span> <span className="text-white">{viewProductInfo.slug}</span></p>
                  <p><span className="text-slate-400">Giá:</span> <span className="text-green-400 font-bold">{viewProductInfo.price.toLocaleString()}đ</span></p>
                  <p><span className="text-slate-400">Danh mục ID:</span> <span className="text-white">{viewProductInfo.categoryId}</span></p>
                  <p>
                    <span className="text-slate-400">Trạng thái:</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${viewProductInfo.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {viewProductInfo.isActive ? 'Đang bán' : 'Đã ẩn'}
                    </span>
                  </p>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-2 text-sm">
                  <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold border-b border-slate-700/50 pb-2">
                    <Settings size={18} /> Kho & Giao Hàng
                  </div>
                  <p><span className="text-slate-400">Tồn kho:</span> <span className="text-white font-bold">{viewProductInfo.stockCount}</span></p>
                  <p><span className="text-slate-400">Kiểu giao:</span> <span className="text-white">{viewProductInfo.deliveryMode === 'AUTO' ? 'Tự động' : 'Thủ công'}</span></p>
                  <p><span className="text-slate-400">Kiểu trả KH:</span> <span className="text-white">{viewProductInfo.displayType === 'MULTI_LINE' ? 'Chi tiết nhiều dòng' : 'Một dòng thô'}</span></p>
                  
                  <div className="pt-2 mt-2 border-t border-slate-700/30">
                    <span className="text-slate-400 mb-1 block">Cấu trúc lưu kho:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(viewProductInfo.accountFormat || 'Tài khoản|Mật khẩu').split('|').map((col: string, idx: number) => (
                        <span key={idx} className="bg-slate-700 text-blue-300 px-2 py-0.5 rounded text-xs font-mono border border-slate-600">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {viewProductInfo.attributes && Object.keys(viewProductInfo.attributes).length > 0 && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold border-b border-slate-700/50 pb-2">
                    <Tag size={18} /> Thuộc tính tuỳ chỉnh
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {Object.entries(viewProductInfo.attributes).map(([key, val]) => (
                      <div key={key} className="flex bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50">
                        <div className="bg-slate-800 px-3 py-2 text-slate-400 font-medium whitespace-nowrap min-w-[100px]">
                          {key}
                        </div>
                        <div className="px-3 py-2 text-white flex-1 break-words">
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
