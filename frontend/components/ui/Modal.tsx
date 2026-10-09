"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Extra classes for the scrollable body. */
  bodyClassName?: string;
}

const SIZES = {
  sm: "md:max-w-md",
  md: "md:max-w-xl",
  lg: "md:max-w-3xl",
  xl: "md:max-w-5xl",
  full: "md:max-w-none md:h-full md:rounded-none",
};

export function Modal({ open, onClose, title, children, footer, size = "md", bodyClassName }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center md:items-center md:p-6">
      <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-slide-up relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none md:max-h-[90vh] md:rounded-2xl",
          SIZES[size],
        )}
      >
        <div className="relative flex min-h-16 shrink-0 items-center justify-center border-b border-gray-200 px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute left-4 rounded-full p-2 transition hover:bg-gray-100"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {title && (
            <h2 id={titleId} className="text-base font-bold">
              {title}
            </h2>
          )}
        </div>
        <div className={cn("flex-1 overflow-y-auto px-6 py-6", bodyClassName)}>{children}</div>
        {footer && <div className="shrink-0 border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
