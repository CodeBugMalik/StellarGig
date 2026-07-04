'use client';

import { FiCheckCircle, FiClock, FiAlertCircle, FiCircle } from 'react-icons/fi';
import type { Milestone } from '@/lib/types';

interface Props {
  milestones: Milestone[];
}

const STATUS_CONFIG = {
  pending:   { icon: FiCircle,      color: 'text-zinc-600',  bg: 'bg-zinc-800',   ring: 'ring-zinc-700',   label: 'Pending' },
  submitted: { icon: FiClock,       color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', label: 'In Review' },
  approved:  { icon: FiCheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30', label: 'Approved' },
  disputed:  { icon: FiAlertCircle, color: 'text-red-400',   bg: 'bg-red-500/10', ring: 'ring-red-500/20', label: 'Disputed' },
};

export default function MilestoneTimeline({ milestones }: Props) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-6 bottom-6 w-px bg-zinc-800" aria-hidden />

      <ol className="space-y-5">
        {milestones.map((m, idx) => {
          const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          return (
            <li key={idx} className="relative flex items-start gap-4">
              {/* Step icon */}
              <div
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${cfg.bg} ${cfg.ring} transition-all`}
              >
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-1 pt-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white leading-tight">
                      {m.description || `Milestone ${idx + 1}`}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {m.amount} XLM
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring}`}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
