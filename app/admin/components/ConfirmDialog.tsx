"use client";

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Ya',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm scale-150 rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-600">{description ?? 'Aksi ini tidak dapat dibatalkan.'}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-[#064E3B] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#064E3B]/10 transition hover:bg-[#053f30]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
