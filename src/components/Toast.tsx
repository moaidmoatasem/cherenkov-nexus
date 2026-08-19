import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-positive-ink shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-critical-ink shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-info-ink shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-positive-line bg-surface/95',
    error: 'border-critical-line bg-surface/95',
    info: 'border-info-line bg-surface/95',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-card border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
        borders[toast.type]
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">{toast.title}</h4>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed break-words font-sans">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-ink-muted hover:text-ink transition-colors p-1 rounded-control hover:bg-fill-strong"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
