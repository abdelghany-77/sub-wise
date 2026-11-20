import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { registerBackHandler } from "../../lib/backButtonManager";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
}

function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [ref],
  );

  useEffect(() => {
    if (!isActive) return;
    document.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      if (ref.current) {
        const first = ref.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        first?.focus();
      }
    }, 50);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isActive, handleKeyDown, ref]);
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  compact,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isCompactMobile = compact ?? size === "sm";

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Android hardware back button handler
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerBackHandler(() => {
      onClose();
      return true;
    });
    return unregister;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4",
        isCompactMobile ? "items-end justify-center" : "",
      )}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal — bottom sheet for compact on mobile, full-screen for rich forms, centered dialog on desktop */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 w-full bg-[#111827] border-white/10 shadow-2xl animate-slide-up flex flex-col",
          isCompactMobile
            ? "h-auto max-h-[88dvh] rounded-t-3xl border-t sm:border sm:rounded-2xl sm:max-h-[90vh]"
            : "h-[100dvh] border-0 rounded-none sm:h-auto sm:border sm:rounded-2xl sm:max-h-[92vh]",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-2xl",
          size === "lg" && "sm:max-w-4xl",
        )}
      >
        {isCompactMobile && (
          <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 flex-shrink-0">
            <span className="w-10 h-1 rounded-full bg-white/15" />
          </div>
        )}

        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-5 sm:px-6 pb-3.5 sm:py-4 border-b border-white/[0.07] flex-shrink-0",
            isCompactMobile
              ? "pt-3"
              : "pt-[calc(0.85rem+env(safe-area-inset-top))]",
          )}
        >
          <h2 className="text-base sm:text-lg font-semibold text-white truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] -mr-2 flex items-center justify-center rounded-xl text-white/45 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div
          className={cn(
            "px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 min-h-0",
            !footer && "pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5",
          )}
        >
          {children}
        </div>

        {/* Footer — always visible */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-white/[0.07] flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
