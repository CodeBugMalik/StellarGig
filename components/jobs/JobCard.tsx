import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { stellar } from '@/lib/stellar';
import type { Job } from '@/lib/types';
import { FiArrowRight, FiLayers, FiUser } from 'react-icons/fi';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const completedMilestones = job.milestones.filter((m) => m.status === 'approved').length;

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="card-interactive group" id={`job-card-${job.id}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
            {job.title}
          </h3>
          <Badge status={job.status} />
        </div>

        <p className="mt-2 text-sm text-slate-400 line-clamp-2">
          {job.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5" />
            {stellar.formatAddress(job.client, 4, 4)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiLayers className="h-3.5 w-3.5" />
            {completedMilestones}/{job.milestones.length} milestones
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-white">
            {Number(job.totalAmount).toFixed(2)}{' '}
            <span className="text-sm font-normal text-brand-300">XLM</span>
          </p>
          <span className="flex items-center gap-1 text-xs text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
            View details <FiArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
