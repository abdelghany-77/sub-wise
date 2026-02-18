import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
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

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop — desktop only (mobile is full screen so no backdrop needed) */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in sm:block" />

      {/* Modal — full screen on mobile, centered dialog on desktop */}
      <div
        className={cn(
          "relative z-10 w-full bg-[#131320] border-white/10 shadow-2xl animate-slide-up flex flex-col",
          // Mobile: true full screen
          "h-[100dvh] border-0 rounded-none",
          // Desktop: centered card, but larger
          "sm:h-auto sm:border sm:rounded-2xl sm:max-h-[95vh]",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-2xl",
          size === "lg" && "sm:max-w-4xl",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-white/[0.07] flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Footer — always visible */}
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-white/[0.07] flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
