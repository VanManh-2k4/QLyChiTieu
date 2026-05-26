import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

const DEFAULT_OPTIONS = {
  title: 'Xác nhận thao tác',
  message: 'Bạn có chắc muốn tiếp tục?',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  variant: 'danger',
};

export function useConfirm() {
  const [config, setConfig] = useState({
    open: false,
    ...DEFAULT_OPTIONS,
    resolver: null,
  });

  const closeWith = (result) => {
    if (typeof config.resolver === 'function') {
      config.resolver(result);
    }
    setConfig((prev) => ({ ...prev, open: false, resolver: null }));
  };

  const confirm = (options = {}) =>
    new Promise((resolve) => {
      setConfig({
        open: true,
        ...DEFAULT_OPTIONS,
        ...options,
        resolver: resolve,
      });
    });

  const confirmModal = useMemo(
    () => (
      <ConfirmDialog
        open={config.open}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant}
        onConfirm={() => closeWith(true)}
        onCancel={() => closeWith(false)}
      />
    ),
    [config]
  );

  return { confirm, confirmModal };
}
