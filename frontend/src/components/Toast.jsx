/**
 * Toast Notification Component
 * Displays success/error messages with auto-dismiss
 * @module components/Toast
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

/**
 * @typedef {Object} ToastProps
 * @property {string} type - 'success' | 'error' | 'warning' | 'info'
 * @property {string} message - Message to display
 * @property {number} [duration] - Auto-dismiss duration in ms (default: 5000)
 * @property {Function} onClose - Callback when toast closes
 */

/**
 * Toast component
 * @param {ToastProps} props
 * @returns {JSX.Element}
 */
export function Toast({ type = 'info', message, duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  const Icon = icons[type];

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        rounded-xl border-2 p-4 shadow-lg
        flex items-start gap-3
        ${colors[type]}
      `}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast Container Component
 * Manages multiple toasts
 * @module components/Toast
 */

/**
 * @typedef {Object} ToastItem
 * @property {string} id - Unique toast ID
 * @property {string} type - Toast type
 * @property {string} message - Toast message
 * @property {number} duration - Auto-dismiss duration
 */

/**
 * Toast container
 * @param {Object} props
 * @property {ToastItem[]} toasts - Array of toasts
 * @property {Function} removeToast - Function to remove toast
 * @returns {JSX.Element}
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Toast Hook
 * Provides toast functionality
 * @module hooks/useToast
 */

/**
 * @typedef {Object} UseToastReturn
 * @property {ToastItem[]} toasts - Array of active toasts
 * @property {Function} showToast - Function to show toast
 * @property {Function} removeToast - Function to remove toast
 * @property {Function} showSuccess - Function to show success toast
 * @property {Function} showError - Function to show error toast
 * @property {Function} showWarning - Function to show warning toast
 * @property {Function} showInfo - Function to show info toast
 */

/**
 * Custom hook for toast notifications
 * @returns {UseToastReturn}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message, duration = 5000) => {
    const id = Date.now().toString();
    const newToast = { id, type, message, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (message, duration) => showToast('success', message, duration);
  const showError = (message, duration) => showToast('error', message, duration);
  const showWarning = (message, duration) => showToast('warning', message, duration);
  const showInfo = (message, duration) => showToast('info', message, duration);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
