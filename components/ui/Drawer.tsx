"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DrawerSize = "sm" | "md" | "lg";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: DrawerSize;
  children: React.ReactNode;
};

const sizeClasses: Record<DrawerSize, string> = {
  sm: "md:max-w-md",
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
};

export function Drawer({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const drawerEl = drawerRef.current;
    if (drawerEl) {
      const firstFocusable = drawerEl.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "Tab" && drawerRef.current) {
        const focusableElements = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const current = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (current === first || !drawerRef.current.contains(current)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (current === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-40 flex items-stretch justify-end"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        className={`relative flex h-full w-full transform bg-white shadow-xl transition-transform duration-200 ease-out md:h-full md:${sizeClasses[size]} md:translate-x-0`}
      >
        <div className="flex h-full w-full flex-col border-l border-slate-200">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {title || "Details"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 text-sm text-slate-700">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
