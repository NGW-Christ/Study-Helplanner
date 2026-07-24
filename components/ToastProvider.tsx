import { CheckCircle2, Info, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

const TOAST_STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-emerald-600', icon: <CheckCircle2 className="w-5 h-5 shrink-0" /> },
  error: { bg: 'bg-red-600', icon: <XCircle className="w-5 h-5 shrink-0" /> },
  info: { bg: 'bg-slate-800', icon: <Info className="w-5 h-5 shrink-0" /> },
};

let nextToastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextToastId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-3rem)]">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto flex items-start gap-2 w-full sm:max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white cursor-pointer ${TOAST_STYLES[toast.type].bg}`}
          >
            {TOAST_STYLES[toast.type].icon}
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
