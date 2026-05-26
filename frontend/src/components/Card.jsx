export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}
