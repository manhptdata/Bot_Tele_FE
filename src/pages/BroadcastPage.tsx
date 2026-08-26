import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSendBroadcastMutation } from '../api/broadcastApi';

export const BroadcastPage = () => {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sendBroadcast, { isLoading }] = useSendBroadcastMutation();

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo');
      return;
    }

    if (imageUrl.trim()) {
      const trimmedUrl = imageUrl.trim();
      if (trimmedUrl.startsWith('data:image') || trimmedUrl.length > 2000) {
        toast.error('❌ Lỗi: Bạn đang dán mã Base64! Vui lòng dùng link ảnh thật.');
        return;
      }
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        toast.error('❌ Lỗi: Link hình ảnh phải bắt đầu bằng http:// hoặc https://');
        return;
      }
    }

    if (window.confirm('CẢNH BÁO: Hành động này sẽ gửi tin nhắn đến TOÀN BỘ khách hàng. Bạn có chắc chắn muốn gửi không?')) {
      try {
        const response = await sendBroadcast({ message, imageUrl }).unwrap();
        toast.success(response.message || 'Đã bắt đầu phát sóng thông báo!');
        setMessage('');
        setImageUrl('');
      } catch (err: any) {
        toast.error(err.data?.message || 'Có lỗi xảy ra khi phát sóng');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Phát sóng Thông báo (Broadcast)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Soạn nội dung</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nội dung tin nhắn (*)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              placeholder="Nhập thông báo gửi tới toàn bộ khách hàng... Hỗ trợ in đậm (*chữ*), in nghiêng (_chữ_)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Link Hình Ảnh (Tùy chọn)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/banner.jpg"
            />
            <p className="text-xs text-slate-400 mt-2">
              Nếu nhập Link Ảnh, khách hàng sẽ nhận được 1 ảnh kèm theo nội dung mô tả bên dưới.
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className="w-full py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/50 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            Phát sóng toàn hệ thống
          </button>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Xem trước (Preview)</h2>
          <div className="bg-[#18222d] border border-slate-700 rounded-xl p-4 max-w-sm mx-auto shadow-2xl relative">
            {/* Fake Chat Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                B
              </div>
              <div>
                <div className="text-white font-semibold text-sm">BotShop</div>
                <div className="text-blue-400 text-xs">bot</div>
              </div>
            </div>

            {/* Message Bubble */}
            <div className="flex flex-col gap-2">
              {(message || imageUrl) ? (
                <div className="bg-[#213040] rounded-2xl rounded-tl-sm p-3 inline-block self-start max-w-[90%]">
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="rounded-lg mb-2 max-w-full h-auto object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=L%E1%BB%97i+T%E1%BA%A3i+%E1%BA%A2nh';
                      }}
                    />
                  )}
                  {message && (
                    <div className="text-white text-sm whitespace-pre-wrap break-words">
                      {message}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 text-right mt-1">10:00 AM</div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm text-center py-10 italic">
                  Chưa có nội dung để xem trước
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
