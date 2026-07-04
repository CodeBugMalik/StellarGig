'use client';

import { useParams } from 'next/navigation';
import { useReputation } from '@/hooks/useReputation';
import { useJobs } from '@/hooks/useJobs';
import { useWallet } from '@/hooks/useWallet';
import { stellar } from '@/lib/stellar';
import { EXPLORER_BASE_URL } from '@/lib/constants';
import Skeleton from '@/components/ui/Skeleton';
import Link from 'next/link';
import { FiStar, FiCheckCircle, FiDollarSign, FiExternalLink, FiCopy, FiBriefcase } from 'react-icons/fi';
import { useState } from 'react';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const px = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          className={`${px} ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const address = decodeURIComponent(String(params.address || ''));
  const { publicKey } = useWallet();
  const { stats, reviews, loading } = useReputation(address);
  const { jobs } = useJobs(address);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);

  const PER_PAGE = 5;
  const pagedReviews = reviews.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(reviews.length / PER_PAGE);

  const clientJobs     = jobs.filter((j) => j.client === address);
  const freelancerJobs = jobs.filter((j) => j.freelancer === address);

  function handleCopy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isOwnProfile = publicKey === address;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="card mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-xl font-bold text-white ring-2 ring-white/10">
            {address.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-white">
                {stellar.formatAddress(address, 8, 8)}
              </span>
              <button
                onClick={handleCopy}
                title="Copy address"
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <FiCopy className="h-3.5 w-3.5" />
              </button>
              {copied && <span className="text-xs text-green-400">Copied!</span>}
            </div>
            <a
              href={`${EXPLORER_BASE_URL}/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
            >
              View on explorer <FiExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        {isOwnProfile && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
            Your Profile
          </span>
        )}
      </div>

      {/* ── Reputation Stats ── */}
      {loading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {/* Avg Rating */}
          <div className="card flex flex-col items-center gap-2 py-5">
            <p className="text-3xl font-bold text-white">
              {stats ? stats.avgRating.toFixed(1) : '—'}
            </p>
            <StarRating rating={Math.round(stats?.avgRating ?? 0)} />
            <p className="text-xs text-zinc-400">Avg Rating</p>
          </div>
          {/* Total Reviews */}
          <div className="card flex flex-col items-center gap-1 py-5">
            <FiStar className="h-5 w-5 text-amber-400 mb-1" />
            <p className="text-2xl font-bold text-white">{stats?.totalReviews ?? 0}</p>
            <p className="text-xs text-zinc-400">Reviews</p>
          </div>
          {/* Jobs Completed */}
          <div className="card flex flex-col items-center gap-1 py-5">
            <FiCheckCircle className="h-5 w-5 text-emerald-400 mb-1" />
            <p className="text-2xl font-bold text-white">{stats?.jobsCompleted ?? 0}</p>
            <p className="text-xs text-zinc-400">Completed</p>
          </div>
          {/* Total Earned */}
          <div className="card flex flex-col items-center gap-1 py-5">
            <FiDollarSign className="h-5 w-5 text-violet-400 mb-1" />
            <p className="text-2xl font-bold text-white">
              {stats ? `${Number(stats.totalEarned).toFixed(1)} XLM` : '—'}
            </p>
            <p className="text-xs text-zinc-400">Earned</p>
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Reviews Received ({reviews.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : pagedReviews.length === 0 ? (
          <div className="card py-10 text-center text-zinc-500">
            No reviews yet.
          </div>
        ) : (
          <div className="space-y-3">
            {pagedReviews.map((r) => (
              <div key={r.jobId} className="card">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <StarRating rating={r.rating} />
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Link
                      href={`/jobs/${r.jobId}`}
                      className="hover:text-white transition-colors"
                    >
                      Job #{r.jobId}
                    </Link>
                    <span>·</span>
                    <span>Ledger {r.timestamp}</span>
                  </div>
                </div>
                <p className="text-sm text-zinc-300">{r.comment}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  by{' '}
                  <Link
                    href={`/profile/${r.reviewer}`}
                    className="font-mono hover:text-white transition-colors"
                  >
                    {stellar.formatAddress(r.reviewer, 6, 4)}
                  </Link>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                  page === i
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Job History ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
          <FiBriefcase className="h-4 w-4 text-zinc-400" />
          Job History
        </h2>
        {[
          { label: 'As Client', list: clientJobs },
          { label: 'As Freelancer', list: freelancerJobs },
        ].map(({ label, list }) =>
          list.length > 0 ? (
            <div key={label} className="mb-6">
              <p className="mb-3 text-sm font-medium text-zinc-400">{label}</p>
              <div className="space-y-2">
                {list.slice(0, 5).map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="card flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white truncate">{j.title}</p>
                      <p className="text-xs text-zinc-500">{j.totalAmount} XLM</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-zinc-800 text-zinc-300">
                      {j.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null
        )}
        {clientJobs.length === 0 && freelancerJobs.length === 0 && (
          <div className="card py-8 text-center text-zinc-500 text-sm">
            No jobs found for this address.
          </div>
        )}
      </section>
    </div>
  );
}
