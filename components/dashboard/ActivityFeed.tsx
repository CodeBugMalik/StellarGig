import { stellar } from '@/lib/stellar';
import type { ContractEvent } from '@/lib/types';
import { FiActivity, FiExternalLink } from 'react-icons/fi';

interface ActivityFeedProps {
  events: ContractEvent[];
  loading: boolean;
}

export default function ActivityFeed({ events, loading }: ActivityFeedProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <FiActivity className="h-4 w-4 text-zinc-400" />
        Real-time Events
        {events.length > 0 && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300 font-mono">
            {events.length}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
        {loading && events.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No contract events captured yet.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-sm animate-fade-in"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-white truncate">
                  {event.topic.join(' · ') || 'contract-event'}
                </span>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  L{event.ledger}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 truncate">
                {typeof event.value === 'object'
                  ? JSON.stringify(event.value)
                  : String(event.value)}
              </p>
              <a
                href={stellar.getExplorerLink(event.txHash, 'tx')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {stellar.formatAddress(event.txHash, 6, 6)}
                <FiExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
