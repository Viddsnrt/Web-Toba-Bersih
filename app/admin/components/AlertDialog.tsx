"use client";

import { X, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface AlertDialogProps {
  open: boolean;
  title: string;
  description?: string;
  buttonText?: string;
  onClose: () => void;
  icon?: ReactNode;
}

export default function AlertDialog({
  open,
  title,
  description,
  buttonText = 'OK',
  onClose,
  icon,
}: AlertDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
              {icon ?? <CheckCircle2 size={28} />}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              {description && <p className="text-base text-slate-500 mt-2">{description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="px-8 py-6">
          <p className="text-base text-slate-600">{description ?? 'Operasi berhasil dilakukan.'}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-700"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

