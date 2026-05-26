export function toSqlDate(v) {
  if (v == null || v === '') return undefined;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  const s = String(v);
  return s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
}
