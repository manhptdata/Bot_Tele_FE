import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Smile, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// Danh sách các Icon thương hiệu MMO / Shop tài khoản phổ biến nhất
const BRAND_PRESETS = [
  { label: 'Netflix', icon: '🔴' },
  { label: 'ChatGPT', icon: '🤖' },
  { label: 'Spotify', icon: '🟢' },
  { label: 'Youtube', icon: '▶️' },
  { label: 'Canva', icon: '🎨' },
  { label: 'Office/Win', icon: '🏢' },
  { label: 'VPN', icon: '🛡️' },
  { label: 'Gemini', icon: '💎' },
  { label: 'Elsa', icon: '🗣️' },
  { label: 'Zoom', icon: '📹' },
  { label: 'Capcut', icon: '🎬' },
  { label: 'Code/Dev', icon: '⚡' },
];

export const GlobalEmojiPicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const lastActiveElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 1. Theo dõi con trỏ chuột: Lưu lại ô input/textarea cuối cùng mà admin vừa click vào
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
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

  // 3. Hàm xử lý chèn Emoji vào ô nhập liệu hoặc Copy vào Clipboard
  const handleInsertEmoji = (emoji: string) => {
    const el = lastActiveElementRef.current;
    
    // Copy vào bộ nhớ đệm (Clipboard)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(emoji).catch(() => {});
    }

    if (el && document.body.contains(el)) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const originalValue = el.value;

      // Tính toán chuỗi mới sau khi chèn emoji
      const newValue = originalValue.substring(0, start) + emoji + originalValue.substring(end);

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

      // Kích hoạt event input để React Hook Form / useState nhận diện cập nhật state
      const event = new Event('input', { bubbles: true });
      el.dispatchEvent(event);

      // Đặt lại vị trí con trỏ chuột ngay sau ký tự emoji vừa chèn
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);

      toast.success(`Đã chèn ${emoji} vào ô nhập!`, { duration: 1500, id: 'emoji-toast' });
    } else {
      toast.success(`Đã copy ${emoji} vào Clipboard!`, { duration: 1500, id: 'emoji-toast' });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    handleInsertEmoji(emojiData.emoji);
  };

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
        <div className="absolute bottom-16 right-0 w-[350px] sm:w-[380px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Widget */}
          <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Emoji Telegram Picker</span>
            </div>
            <span className="text-xs text-slate-400">Click để chèn / copy</span>
          </div>

          {/* Thanh Icon thương hiệu nhanh */}
          <div className="p-2 bg-slate-800/40 border-b border-slate-700/60 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {BRAND_PRESETS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleInsertEmoji(item.icon)}
                className="px-2 py-1 bg-slate-700/60 hover:bg-blue-600/80 text-xs text-slate-200 rounded-md transition-colors flex items-center gap-1 border border-slate-600/40"
                title={`Chèn ${item.label}`}
              >
                <span>{item.icon}</span>
                <span className="truncate max-w-[70px]">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Thư viện Emoji đầy đủ */}
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
        </div>
      )}
    </div>
  );
};
