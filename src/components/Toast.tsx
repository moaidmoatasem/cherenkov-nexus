import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  /**
   * Optional recovery affordance. A toast carrying one stays up longer, because
   * the whole point is that the reader has time to reach for it.
   */
  action?: { label: string; onClick: () => void };
}

/**
 * The signature every component uses to raise a toast. Declared once so the
 * optional recovery action cannot go missing from a caller's prop type.
 */
export type ToastFn = (
  type: ToastMessage['type'],
  title: string,
  message: string,
  action?: ToastMessage['action']
) => void;

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-relevant="additions text"
      data-testid="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full px-4"
    >
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
  const [paused, setPaused] = useState(false);
  const dismiss = useRef(onDismiss);

  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (paused) return;
    // A recovery action needs long enough to notice, read and reach.
    const timer = setTimeout(() => dismiss.current(toast.id), toast.action ? 10000 : 4500);
    return () => clearTimeout(timer);
  }, [toast.id, paused, toast.action]);

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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-card border shadow-pop backdrop-blur-xl transition-all duration-300 animate-slide-up ${
        borders[toast.type]
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-mono">{toast.title}</h4>
        <p className="text-sm text-ink-muted mt-1 leading-relaxed break-words font-sans">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 px-2.5 py-1 rounded-chip text-xs font-bold text-accent-ink bg-accent-soft border border-accent-line hover:bg-fill-strong transition-colors cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss notification: ${toast.title}`}
        className="text-ink-muted hover:text-ink transition-colors p-1 rounded-control hover:bg-fill-strong"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
