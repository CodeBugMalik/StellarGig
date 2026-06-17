'use client';

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto max-w-lg rounded-2xl border border-surface-700 bg-surface-800 p-0 text-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onClose={onClose}
    >
      <div className="flex items-center justify-between border-b border-surface-700 px-6 py-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-surface-700 hover:text-white transition-colors"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
