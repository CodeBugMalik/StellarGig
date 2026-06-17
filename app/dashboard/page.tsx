'use client';

import { useWallet } from '@/hooks/useWallet';
import { useJobs } from '@/hooks/useJobs';
import { useContractEvents } from '@/hooks/useContractEvents';
import { stellar } from '@/lib/stellar';
import { JOB_CONTRACT_ID, ESCROW_CONTRACT_ID } from '@/lib/constants';
import JobCard from '@/components/jobs/JobCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { FiBriefcase, FiCheckCircle, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { publicKey, isConnected } = useWallet();
  const { jobs, loading } = useJobs(publicKey || undefined);
  const { events, loading: eventsLoading } = useContractEvents(JOB_CONTRACT_ID, 10_000);

  const stats = useMemo(() => {
    const myClientJobs = jobs.filter((j) => j.client === publicKey);
    const myFreelancerJobs = jobs.filter((j) => j.freelancer === publicKey);
    const completedJobs = myFreelancerJobs.filter((j) => j.status === 'completed');
    const totalEarned = completedJobs.reduce(
      (sum, j) => sum + Number(j.totalAmount),
      0
    );
    const activeJobs = [...myClientJobs, ...myFreelancerJobs].filter(
      (j) => !['completed', 'cancelled'].includes(j.status)
    );

    return {
      totalEarned,
      activeCount: activeJobs.length,
      completedCount: completedJobs.length,
      totalJobs: myClientJobs.length + myFreelancerJobs.length,
      clientJobs: myClientJobs,
      freelancerJobs: myFreelancerJobs,
    };
  }, [jobs, publicKey]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Connect Wallet</h1>
        <p className="mt-3 text-slate-400">Connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: FiDollarSign,
      label: 'Total Earned',
      value: `${stats.totalEarned.toFixed(2)} XLM`,
      color: 'text-white',
      bg: 'bg-zinc-800/80 border border-zinc-700/50',
    },
    {
      icon: FiBriefcase,
      label: 'Active Jobs',
      value: String(stats.activeCount),
      color: 'text-zinc-300',
      bg: 'bg-zinc-800/80 border border-zinc-700/50',
    },
    {
      icon: FiCheckCircle,
      label: 'Completed',
      value: String(stats.completedCount),
      color: 'text-zinc-200',
      bg: 'bg-zinc-800/80 border border-zinc-700/50',
    },
    {
      icon: FiTrendingUp,
      label: 'Total Jobs',
      value: String(stats.totalJobs),
      color: 'text-zinc-400',
      bg: 'bg-zinc-800/80 border border-zinc-700/50',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {stellar.formatAddress(publicKey, 6, 6)}
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          <FiBriefcase className="h-4 w-4" />
          Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`mb-3 inline-flex rounded-lg p-2.5 items-center justify-center ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Jobs */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">My Jobs</h2>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : stats.totalJobs === 0 ? (
            <EmptyState
              title="No jobs yet"
              description="Create your first job or accept an open job to get started."
              action={
                <Link href="/jobs" className="btn-primary">
                  Browse Jobs
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {stats.clientJobs.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-400">As Client</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {stats.clientJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              )}
              {stats.freelancerJobs.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-400">As Freelancer</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {stats.freelancerJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Activity</h2>
          <ActivityFeed events={events} loading={eventsLoading} />
        </div>
      </div>
    </div>
  );
}
