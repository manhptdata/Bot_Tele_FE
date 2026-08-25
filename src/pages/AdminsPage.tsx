import React, { useState } from 'react';
import { 
  useGetUsersQuery, 
  useCreateUserMutation, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
  useRestoreUserMutation,
  useHardDeleteUserMutation,
  useGetMeQuery 
} from '../api/userApi';
import { 
  UserCog, 
  Plus, 
  Search, 
  Edit2, 
  ShieldAlert, 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Phone, 
  Send, 
  MessageSquare, 
  Headphones,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminsPage = () => {
  const [page, setPage] = useState(0);
  const size = 10;
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED' | 'TRASH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useGetUsersQuery({ page, size, status: statusFilter });
  const { data: meData } = useGetMeQuery();
  
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [restoreUser] = useRestoreUserMutation();
  const [hardDeleteUser] = useHardDeleteUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  // Step-up Auth Modal State for Trash / Restore / HardDelete
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'TRASH' | 'RESTORE' | 'HARD_DELETE';
    user: any | null;
  }>({
    isOpen: false,
    type: 'TRASH',
    user: null,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

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

  const isCreatingAdmin = !editingUser && formData.role === 'ADMIN';
  const isPromotingToAdmin = Boolean(editingUser && editingUser.role !== 'ADMIN' && formData.role === 'ADMIN');
  const isResettingPassword = Boolean(editingUser && formData.password.trim() !== '');
  const isSensitiveAction = isCreatingAdmin || isPromotingToAdmin || isResettingPassword;

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
    setAdminPassword('');
    setShowAdminPassword(false);
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

    if (isSensitiveAction && !adminPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu xác nhận của bạn.');
      return;
    }

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
            adminPassword: adminPassword.trim() || undefined,
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
          adminPassword: adminPassword.trim() || undefined,
        }).unwrap();
        toast.success('Thêm tài khoản thành công!');
      }
      setAdminPassword('');
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
      const nextActive = !user.isActive;
      await updateUser({
        id: user.id,
        data: {
          fullName: user.fullName,
          role: user.role,
          isActive: nextActive,
        }
      }).unwrap();
      toast.success(nextActive ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Mở modal xác thực mật khẩu Super Admin cho thao tác Thùng rác
  const openConfirmModal = (type: 'TRASH' | 'RESTORE' | 'HARD_DELETE', user: any) => {
    setConfirmPassword('');
    setShowConfirmPassword(false);
    setConfirmModal({
      isOpen: true,
      type,
      user,
    });
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu xác nhận của Super Admin');
      return;
    }

    const { type, user } = confirmModal;
    if (!user) return;

    setIsSubmittingConfirm(true);
    try {
      if (type === 'TRASH') {
        await deleteUser({
          id: user.id,
          data: { adminPassword: confirmPassword.trim() }
        }).unwrap();
        toast.success(`Đã chuyển tài khoản ${user.username} vào Thùng rác!`);
      } else if (type === 'RESTORE') {
        await restoreUser({
          id: user.id,
          data: { adminPassword: confirmPassword.trim() }
        }).unwrap();
        toast.success(`Đã khôi phục tài khoản ${user.username} thành công!`);
      } else if (type === 'HARD_DELETE') {
        await hardDeleteUser({
          id: user.id,
          data: { adminPassword: confirmPassword.trim() }
        }).unwrap();
        toast.success(`Đã XÓA VĨNH VIỄN tài khoản ${user.username} khỏi hệ thống!`);
      }
      setConfirmModal({ isOpen: false, type: 'TRASH', user: null });
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Thao tác không thành công');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  const filteredUsers = (data?.content || []).filter(u => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.fullName && u.fullName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phoneNumber && u.phoneNumber.includes(term))
    );
  });

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
        {currentUser?.id === 1 && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            <span>Thêm tài khoản</span>
          </button>
        )}
      </div>

      <div className="flex-1 glass rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col">
        {/* Toolbar with Search and Status Tabs */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => {
                  setStatusFilter('ACTIVE');
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đang hoạt động
              </button>
              <button
                onClick={() => {
                  setStatusFilter('LOCKED');
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'LOCKED'
                    ? 'bg-rose-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đã khóa
              </button>
              <button
                onClick={() => {
                  setStatusFilter('TRASH');
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  statusFilter === 'TRASH'
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
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">Không có dữ liệu</td></tr>
              ) : (
                filteredUsers.map((user) => (
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
                      {statusFilter === 'TRASH' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Đã xóa
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {statusFilter === 'TRASH' ? (
                          currentUser?.id === 1 && (
                            <>
                              <button
                                onClick={() => openConfirmModal('RESTORE', user)}
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                                title="Khôi phục tài khoản"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button
                                onClick={() => openConfirmModal('HARD_DELETE', user)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                                title="Xóa vĩnh viễn khỏi Database"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                              title="Sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            {user.id !== 1 && (
                              <button
                                onClick={() => handleToggleActive(user)}
                                className={`p-1.5 rounded transition-colors ${
                                  user.isActive 
                                    ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' 
                                    : 'text-slate-400 hover:text-green-400 hover:bg-slate-800'
                                }`}
                                title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              >
                                {user.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                              </button>
                            )}
                            {currentUser?.id === 1 && user.id !== 1 && (
                              <button
                                onClick={() => openConfirmModal('TRASH', user)}
                                className="p-1.5 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                title="Chuyển vào Thùng rác"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
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

      {/* Form Modal Create / Edit */}
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white disabled:opacity-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {editingUser ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="VD: 0912345678"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Số Zalo hỗ trợ</label>
                  <input
                    type="text"
                    placeholder="VD: 0912345678"
                    value={formData.zalo}
                    onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username Telegram hỗ trợ</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="VD: support_admin (không cần gõ @)"
                    value={formData.telegramUsername}
                    onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value.replace(/^@/, '') })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">@</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Khách bấm liên hệ sẽ được mở chat trực tiếp tới username này.</p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 cursor-pointer hover:bg-slate-800/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isSupportContact}
                    onChange={(e) => setFormData({ ...formData, isSupportContact: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500/40 bg-slate-700"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-200 block">Hiển thị trong danh bạ hỗ trợ trên Bot</span>
                    <span className="text-xs text-slate-400">Khi bật, thông tin liên hệ của tài khoản này sẽ được hiển thị khi khách bấm nút "Hỗ trợ" trên Bot Telegram.</span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Vai trò</label>
                  <select
                    value={formData.role}
                    disabled={editingUser?.id === 1}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="STAFF">STAFF (Nhân viên)</option>
                    <option value="ADMIN">ADMIN (Quản trị viên)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Trạng thái</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    disabled={editingUser?.id === 1}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Khóa</option>
                  </select>
                </div>
              </div>

              {/* Step-Up Password Verification Box */}
              {isSensitiveAction && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Shield size={14} className="text-amber-400" />
                    Mật khẩu xác nhận của bạn <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu của bạn để xác nhận hành động..."
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 pr-9"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-200/80 leading-relaxed">
                    {isCreatingAdmin && "Bắt buộc xác thực mật khẩu Super Admin khi tạo tài khoản ADMIN mới."}
                    {isPromotingToAdmin && "Bắt buộc xác thực mật khẩu khi nâng quyền nhân viên lên ADMIN."}
                    {isResettingPassword && !isPromotingToAdmin && "Bắt buộc xác thực mật khẩu khi đặt lại mật khẩu cho tài khoản này."}
                  </p>
                </div>
              )}

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

      {/* Super Admin Step-up Auth Confirmation Modal for Trash / Restore / Hard Delete */}
      {confirmModal.isOpen && confirmModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="glass w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden slide-in-from-bottom-8">
            <div className={`p-5 border-b border-slate-700 flex items-center gap-3 ${
              confirmModal.type === 'HARD_DELETE' ? 'bg-rose-950/40 text-rose-400' :
              confirmModal.type === 'TRASH' ? 'bg-amber-950/40 text-amber-400' :
              'bg-emerald-950/40 text-emerald-400'
            }`}>
              <AlertTriangle size={24} />
              <h2 className="text-lg font-bold text-white">
                {confirmModal.type === 'TRASH' && 'Chuyển vào Thùng rác'}
                {confirmModal.type === 'RESTORE' && 'Khôi phục tài khoản'}
                {confirmModal.type === 'HARD_DELETE' && 'Xác nhận XÓA VĨNH VIỄN'}
              </h2>
            </div>

            <form onSubmit={handleConfirmAction} className="p-6 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {confirmModal.type === 'TRASH' && (
                  <>Bạn đang yêu cầu chuyển tài khoản <strong className="text-white">"{confirmModal.user.username}"</strong> vào Thùng rác. Tài khoản này sẽ bị vô hiệu hóa ngay lập tức.</>
                )}
                {confirmModal.type === 'RESTORE' && (
                  <>Bạn đang yêu cầu khôi phục tài khoản <strong className="text-white">"{confirmModal.user.username}"</strong> từ Thùng rác về danh sách hoạt động.</>
                )}
                {confirmModal.type === 'HARD_DELETE' && (
                  <>⚠️ <strong className="text-rose-400">CẢNH BÁO NGUY HIỂM:</strong> Bạn đang yêu cầu XÓA VĨNH VIỄN tài khoản <strong className="text-white">"{confirmModal.user.username}"</strong> khỏi Database. Hệ thống sẽ kiểm tra lịch sử nhập kho và kiểm toán.</>
                )}
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-400" />
                  Mật khẩu Super Admin của bạn <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu Super Admin để xác nhận..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-2 text-white text-sm focus:outline-none pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmittingConfirm}
                  onClick={() => setConfirmModal({ isOpen: false, type: 'TRASH', user: null })}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConfirm}
                  className={`px-5 py-2 rounded-lg font-medium text-sm text-white transition-all shadow-lg ${
                    confirmModal.type === 'HARD_DELETE' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' :
                    confirmModal.type === 'TRASH' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' :
                    'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  }`}
                >
                  {isSubmittingConfirm ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
