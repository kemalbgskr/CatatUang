"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="relative z-10 bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_32px_128px_rgba(0,0,0,0.1)] border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="px-8 pb-8 pt-2">{children}</div>
      </div>
    </div>
  );
}
