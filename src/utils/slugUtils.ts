/**
 * Danh sách các từ đệm, từ bổ trợ hay gặp trong tên sản phẩm/dịch vụ số
 */
const STOP_WORDS = [
  'tai-khoan', 'acc', 'goi', 'dich-vu', 'combo', 'slot', 
  'key', 'ban-quyen', 'chinh-chu', 'gia-re', 'vinh-vien',
  'premium', 'pro', 'plus', 'vip', '1-thang', '1-nam', '1-year', '1-month'
];

/**
 * Sinh mã slug thông minh siêu ngắn gọn theo công thức: [prefix]-[3 số ngẫu nhiên]
 * Ví dụ: "Tài khoản Netflix Premium 1 Tháng" -> "netflix-482"
 */
export const generateShortSlug = (name: string): string => {
  if (!name || !name.trim()) return '';

  // 1. Chuyển tiếng Việt có dấu -> không dấu, chữ thường, bỏ ký tự đặc biệt
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  // 2. Tách các từ và lọc bỏ stop words để lấy từ khóa cốt lõi
  const words = clean.split('-').filter((w) => w.length > 0);
  const meaningfulWords = words.filter((w) => !STOP_WORDS.includes(w));

  // Lấy từ khóa đại diện (tối đa 10 ký tự)
  let prefix = meaningfulWords.length > 0 ? meaningfulWords.slice(0, 2).join('') : (words[0] || 'sp');
  if (prefix.length > 10) {
    prefix = prefix.substring(0, 10);
  }

  // 3. Tạo 3 số ngẫu nhiên (100 -> 999)
  const randomSuffix = Math.floor(100 + Math.random() * 900);

  return `${prefix}-${randomSuffix}`;
};
