import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check, RotateCcw } from 'lucide-react';

interface DateTimePickerProps {
  label?: string;
  value: string; // ISO format: YYYY-MM-DDTHH:mm or empty string
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string; // ISO format
  disabled?: boolean;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'dd/mm/yyyy --:--',
  minDate,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial state from value
  const parseValueToDate = (valStr: string): Date => {
    if (!valStr) return new Date();
    const d = new Date(valStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // State for current viewing month/year in calendar
  const [viewYear, setViewYear] = useState<number>(() => parseValueToDate(value).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => parseValueToDate(value).getMonth()); // 0 - 11

  // Temporary selected date and time inside popup before confirm
  const [tempDate, setTempDate] = useState<Date>(() => parseValueToDate(value));
  const [tempHour, setTempHour] = useState<number>(() => parseValueToDate(value).getHours());
  const [tempMinute, setTempMinute] = useState<number>(() => parseValueToDate(value).getMinutes());

  // Input text state for manual typing
  const formatForDisplay = (isoStr: string): string => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [inputValue, setInputValue] = useState<string>(() => formatForDisplay(value));

  // Sync internal states when external `value` prop changes
  useEffect(() => {
    setInputValue(formatForDisplay(value));
    if (value) {
      const d = parseValueToDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setTempDate(d);
      setTempHour(d.getHours());
      setTempMinute(d.getMinutes());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Convert Date & Hour & Minute into ISO string YYYY-MM-DDTHH:mm
  const formatToISOString = (d: Date, hour: number, minute: number): string => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const date = pad(d.getDate());
    const h = pad(hour);
    const m = pad(minute);
    return `${year}-${month}-${date}T${h}:${m}`;
  };

  // Handle manual typing in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    // Try parsing flexible formats: dd/mm/yyyy hh:mm or yyyy-mm-dd hh:mm or yyyy-mm-ddThh:mm
    const regex1 = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+|T)(\d{1,2}):(\d{1,2})$/;
    const regex2 = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+|T)(\d{1,2}):(\d{1,2})$/;

    let parsedYear = 0, parsedMonth = 0, parsedDay = 0, parsedHour = 0, parsedMin = 0;
    let match = text.match(regex1);
    if (match) {
      parsedDay = parseInt(match[1], 10);
      parsedMonth = parseInt(match[2], 10) - 1;
      parsedYear = parseInt(match[3], 10);
      parsedHour = parseInt(match[4], 10);
      parsedMin = parseInt(match[5], 10);
    } else {
      match = text.match(regex2);
      if (match) {
        parsedYear = parseInt(match[1], 10);
        parsedMonth = parseInt(match[2], 10) - 1;
        parsedDay = parseInt(match[3], 10);
        parsedHour = parseInt(match[4], 10);
        parsedMin = parseInt(match[5], 10);
      }
    }

    if (match) {
      if (parsedMonth >= 0 && parsedMonth < 12 && parsedDay >= 1 && parsedDay <= 31 && parsedHour >= 0 && parsedHour <= 23 && parsedMin >= 0 && parsedMin <= 59) {
        const d = new Date(parsedYear, parsedMonth, parsedDay, parsedHour, parsedMin);
        if (!isNaN(d.getTime())) {
          const iso = formatToISOString(d, parsedHour, parsedMin);
          onChange(iso);
          setTempDate(d);
          setTempHour(parsedHour);
          setTempMinute(parsedMin);
          setViewYear(parsedYear);
          setViewMonth(parsedMonth);
        }
      }
    }
  };

  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      onChange('');
    } else {
      // Revert to valid display value if input was unparsable
      setInputValue(formatForDisplay(value));
    }
  };

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Presets
  const applyPreset = (daysToAdd: number, endOfDay: boolean = false) => {
    const now = new Date();
    const target = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const hour = endOfDay ? 23 : target.getHours();
    const minute = endOfDay ? 59 : target.getMinutes();

    setTempDate(target);
    setTempHour(hour);
    setTempMinute(minute);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const applyEndOfMonth = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
    setTempDate(end);
    setTempHour(23);
    setTempMinute(59);
    setViewYear(end.getFullYear());
    setViewMonth(end.getMonth());
  };

  // Actions
  const handleConfirm = () => {
    const iso = formatToISOString(tempDate, tempHour, tempMinute);
    onChange(iso);
    setInputValue(formatForDisplay(iso));
    setIsOpen(false);
  };

  const handleReset = () => {
    onChange('');
    setInputValue('');
    setIsOpen(false);
  };

  // Generate calendar days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday, 1 = Monday...
  // Convert so 0 = Monday, 6 = Sunday
  const startOffset = (firstDayOfWeek + 6) % 7;

  const daysArray: { day: number; isCurrentMonth: boolean; dateObj: Date }[] = [];

  // Previous month padding
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
    daysArray.push({ day: prevMonthDays - i, isCurrentMonth: false, dateObj: d });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewYear, viewMonth, i);
    daysArray.push({ day: i, isCurrentMonth: true, dateObj: d });
  }

  // Next month padding to fill 35 or 42 grid
  const remaining = 35 - daysArray.length;
  const paddingCount = remaining >= 0 ? remaining : 42 - daysArray.length;
  for (let i = 1; i <= paddingCount; i++) {
    const d = new Date(viewYear, viewMonth + 1, i);
    daysArray.push({ day: i, isCurrentMonth: false, dateObj: d });
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isBeforeMinDate = (d: Date): boolean => {
    if (!minDate) return false;
    const min = new Date(minDate);
    if (isNaN(min.getTime())) return false;
    const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const minDay = new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime();
    return targetDay < minDay;
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Main Input Field */}
      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-16 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono disabled:opacity-50 transition-all"
        />

        {/* Left Calendar Icon */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 text-slate-400 hover:text-indigo-400 focus:outline-none transition-colors"
          title="Mở lịch chọn ngày giờ"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* Right Action Icons: Reset & Trigger */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-700/60 transition-colors"
              title="Xóa / Reset ngày này"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 rounded-md transition-colors ${
              isOpen ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Mở bộ chọn ngày giờ"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Popover Dropdown Picker */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 sm:left-auto sm:right-0 w-[330px] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/70 p-4 animate-in fade-in zoom-in-95 duration-150 text-white backdrop-blur-xl">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span className="text-indigo-400">{monthNames[viewMonth]}</span>
              <span className="text-slate-400">{viewYear}</span>
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 mb-3 pb-2.5 border-b border-slate-800">
            <button
              type="button"
              onClick={() => applyPreset(0)}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 rounded-md border border-slate-700/60 transition-colors"
            >
              Bây giờ
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7, true)}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 rounded-md border border-slate-700/60 transition-colors"
            >
              +7 Ngày
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30, true)}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 rounded-md border border-slate-700/60 transition-colors"
            >
              +30 Ngày
            </button>
            <button
              type="button"
              onClick={applyEndOfMonth}
              className="px-2 py-1 text-[11px] font-medium bg-slate-800 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 rounded-md border border-slate-700/60 transition-colors"
            >
              Hết tháng
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <span key={idx} className="text-[11px] font-semibold text-slate-400 py-1">
                {w}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {daysArray.map(({ day, isCurrentMonth, dateObj }, idx) => {
              const isSelected = isSameDay(dateObj, tempDate);
              const isToday = isSameDay(dateObj, new Date());
              const isDayDisabled = isBeforeMinDate(dateObj);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDayDisabled}
                  onClick={() => {
                    setTempDate(dateObj);
                    if (!isCurrentMonth) {
                      setViewYear(dateObj.getFullYear());
                      setViewMonth(dateObj.getMonth());
                    }
                  }}
                  className={`h-8 w-8 mx-auto flex items-center justify-center text-xs rounded-lg transition-all ${
                    isDayDisabled
                      ? 'text-slate-600 opacity-40 cursor-not-allowed bg-slate-900/50'
                      : isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40 scale-105'
                      : isToday
                      ? 'border border-indigo-400 text-indigo-400 hover:bg-slate-800 font-semibold'
                      : isCurrentMonth
                      ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-800/50 hover:text-slate-400'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section */}
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-2.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Thời gian:</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              {/* Hour select */}
              <select
                value={tempHour}
                onChange={(e) => setTempHour(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i < 10 ? '0' + i : i} giờ
                  </option>
                ))}
              </select>

              <span className="text-slate-400 font-bold">:</span>

              {/* Minute select */}
              <select
                value={tempMinute}
                onChange={(e) => setTempMinute(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i < 10 ? '0' + i : i} phút
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa / Reset</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
