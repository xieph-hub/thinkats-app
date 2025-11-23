// components/ui/Modal.tsx
"use client";

import React, {
  useEffect,
  useRef,
  type ReactNode,
  KeyboardEvent,
  useCallback,
} from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableSelectors =
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement | null;

        if (!current) return;

        if (!event.shiftKey && current === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && current === first) {
          event.preventDefault();
          last.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

      if (dialogRef.current) {
        const focusable =
          dialogRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) || dialogRef.current;
        focusable.focus();
      }

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("keydown", handleGlobalKeyDown as any);
      return () => {
        window.removeEventListener("keydown", handleGlobalKeyDown as any);
        if (previouslyFocusedRef.current) {
          previouslyFocusedRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl focus:outline-none"
      >
        {title && (
          <h2
            id="modal-title"
            className="text-sm font-semibold text-slate-900"
          >
            {title}
          </h2>
        )}
        <div className="mt-3 text-sm text-slate-600">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {/* Caller can override this by passing their own buttons inside children if needed */}
        </div>
      </div>
    </div>
  );
}
