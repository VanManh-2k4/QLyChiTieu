import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';

export function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc muốn tiếp tục?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      overlayClassName="bg-transparent"
      panelClassName="bg-gradient-to-br from-indigo-50 via-violet-50 to-white ring-1 ring-indigo-100"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
