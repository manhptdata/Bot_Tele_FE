import React, { useState, useEffect } from 'react';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | '';
  onChange: (val: number | '') => void;
  suffix?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  suffix,
  className = '',
  placeholder,
  disabled,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  // Đồng bộ giá trị số từ props thành chuỗi có dấu chấm phân cách hàng nghìn
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('');
      return;
    }
    const num = typeof value === 'string' ? Number(value) : value;
    if (isNaN(num)) {
      setDisplayValue('');
    } else {
      setDisplayValue(num.toLocaleString('vi-VN'));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Loại bỏ tất cả ký tự không phải số
    const cleanNumbers = rawVal.replace(/\D/g, '');

    if (!cleanNumbers) {
      setDisplayValue('');
      onChange('');
      return;
    }

    const numericVal = parseInt(cleanNumbers, 10);
    setDisplayValue(numericVal.toLocaleString('vi-VN'));
    onChange(numericVal);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`${className} ${suffix ? 'pr-9' : ''}`}
        {...props}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-slate-400 text-xs font-semibold select-none font-mono">
            {suffix}
          </span>
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;
