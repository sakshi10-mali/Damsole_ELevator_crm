"use client";

import { useEffect, useState } from "react";
import { IoClose, IoCheckmarkCircle, IoAlertCircle, IoInformationCircle, IoWarning } from "react-icons/io5";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent = ({ toast, onRemove }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (toast.type) {
      case "success":
        return <IoCheckmarkCircle className={iconClass} />;
      case "error":
        return <IoAlertCircle className={iconClass} />;
      case "warning":
        return <IoWarning className={iconClass} />;
      case "info":
        return <IoInformationCircle className={iconClass} />;
      default:
        return <IoInformationCircle className={iconClass} />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-primary-50 border-primary-200 text-primary-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-70 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-primary-50 border-primary-200 text-primary-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div
      className={`${getStyles()} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] flex items-start gap-3 transition-all duration-300 ${
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Close notification"
      >
        <IoClose className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 pointer-events-none max-w-md">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto animate-slide-in-right">
          <ToastComponent toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// Toast Manager Hook
let toastIdCounter = 0;
const toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

const notify = (listeners: Array<(toasts: Toast[]) => void>) => {
  listeners.forEach((listener) => listener([...toasts]));
};

export const toast = {
  success: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    toasts = [...toasts, { id, message, type: "success", duration }];
    notify(toastListeners);
  },
  error: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    toasts = [...toasts, { id, message, type: "error", duration }];
    notify(toastListeners);
  },
  info: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    toasts = [...toasts, { id, message, type: "info", duration }];
    notify(toastListeners);
  },
  warning: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    toasts = [...toasts, { id, message, type: "warning", duration }];
    notify(toastListeners);
  },
  remove: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify(toastListeners);
  },
  subscribe: (listener: (toasts: Toast[]) => void) => {
    toastListeners.push(listener);
    listener([...toasts]);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  },
};

