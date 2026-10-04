import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Smile, X, Sparkles, Copy, Check, Send, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// Danh sách các Custom Emoji Telegram phổ biến cho shop tài khoản / MMO
export interface CustomEmojiPreset {
  label: string;
  id: string;
  icon: string;
}

export const TELEGRAM_CUSTOM_PRESETS: CustomEmojiPreset[] = [
  { label: 'Netflix', id: '5368324170671202286', icon: '🔴' },
  { label: 'Spotify', id: '5370817088187289886', icon: '🟢' },
  { label: 'YouTube', id: '5371077749450493863', icon: '▶️' },
  { label: 'Canva', id: '5370908867351825595', icon: '🎨' },
  { label: 'ChatGPT', id: '5373030386613898236', icon: '🤖' },
  { label: 'Steam', id: '5372863784840879685', icon: '🎮' },
  { label: 'Sale', id: '5373059154288065551', icon: '🏷️' },
  { label: 'Nạp nhanh', id: '5373110294472049969', icon: '⚡' },
  { label: 'Sao VIP', id: '5373084898129107936', icon: '⭐' },
  { label: 'Quà tặng', id: '5373151328606368817', icon: '🎁' },
  { label: 'Bảo hành', id: '5373169728229487212', icon: '🛡️' },
  { label: 'Lửa Hot', id: '5373187247384310891', icon: '🔥' },
];

