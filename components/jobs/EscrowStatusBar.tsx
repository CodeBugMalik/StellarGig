'use client';

interface Props {
  totalAmount: string;   // XLM
  releasedAmount: string; // XLM — from escrow state
}

export default function EscrowStatusBar({ totalAmount, releasedAmount }: Props) {
  const total    = parseFloat(totalAmount)    || 0;
  const released = parseFloat(releasedAmount) || 0;
  const locked   = Math.max(0, total - released);
  const pct      = total > 0 ? Math.min(100, (released / total) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          <span className="text-white font-medium">{released.toFixed(2)} XLM</span> released
        </span>
        <span className="text-zinc-500">
          {locked.toFixed(2)} XLM locked
        </span>
      </div>

      {/* Bar track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Total */}
      <p className="text-right text-xs text-zinc-600">
        {total.toFixed(2)} XLM total
      </p>
    </div>
  );
}
