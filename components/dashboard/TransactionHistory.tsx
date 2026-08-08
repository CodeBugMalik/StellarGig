'use client';

import { stellar } from '@/lib/stellar';
import { FiExternalLink, FiClock } from 'react-icons/fi';

interface TxEntry {
  hash: string;
  action: string;
  timestamp: string;
}

interface TransactionHistoryProps {
  transactions: TxEntry[];
}

/**
 * Displays a compact list of recent on-chain transactions with explorer links.
 * Used on the dashboard to give users visibility into their recent activity.
 */
export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FiClock className="h-4 w-4 text-zinc-400" />
          Recent Transactions
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          No transactions recorded yet. Create or interact with a job to see your history.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <FiClock className="h-4 w-4 text-zinc-400" />
        Recent Transactions
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300 font-mono">
          {transactions.length}
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{tx.action}</p>
              <p className="text-xs text-zinc-500">{tx.timestamp}</p>
            </div>
            <a
              href={stellar.getExplorerLink(tx.hash, 'tx')}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 ml-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {stellar.formatAddress(tx.hash, 4, 4)}
              <FiExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
