import React, { useCallback, useEffect, useId, useRef } from 'react';
import { cn } from './cn';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** How many dialogs are open — the last one out restores page scrolling. */
let openCount = 0;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Use `labelledBy` instead when a visible heading exists. */
  label?: string;
  /** `id` of the visible heading that names this dialog. */
  labelledBy?: string;
  /** Dialogs sit centred; command-palette style surfaces sit near the top. */
  align?: 'center' | 'top';
  /** Escape and backdrop clicks are dismissals — off for destructive flows. */
  dismissable?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The backdrop and behaviour every overlay in the product shares: dialog
 * semantics, a focus trap, Escape, backdrop dismissal, scroll lock and focus
 * restoration. Panels keep their own markup and pass through as children, so
 * migrating a hand-rolled overlay is a one-element swap.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  label,
  labelledBy,
  align = 'center',
  dismissable = true,
  className,
  children,
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const fallbackId = useId();

  const close = useCallback(() => {
    if (dismissable) onClose();
  }, [dismissable, onClose]);

  // Lock page scrolling while any dialog is open.
  useEffect(() => {
    if (!open) return;
    openCount += 1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      openCount -= 1;
      if (openCount === 0) document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus in on open, and put it back where it came from on close.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const first = surface.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? surface).focus();
    }, 20);
    return () => {
      window.clearTimeout(id);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  // Escape closes; Tab cycles inside the dialog rather than escaping to the page.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const surface = surfaceRef.current;
      if (!surface) return;
      const items: HTMLElement[] = Array.from<HTMLElement>(
        surface.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      ref={surfaceRef}
      role="dialog"
      aria-modal="true"
      aria-label={labelledBy ? undefined : (label ?? 'Dialog')}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onMouseDown={(e) => {
        // Only a press that both starts and ends on the backdrop dismisses.
        if (e.target === e.currentTarget) close();
      }}
      className={cn(
        'fixed inset-0 z-50 flex justify-center bg-scrim backdrop-blur-md animate-fade-in',
        align === 'top' ? 'items-start pt-20 px-4' : 'items-center p-4',
        className,
      )}
      data-testid={`modal-${labelledBy ?? label ?? fallbackId}`}
    >
      {children}
    </div>
  );
};
