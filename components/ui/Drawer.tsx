// components/ui/Drawer.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  KeyboardEvent,
} from "react";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** default: 'md' */
  size?: "sm" | "md" | "lg";
};

export function Drawer({ isOpen, onClose, title, children, size = "md" }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusableSelectors =
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
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

      // move focus into drawer
      if (panelRef.current) {
        const focusable =
          panelRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) || panelRef.current;
        focusable.focus();
      }

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
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

  const sizeClass =
    size === "sm"
      ? "md:max-w-sm"
      : size === "lg"
      ? "md:max-w-2xl"
      : "md:max-w-xl";

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "drawer-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative ml-auto flex h-full w-full transform flex-col bg-white shadow-xl transition-transform duration-200 ease-out focus:outline-none md:rounded-l-2xl ${sizeClass} translate-x-0 md:w-1/2`}
        onKeyDown={handleKeyDown}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            {title && (
              <h2
                id="drawer-title"
                className="text-sm font-semibold text-slate-900"
              >
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
