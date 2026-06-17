import type { EscrowDeposit } from '@/lib/types';
import { FiLock, FiUnlock } from 'react-icons/fi';

interface EscrowStatusProps {
  escrow: EscrowDeposit | null;
}

export default function EscrowStatus({ escrow }: EscrowStatusProps) {
  if (!escrow) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FiLock className="h-4 w-4 text-zinc-400" />
          Escrow
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          No escrow deposit found for this job. The client must fund the escrow before a freelancer can accept.
        </p>
      </div>
    );
  }

  const total = Number(escrow.totalAmount);
  const released = Number(escrow.releasedAmount);
  const remaining = total - released;
  const releasedPercent = total > 0 ? (released / total) * 100 : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          {escrow.isActive ? (
            <FiLock className="h-4 w-4 text-zinc-400" />
          ) : (
            <FiUnlock className="h-4 w-4 text-white" />
          )}
          Escrow {escrow.isActive ? 'Active' : 'Settled'}
        </div>
        <span
          className={`status-badge ${
            escrow.isActive
              ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/50'
              : 'bg-white/10 text-white border border-white/20'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              escrow.isActive ? 'bg-zinc-400' : 'bg-white'
            }`}
          />
          {escrow.isActive ? 'Locked' : 'Released'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${releasedPercent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-zinc-400">Total</p>
          <p className="mt-1 text-sm font-semibold text-white">{total.toFixed(2)}</p>
          <p className="text-xs text-zinc-500">XLM</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Released</p>
          <p className="mt-1 text-sm font-semibold text-zinc-200">{released.toFixed(2)}</p>
          <p className="text-xs text-zinc-500">XLM</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Remaining</p>
          <p className="mt-1 text-sm font-semibold text-zinc-400">{remaining.toFixed(2)}</p>
          <p className="text-xs text-zinc-500">XLM</p>
        </div>
      </div>
    </div>
  );
}
