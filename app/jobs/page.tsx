'use client';

import { useMemo, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/jobs/JobCard';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { FiBriefcase, FiSearch } from 'react-icons/fi';

const statusFilters = ['all', 'open', 'funded', 'in_progress', 'completed', 'disputed'];

export default function JobsPage() {
  const { publicKey } = useWallet();
  const { jobs, loading } = useJobs(publicKey || undefined);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = jobs;
    if (statusFilter !== 'all') {
      result = result.filter((j) => j.status === statusFilter);
    }
    const needle = search.trim().toLowerCase();
    if (needle) {
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(needle) ||
          j.description.toLowerCase().includes(needle)
      );
    }
    return result;
  }, [jobs, search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Browse Jobs</h1>
          <p className="mt-1 text-sm text-slate-400">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          <FiBriefcase className="h-4 w-4" />
          Post a Job
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <label className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="field-input pl-9"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-800 text-slate-400 hover:text-white border border-surface-700'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Be the first to post a job on StellarGig!'
            }
            action={
              <Link href="/create" className="btn-primary">
                Create a Job
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
