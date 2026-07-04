'use client';

import { useState } from 'react';
import { reputationClient } from '@/lib/contracts/reputation-client';
import { REPUTATION_CONTRACT_ID } from '@/lib/constants';
import { stellar } from '@/lib/stellar';
import { FiStar, FiX, FiLoader, FiCheckCircle } from 'react-icons/fi';

interface Props {
  jobId: number;
  reviewee: string;   // address of the person being reviewed
  publicKey: string;  // connected wallet (reviewer)
  onClose: () => void;
}

type Phase = 'form' | 'pending' | 'success' | 'error';

export default function LeaveReviewModal({ jobId, reviewee, publicKey, onClose }: Props) {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState('');
  const [phase,   setPhase]   = useState<Phase>('form');
  const [txHash,  setTxHash]  = useState('');
  const [errMsg,  setErrMsg]  = useState('');

  const disabled = !REPUTATION_CONTRACT_ID || rating === 0 || comment.trim().length === 0;

  async function handleSubmit() {
    if (disabled) return;
    setPhase('pending');
    setErrMsg('');
    try {
      const { hash } = await reputationClient.submitReview({
        publicKey,
        jobId,
        reviewee,
        rating,
        comment: comment.trim(),
      });
      setTxHash(hash);
      setPhase('success');
    } catch (e: unknown) {
      setErrMsg(String((e as Error)?.message || e));
      setPhase('error');
    }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold text-white">Leave a Review</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {phase === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <FiCheckCircle className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Review Submitted!</p>
                <p className="mt-1 text-sm text-zinc-400">Your review is now recorded on-chain.</p>
              </div>
              {txHash && (
                <a
                  href={`${stellar.getExplorerLink(txHash, 'tx')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors font-mono"
                >
                  {stellar.formatAddress(txHash, 8, 8)} ↗
                </a>
              )}
              <button onClick={onClose} className="btn-primary mt-2">
                Done
              </button>
            </div>

          ) : phase === 'pending' ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <FiLoader className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-400">Submitting review on-chain…</p>
              <p className="text-xs text-zinc-600">Please sign in Freighter</p>
            </div>

          ) : (
            <>
              {/* Reviewee */}
              <p className="mb-5 text-sm text-zinc-400">
                Reviewing{' '}
                <span className="font-mono text-white">
                  {stellar.formatAddress(reviewee, 6, 4)}
                </span>{' '}
                for Job #{jobId}
              </p>

              {/* Star selector */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-medium text-zinc-400">Rating *</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHover(s)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <FiStar
                        className={`h-7 w-7 transition-colors ${
                          s <= (hover || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Comment * <span className="text-zinc-600">({comment.length}/300)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 300))}
                  placeholder="Describe your experience working with this person…"
                  rows={4}
                  className="field-input resize-none"
                />
              </div>

              {/* Not deployed warning */}
              {!REPUTATION_CONTRACT_ID && (
                <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  Reputation contract not yet deployed. Reviews will be available after deployment.
                </p>
              )}

              {/* Error */}
              {phase === 'error' && errMsg && (
                <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {errMsg}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-zinc-800 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={disabled}
                  className="flex-1 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
