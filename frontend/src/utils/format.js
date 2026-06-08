export function formatVND(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export function formatNumberInput(value, { allowDecimal = false } = {}) {
  if (value === null || value === undefined) return '';
  const raw = String(value).replace(/,/g, '');
  if (!raw) return '';

  if (!allowDecimal) {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const cleaned = raw.replace(/[^\d.]/g, '');
  const [intRaw = '', ...rest] = cleaned.split('.');
  const decimalRaw = rest.join('');
  const intDigits = intRaw.replace(/\D/g, '');
  if (!intDigits && !decimalRaw) return '';
  const formattedInt = (intDigits || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalRaw ? `${formattedInt}.${decimalRaw.slice(0, 2)}` : formattedInt;
}

export function unformatNumberInput(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/,/g, '').trim();
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nowLocalDateTime() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Hiển thị thời gian thực cho thông báo mới (dưới 5 phút)
  if (diffInSeconds < 300) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Hiển thị relative time cho thông báo cũ hơn
  if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
}