export const GlobalEmojiPicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'unicode'>('custom');
  const [customIdInput, setCustomIdInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const lastActiveElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 1. Theo dõi con trỏ chuột: Lưu lại ô input/textarea cuối cùng mà admin vừa click vào
  // CHÚ Ý: Bỏ qua nếu click vào các ô input nằm BÊN TRONG chính cái popup picker này!
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (pickerRef.current && pickerRef.current.contains(target as Node)) {
        return; // Không cướp focus nếu đang thao tác trong popup
      }
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        lastActiveElementRef.current = target;
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  // 2. Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 3. Hàm xử lý chèn Emoji trực tiếp vào ô đang focus
  const handleInsertEmoji = (emojiOrShortcode: string) => {
    const el = lastActiveElementRef.current;
    
    // Kiểm tra xem ô đang focus có phải ô nhập ID thô (ví dụ ô iconCustomEmojiId ở Sản phẩm / Danh mục)
    let textToInsert = emojiOrShortcode;
    if (el) {
      const isIdField =
        el.placeholder?.toLowerCase().includes('ví dụ: 5368') ||
        el.placeholder?.toLowerCase().includes('custom_emoji_id') ||
        el.name?.toLowerCase().includes('emoji') ||
        el.id?.toLowerCase().includes('emoji');

      // Nếu là ô nhập ID mà text lại là shortcode [e:ID] -> bóc lấy ID số thuần
      if (isIdField && textToInsert.startsWith('[e:') && textToInsert.endsWith(']')) {
        textToInsert = textToInsert.substring(3, textToInsert.length - 1);
      }
    }

    // Luôn sao chép vào bộ nhớ đệm (Clipboard) để phòng hờ
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToInsert).catch(() => {});
    }

    if (el && document.body.contains(el)) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const originalValue = el.value;

      // Tính toán chuỗi mới sau khi chèn
      const newValue = originalValue.substring(0, start) + textToInsert + originalValue.substring(end);

      // Xử lý tương thích với React Controlled Components
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

      if (el instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(el, newValue);
      } else if (el instanceof HTMLInputElement && nativeInputValueSetter) {
        nativeInputValueSetter.call(el, newValue);
      } else {
        el.value = newValue;
      }

      // Kích hoạt event input để React nhận diện cập nhật state
      const event = new Event('input', { bubbles: true });
      el.dispatchEvent(event);

      // Đặt lại vị trí con trỏ chuột ngay sau ký tự vừa chèn
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 0);

      toast.success(`Đã chèn và copy "${textToInsert}"!`, { duration: 2000, id: 'emoji-toast' });
    } else {
      toast.success(`Đã copy "${textToInsert}"! Bạn có thể bấm Ctrl+V để dán`, { duration: 2500, id: 'emoji-toast' });
    }
  };

  // 4. Cơ chế Copy-First: Sao chép đúng mẫu [e:ID] vào Clipboard
  const handleCopyFormattedCode = () => {
    const trimmed = customIdInput.trim();
    if (!trimmed) return;
    const formattedCode = `[e:${trimmed}]`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formattedCode);
    }
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
    toast.success(`Đã sao chép "${formattedCode}"! Giờ bạn chỉ cần bấm Ctrl+V để dán`, {
      duration: 3000,
      id: 'copy-formatted',
    });
  };

  // 5. Bấm vào icon có sẵn: Vừa copy [e:ID] vừa thử chèn vào ô đang gõ
  const handlePickCustomEmoji = (item: CustomEmojiPreset) => {
    const code = `[e:${item.id}]`;
    handleInsertEmoji(code);
  };

  const handleCopyIdOnly = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success(`Đã sao chép ID: ${id}`, { duration: 1500, id: 'copy-toast' });
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    handleInsertEmoji(emojiData.emoji);
  };

  const formattedPreview = customIdInput.trim() ? `[e:${customIdInput.trim()}]` : '[e:DÃY_SỐ_ID]';

  return (
    <div ref={pickerRef} className="fixed bottom-6 right-6 z-50">
      {/* Nút bấm tròn mở Widget */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Mở bảng Emoji Telegram"
        className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-red-500 text-white rotate-90'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/50'
        }`}
      >
        {isOpen ? <X size={22} /> : <Smile size={24} />}
      </button>

      {/* Bảng Popup chọn Emoji */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] sm:w-[390px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Widget & Tabs */}
          <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Kho Emoji Telegram</span>
            </div>
            
            {/* Tab switch */}
            <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  activeTab === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send size={12} />
                <span>Tele Custom</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unicode')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  activeTab === 'unicode'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smile size={12} />
                <span>Icon Thường</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TELEGRAM CUSTOM EMOJI */}
          {activeTab === 'custom' && (
            <div className="p-3 space-y-3 max-h-[460px] overflow-y-auto">
              {/* BỘ TẠO & SAO CHÉP MÃ CHUẨN [e:ID] */}
              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Dán ID icon vào đây để lấy mã:
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">Chuẩn: [e:ID]</span>
                </div>

                <input
                  type="text"
                  placeholder="Dán ID từ bot (vd: 5368324170671202286)"
                  value={customIdInput}
                  onChange={(e) => setCustomIdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
                />

                {/* Box hiển thị mã chuẩn & nút Sao chép to rõ */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex-1 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700/80 font-mono text-xs text-blue-300 font-semibold truncate select-all">
                    {formattedPreview}
                  </div>

                  {/* NÚT SAO CHÉP CHÍNH (COPY-FIRST) */}
                  <button
                    type="button"
                    onClick={handleCopyFormattedCode}
                    disabled={!customIdInput.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0 active:scale-95"
                    title="Bấm để copy mã [e:ID] vào bộ nhớ tạm rồi Ctrl+V vào bài viết"
                  >
                    {isCopiedCode ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                    <span>{isCopiedCode ? 'Đã copy!' : 'Sao chép mã'}</span>
                  </button>

                  {/* Nút phụ: Thử chèn trực tiếp */}
                  <button
                    type="button"
                    onClick={() => handleInsertEmoji(`[e:${customIdInput.trim()}]`)}
                    disabled={!customIdInput.trim()}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 rounded-lg text-xs transition-all shrink-0"
                    title="Tự động điền vào ô văn bản đang gõ"
                  >
                    <Zap size={13} className="text-yellow-400" />
                  </button>
                </div>
              </div>

              {/* Danh sách icon thương hiệu thông dụng */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Icon Hot Của Shop (Click là tự copy [e:ID])
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TELEGRAM_CUSTOM_PRESETS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handlePickCustomEmoji(item)}
                      className="group flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 cursor-pointer transition-all text-xs"
                      title={`Click để tự động copy mã [e:${item.id}]`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <div className="text-slate-200 truncate font-semibold text-[11px]">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono truncate">
                            [e:{item.id.substring(0, 5)}...]
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyIdOnly(e, item.id)}
                        className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition-opacity"
                        title="Chỉ sao chép ID số thuần"
                      >
                        {copiedId === item.id ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 space-y-1">
                <p className="text-blue-400 font-medium">📋 <b>Cách dùng đơn giản nhất:</b></p>
                <p>1. Bấm vào icon bạn thích (hoặc dán ID mới rồi bấm <b>Sao chép mã</b>).</p>
                <p>2. Quay lại ô soạn tin và bấm <b>Ctrl + V</b> để dán mã vào bài viết!</p>
              </div>
            </div>
          )}

          {/* TAB 2: UNICODE EMOJI PICKER */}
          {activeTab === 'unicode' && (
            <div className="emoji-picker-container">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                lazyLoadEmojis={true}
                searchPlaceholder="Tìm kiếm emoji (vd: fire, netflix, robot...)"
                width="100%"
                height={380}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
