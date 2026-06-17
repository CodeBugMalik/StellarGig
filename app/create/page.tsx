'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { jobClient } from '@/lib/contracts/job-client';
import { stellar } from '@/lib/stellar';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import type { MilestoneInput, TransactionStatus } from '@/lib/types';
import { FiDollarSign, FiPlus, FiSend, FiTrash2 } from 'react-icons/fi';

export default function CreateJobPage() {
  const router = useRouter();
  const { publicKey, isConnected } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: '', amount: '' },
  ]);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');

  const totalAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const addMilestone = () => {
    setMilestones([...milestones, { description: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      toast.error('Title is required.');
      return false;
    }
    if (!description.trim()) {
      toast.error('Description is required.');
      return false;
    }
    for (let i = 0; i < milestones.length; i++) {
      if (!milestones[i].description.trim()) {
        toast.error(`Milestone ${i + 1} needs a description.`);
        return false;
      }
      const amt = Number(milestones[i].amount);
      if (!amt || amt <= 0) {
        toast.error(`Milestone ${i + 1} needs a valid amount.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !publicKey) return;

    try {
      setTxStatus('pending');
      const result = await jobClient.createJob({
        publicKey,
        title: title.trim(),
        description: description.trim(),
        milestones,
      });

      toast.success('Job created successfully!');
      setTxStatus('success');

      /* Wait for confirmation then redirect */
      const poll = setInterval(async () => {
        const status = await stellar.pollTransaction(result.hash);
        if (status.status === 'SUCCESS') {
          clearInterval(poll);
          router.push('/jobs');
        } else if (status.status === 'FAILED') {
          clearInterval(poll);
          setTxStatus('failed');
          toast.error('Transaction failed on-chain.');
        }
      }, 3000);
    } catch (err: unknown) {
      setTxStatus('failed');
      const message = err instanceof Error ? err.message : 'Failed to create job';
      toast.error(message);
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Connect Wallet</h1>
        <p className="mt-3 text-slate-400">
          Connect your Stellar wallet to create a new job.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Create a New Job</h1>
      <p className="mt-2 text-sm text-slate-400">
        Define milestones with individual payment amounts. Total will be escrowed on-chain.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Title */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Job Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build a Stellar dApp frontend"
            className="field-input"
            disabled={txStatus === 'pending'}
          />
        </label>

        {/* Description */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work, deliverables, and requirements..."
            rows={4}
            className="field-input h-auto py-3 resize-none"
            disabled={txStatus === 'pending'}
          />
        </label>

        {/* Milestones */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Milestones ({milestones.length})
            </span>
            <button
              type="button"
              onClick={addMilestone}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add Milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m, index) => (
              <div
                key={index}
                className="rounded-lg border border-surface-700 bg-surface-800 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-brand-400">
                    MILESTONE {index + 1}
                  </span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <input
                    value={m.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    placeholder="Milestone description"
                    className="field-input"
                    disabled={txStatus === 'pending'}
                  />
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={m.amount}
                      onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="field-input pr-12"
                      disabled={txStatus === 'pending'}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      XLM
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-brand-300">
            <FiDollarSign className="h-4 w-4" />
            Total Escrow Amount
          </span>
          <span className="text-lg font-bold text-white">
            {totalAmount.toFixed(2)} XLM
          </span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          loading={txStatus === 'pending'}
          icon={<FiSend className="h-4 w-4" />}
          className="w-full h-12 text-base"
        >
          {txStatus === 'pending' ? 'Creating Job...' : 'Create Job on Stellar'}
        </Button>
      </form>
    </div>
  );
}
