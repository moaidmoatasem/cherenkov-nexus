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
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-emerald-500/40 bg-[#0e111a]/95 shadow-emerald-950/40',
    error: 'border-rose-500/40 bg-[#0e111a]/95 shadow-rose-950/40',
    info: 'border-indigo-500/40 bg-[#0e111a]/95 shadow-indigo-950/40',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
        borders[toast.type]
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{toast.title}</h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words font-sans">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
