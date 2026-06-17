import Badge from '@/components/ui/Badge';
import type { Milestone } from '@/lib/types';
import { FiCheck, FiCircle, FiClock } from 'react-icons/fi';

interface MilestoneTrackerProps {
  milestones: Milestone[];
}

export default function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  const approvedCount = milestones.filter((m) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? (approvedCount / milestones.length) * 100 : 0;

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Milestone Progress</h3>
        <span className="text-xs text-slate-400">
          {approvedCount}/{milestones.length} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Milestone list */}
      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const Icon =
            milestone.status === 'approved'
              ? FiCheck
              : milestone.status === 'submitted'
                ? FiClock
                : FiCircle;

          const iconColor =
            milestone.status === 'approved'
              ? 'text-emerald-400'
              : milestone.status === 'submitted'
                ? 'text-amber-400'
                : milestone.status === 'disputed'
                  ? 'text-red-400'
                  : 'text-zinc-600';

          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
            >
              <div className={`mt-0.5 ${iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    Milestone {index + 1}
                  </p>
                  <Badge status={milestone.status} />
                </div>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                  {milestone.description}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-300">
                  {Number(milestone.amount).toFixed(2)} XLM
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
