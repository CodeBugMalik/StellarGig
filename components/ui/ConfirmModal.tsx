'use client';

import Modal from './Modal';
import Button from './Button';
import { FiDollarSign, FiInfo } from 'react-icons/fi';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  actionName: string;
  amount?: string;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  actionName,
  amount,
  loading,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-amber-200">
          <FiInfo className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-amber-300">Blockchain Transaction Confirmation</p>
            <p className="mt-1">
              This action requires signing a transaction with your Stellar wallet. 
              On-chain actions are permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-surface-700 bg-surface-900 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Action:</span>
            <span className="font-medium text-white">{actionName}</span>
          </div>

          {amount && (
            <div className="flex justify-between items-center border-t border-surface-700 pt-3">
              <span className="text-sm text-zinc-400">Escrow Value:</span>
              <span className="flex items-center gap-1 text-lg font-bold text-white">
                <FiDollarSign className="h-4 w-4 text-brand-400" />
                {Number(amount).toFixed(2)} XLM
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-surface-700 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className="px-5 py-2.5 text-sm"
          >
            Confirm & Sign
          </Button>
        </div>
      </div>
    </Modal>
  );
}
