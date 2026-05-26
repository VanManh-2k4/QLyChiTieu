import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
  overlayClassName = 'bg-white/45 backdrop-blur-xl backdrop-saturate-150',
  panelClassName = 'bg-white ring-1 ring-slate-200',
  maxWidthClassName = 'max-w-2xl',
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        type="button"
        className={`absolute inset-0 ${overlayClassName}`}
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        className={`relative z-10 my-4 flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-x-hidden rounded-2xl p-4 shadow-2xl sm:p-6 ${maxWidthClassName} ${panelClassName}`}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between sm:mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
