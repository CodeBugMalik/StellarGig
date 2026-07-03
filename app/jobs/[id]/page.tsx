'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEscrow } from '@/hooks/useEscrow';
import { useContractEvents } from '@/hooks/useContractEvents';
import { jobClient } from '@/lib/contracts/job-client';
import { escrowClient } from '@/lib/contracts/escrow-client';
import { stellar } from '@/lib/stellar';
import { JOB_CONTRACT_ID } from '@/lib/constants';
import type { Job, TransactionStatus } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import MilestoneTracker from '@/components/jobs/MilestoneTracker';
import EscrowStatus from '@/components/escrow/EscrowStatus';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { trackEvent } from '@/lib/analytics';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiDollarSign,
  FiExternalLink,
  FiSend,
  FiUser,
  FiXCircle,
  FiAlertTriangle,
} from 'react-icons/fi';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = Number(params.id);
  const { publicKey, isConnected } = useWallet();
  const { escrow, loading: escrowLoading, refetch: refetchEscrow } = useEscrow(jobId, publicKey || undefined);
  const { events, loading: eventsLoading } = useContractEvents(JOB_CONTRACT_ID, 10_000);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState('');

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    actionName: string;
    amount?: string;
    action: () => Promise<{ hash: string }>;
    successMsg: string;
  } | null>(null);

  const fetchJob = useCallback(async () => {
    if (!publicKey) return;
    try {
      setLoading(true);
      const data = await jobClient.getJob(jobId, publicKey);
      setJob(data);
    } catch {
      toast.error('Failed to load job details.');
    } finally {
      setLoading(false);
    }
  }, [jobId, publicKey]);

  useEffect(() => {
    if (publicKey) fetchJob();
  }, [fetchJob, publicKey]);

  const handleAction = async (action: () => Promise<{ hash: string }>, successMsg: string) => {
    try {
      setTxStatus('pending');
      const result = await action();
      setTxHash(result.hash);
      setTxStatus('success');
      toast.success(successMsg);

      /* Poll until confirmed then refresh */
      const poll = setInterval(async () => {
        const status = await stellar.pollTransaction(result.hash);
        if (status.status === 'SUCCESS') {
          clearInterval(poll);
          fetchJob();
          refetchEscrow();
        } else if (status.status === 'FAILED') {
          clearInterval(poll);
          setTxStatus('failed');
          toast.error('Transaction failed on-chain.');
        }
      }, 3000);
    } catch (err: unknown) {
      setTxStatus('failed');
      const message = err instanceof Error ? err.message : 'Action failed';
      toast.error(message);
    }
  };

  const triggerActionWithConfirm = (config: {
    title: string;
    actionName: string;
    amount?: string;
    action: () => Promise<{ hash: string }>;
    successMsg: string;
  }) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const handleConfirmedAction = async () => {
    if (!confirmConfig) return;
    setConfirmOpen(false);
    trackEvent('job_action_executed', {
      action_title: confirmConfig.title,
      action_name: confirmConfig.actionName,
      amount: confirmConfig.amount,
    });
    await handleAction(confirmConfig.action, confirmConfig.successMsg);
  };

  const isClient = job && publicKey && job.client === publicKey;
  const isFreelancer = job && publicKey && job.freelancer === publicKey;

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Connect Wallet</h1>
        <p className="mt-3 text-slate-400">Connect your Stellar wallet to view job details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Job Not Found</h1>
        <p className="mt-3 text-slate-400">This job does not exist or could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{job.title}</h1>
            <Badge status={job.status} size="md" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <FiUser className="h-4 w-4" />
              Client: {stellar.formatAddress(job.client, 6, 6)}
            </span>
            {job.freelancer && (
              <span className="flex items-center gap-1.5">
                <FiUser className="h-4 w-4" />
                Freelancer: {stellar.formatAddress(job.freelancer, 6, 6)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <FiDollarSign className="h-4 w-4" />
              {Number(job.totalAmount).toFixed(2)} XLM total
            </span>
          </div>
        </div>
      </div>

      {/* Transaction status */}
      {txStatus !== 'idle' && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            txStatus === 'pending'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
              : txStatus === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {txStatus === 'pending' && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
            )}
            {txStatus === 'success' && <FiCheckCircle className="h-4 w-4" />}
            {txStatus === 'failed' && <FiXCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {txStatus === 'pending'
                ? 'Transaction pending...'
                : txStatus === 'success'
                  ? 'Transaction confirmed!'
                  : 'Transaction failed'}
            </span>
          </div>
          {txHash && (
            <a
              href={stellar.getExplorerLink(txHash, 'tx')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs hover:underline"
            >
              {stellar.formatAddress(txHash, 8, 8)}
              <FiExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Description */}
      <div className="mt-6 card">
        <h2 className="text-sm font-semibold text-white">Description</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
          {job.description}
        </p>
      </div>

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <MilestoneTracker milestones={job.milestones} />

          {/* Action buttons */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-white">Actions</h3>

            {isClient && job.status === 'open' && (
              <Button
                loading={txStatus === 'pending'}
                onClick={() =>
                  triggerActionWithConfirm({
                    title: 'Fund Escrow',
                    actionName: `Locking funds for "${job.title}"`,
                    amount: job.totalAmount,
                    action: () => escrowClient.fundJob(publicKey, jobId, job.totalAmount),
                    successMsg: 'Escrow funded successfully!',
                  })
                }
                icon={<FiDollarSign className="h-4 w-4" />}
                className="w-full"
              >
                Fund Escrow ({Number(job.totalAmount).toFixed(2)} XLM)
              </Button>
            )}

            {!isClient && !isFreelancer && job.status === 'funded' && (
              <Button
                loading={txStatus === 'pending'}
                onClick={() =>
                  triggerActionWithConfirm({
                    title: 'Accept Job',
                    actionName: `Accepting job "${job.title}" as Freelancer`,
                    action: () => jobClient.acceptJob(publicKey, jobId),
                    successMsg: 'Job accepted!',
                  })
                }
                icon={<FiCheckCircle className="h-4 w-4" />}
                className="w-full"
              >
                Accept Job as Freelancer
              </Button>
            )}

            {isFreelancer &&
              job.milestones.map((m, i) =>
                m.status === 'pending' && job.status === 'in_progress' ? (
                  <Button
                    key={i}
                    loading={txStatus === 'pending'}
                    onClick={() =>
                      triggerActionWithConfirm({
                        title: 'Submit Milestone',
                        actionName: `Submitting Milestone ${i + 1}: "${m.description}"`,
                        amount: m.amount,
                        action: () => jobClient.submitMilestone(publicKey, jobId, i),
                        successMsg: `Milestone ${i + 1} submitted!`,
                      })
                    }
                    icon={<FiSend className="h-4 w-4" />}
                    className="w-full"
                  >
                    Submit Milestone {i + 1}
                  </Button>
                ) : null
              )}

            {isClient &&
              job.milestones.map((m, i) =>
                m.status === 'submitted' ? (
                  <div key={i} className="flex gap-2">
                    <Button
                      loading={txStatus === 'pending'}
                      onClick={() =>
                        triggerActionWithConfirm({
                          title: 'Approve Milestone',
                          actionName: `Approving Milestone ${i + 1} and releasing payment`,
                          amount: m.amount,
                          action: () => jobClient.approveMilestone(publicKey, jobId, i),
                          successMsg: `Milestone ${i + 1} approved! Payment released.`,
                        })
                      }
                      icon={<FiCheckCircle className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Approve #{i + 1}
                    </Button>
                    <Button
                      variant="danger"
                      loading={txStatus === 'pending'}
                      onClick={() =>
                        triggerActionWithConfirm({
                          title: 'Dispute Milestone',
                          actionName: `Disputing Milestone ${i + 1}: "${m.description}"`,
                          amount: m.amount,
                          action: () => jobClient.disputeMilestone(publicKey, jobId, i),
                          successMsg: `Milestone ${i + 1} disputed.`,
                        })
                      }
                      icon={<FiAlertTriangle className="h-4 w-4" />}
                      className="flex-1"
                    >
                      Dispute #{i + 1}
                    </Button>
                  </div>
                ) : null
              )}

            {isClient && (job.status === 'open' || job.status === 'funded') && !job.freelancer && (
              <Button
                variant="danger"
                loading={txStatus === 'pending'}
                onClick={() =>
                  triggerActionWithConfirm({
                    title: 'Cancel Job',
                    actionName: `Cancelling job and refunding escrow if funded`,
                    amount: job.status === 'funded' ? job.totalAmount : undefined,
                    action: () => jobClient.cancelJob(publicKey, jobId),
                    successMsg: 'Job cancelled.',
                  })
                }
                icon={<FiXCircle className="h-4 w-4" />}
                className="w-full"
              >
                Cancel Job
              </Button>
            )}

            {job.status === 'completed' && (
              <p className="text-center text-sm text-emerald-400">
                ✓ All milestones completed. Payments released.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <EscrowStatus escrow={escrow} loading={escrowLoading} />
          <ActivityFeed events={events} loading={eventsLoading} />
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmedAction}
        title={confirmConfig?.title || ''}
        actionName={confirmConfig?.actionName || ''}
        amount={confirmConfig?.amount}
        loading={txStatus === 'pending'}
      />
    </div>
  );
}
