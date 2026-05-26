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
