import React, { useState } from 'react';
import { 
  useGetUsersQuery, 
  useCreateUserMutation, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
  useGetMeQuery 
} from '../api/userApi';
import { UserCog, Plus, Search, Edit2, ShieldAlert, Shield, Lock, Unlock, Eye, EyeOff, Phone, Send, MessageSquare, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminsPage = () => {
  const [page, setPage] = useState(0);
  const size = 10;
  const { data, isLoading } = useGetUsersQuery({ page, size });
  const { data: meData } = useGetMeQuery();
  
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'STAFF',
    isActive: true,
    phoneNumber: '',
    zalo: '',
    telegramUsername: '',
    isSupportContact: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  const currentUser = meData;

  // Access Control
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center animate-in fade-in zoom-in duration-300">
        <ShieldAlert size={64} className="text-red-400/50 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Truy cập bị từ chối</h2>
        <p>Bạn không có quyền truy cập vào trang Quản lý Admin.</p>
      </div>
    );
  }

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role,
        isActive: user.isActive,
        phoneNumber: user.phoneNumber || '',
        zalo: user.zalo || '',
        telegramUsername: user.telegramUsername || '',
        isSupportContact: user.isSupportContact !== undefined ? user.isSupportContact : true,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'STAFF',
        isActive: true,
        phoneNumber: '',
        zalo: '',
        telegramUsername: '',
        isSupportContact: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser({
          id: editingUser.id,
          data: {
            fullName: formData.fullName,
            email: formData.email,
            role: formData.role as any,
            isActive: formData.isActive,
            newPassword: formData.password || undefined,
            phoneNumber: formData.phoneNumber.trim() || undefined,
            zalo: formData.zalo.trim() || undefined,
            telegramUsername: formData.telegramUsername.trim() || undefined,
            isSupportContact: formData.isSupportContact,
          }
        }).unwrap();
        toast.success('Cập nhật tài khoản thành công!');
      } else {
        await createUser({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role as any,
          phoneNumber: formData.phoneNumber.trim() || undefined,
          zalo: formData.zalo.trim() || undefined,
          telegramUsername: formData.telegramUsername.trim() || undefined,
          isSupportContact: formData.isSupportContact,
        }).unwrap();
        toast.success('Thêm tài khoản thành công!');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggleActive = async (user: any) => {
    if (user.id === 1) {
      toast.error('Không thể khóa SUPER ADMIN!');
      return;
    }
    if (user.id === currentUser?.id) {
      toast.error('Bạn không thể tự khóa chính mình!');
      return;
    }
    if (currentUser?.id !== 1 && user.role === 'ADMIN') {
      toast.error('Bạn không có quyền khóa ADMIN khác!');
      return;
    }

    try {
      if (user.isActive) {
        if (window.confirm(`Bạn có chắc chắn muốn KHÓA tài khoản ${user.username}?`)) {
          await deleteUser(user.id).unwrap();
          toast.success('Đã khóa tài khoản!');
        }
      } else {
        await updateUser({
          id: user.id,
          data: {
            fullName: user.fullName,
            role: user.role,
            isActive: true
          }
        }).unwrap();
        toast.success('Đã mở khóa tài khoản!');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <UserCog className="text-blue-400" />
            Quản trị viên
          </h1>
          <p className="text-slate-400">Quản lý danh sách và phân quyền Admin/Staff</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          <span>Thêm tài khoản</span>
        </button>
      </div>

      <div className="flex-1 glass rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-slate-900/50">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-400 border-b border-[var(--border-color)]">Tài khoản</th>
                <th className="p-4 text-sm font-semibold text-gray-400 border-b border-[var(--border-color)]">Họ và tên</th>
                <th className="p-4 text-sm font-semibold text-gray-400 border-b border-[var(--border-color)]">Vai trò</th>
                <th className="p-4 text-sm font-semibold text-gray-400 border-b border-[var(--border-color)]">Liên hệ hỗ trợ</th>
                <th className="p-4 text-sm font-semibold text-gray-400 border-b border-[var(--border-color)]">Trạng thái</th>
                <th className="p-4 text-sm font-semibold text-gray-400 border-b border-[var(--border-color)] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">Đang tải...</td></tr>
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : (
                data?.content.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0 group">
                    <td className="p-4">
                      <div className="font-medium text-gray-200">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email || 'Chưa có email'}</div>
                    </td>
                    <td className="p-4 text-gray-300 font-medium">{user.fullName}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1 ${
                        user.id === 1 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        <Shield size={12} />
                        {user.id === 1 ? 'SUPER ADMIN' : user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone size={12} className="text-emerald-400" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                        {user.zalo && (
                          <div className="flex items-center gap-1.5 text-blue-400">
                            <MessageSquare size={12} className="text-blue-400" />
                            <span>Zalo: {user.zalo}</span>
                          </div>
                        )}
                        {user.telegramUsername && (
                          <div className="flex items-center gap-1.5 text-sky-400">
                            <Send size={12} className="text-sky-400" />
                            <span>Tele: {user.telegramUsername.startsWith('@') ? user.telegramUsername : `@${user.telegramUsername}`}</span>
                          </div>
                        )}
                        {!user.phoneNumber && !user.zalo && !user.telegramUsername && (
                          <span className="text-slate-500 italic">Chưa cài đặt</span>
                        )}
                        <div className="mt-0.5">
                          {user.isSupportContact ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Headphones size={10} /> Hiện trên Bot
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700">
                              Ẩn trên Bot
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded"
                          title="Sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded ${
                            user.isActive 
                              ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' 
                              : 'text-slate-400 hover:text-green-400 hover:bg-slate-800'
                          }`}
                          title={user.isActive ? "Khóa" : "Mở khóa"}
                        >
                          {user.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[var(--border-color)] flex justify-between items-center bg-slate-900/50 text-sm text-gray-400">
          <div>
            Trang {page + 1} / {data?.totalPages || 1}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= (data?.totalPages || 1) - 1}
              className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden slide-in-from-bottom-8 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCog className="text-blue-400" size={22} />
                {editingUser ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="VD: admin_shop"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">
                    Mật khẩu {editingUser && '(Bỏ trống nếu không đổi)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-medium">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="STAFF">Nhân viên (STAFF)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Thông tin liên hệ hỗ trợ */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                  <Headphones size={16} />
                  <span>Thông tin liên hệ & Hỗ trợ khách hàng</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Phone size={12} className="text-emerald-400" />
                      Số điện thoại (SĐT)
                    </label>
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="VD: 0912345678"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <MessageSquare size={12} className="text-blue-400" />
                      Zalo (Số điện thoại hoặc link)
                    </label>
                    <input
                      type="text"
                      value={formData.zalo}
                      onChange={e => setFormData({...formData, zalo: e.target.value})}
                      placeholder="VD: 0912345678"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Send size={12} className="text-sky-400" />
                    Telegram Username (để khách hàng liên hệ)
                  </label>
                  <input
                    type="text"
                    value={formData.telegramUsername}
                    onChange={e => setFormData({...formData, telegramUsername: e.target.value})}
                    placeholder="VD: @admin_support hoặc admin_support"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    id="isSupportContact"
                    checked={formData.isSupportContact}
                    onChange={e => setFormData({...formData, isSupportContact: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="isSupportContact" className="text-xs text-slate-300 cursor-pointer">
                    <span className="font-medium text-white block">Hiển thị làm liên hệ hỗ trợ trên Telegram Bot</span>
                    Khách hàng sẽ thấy thông tin admin này khi bấm nút "Liên hệ Admin" trên bot
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20 text-sm"
                >
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
