import * as StellarSdk from '@stellar/stellar-sdk';
import { stellar } from '../stellar';
import { REPUTATION_CONTRACT_ID } from '../constants';
import type { Review, ReputationStats } from '../types';

function parseReview(raw: Record<string, unknown>): Review {
  return {
    jobId:     Number(raw.job_id || 0),
    reviewer:  String(raw.reviewer || ''),
    reviewee:  String(raw.reviewee || ''),
    rating:    Number(raw.rating || 0),
    comment:   String(raw.comment || ''),
    timestamp: Number(raw.timestamp || 0),
  };
}

function parseStats(raw: Record<string, unknown>): ReputationStats {
  const totalReviews = Number(raw.total_reviews || 0);
  const totalRating  = Number(raw.total_rating || 0);
  return {
    totalReviews,
    totalRating,
    jobsCompleted: Number(raw.jobs_completed || 0),
    totalEarned:   stellar.stroopsToXlm(String(raw.total_earned || '0')),
    avgRating:     totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0,
  };
}

export class ReputationContractClient {
  private contractId: string;

  constructor(contractId: string = REPUTATION_CONTRACT_ID) {
    this.contractId = contractId;
  }

  /** Fetch reputation stats for any Stellar address. Returns null if contract not deployed. */
  async getReputation(address: string, publicKey: string): Promise<ReputationStats | null> {
    if (!this.contractId) return null;
    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: this.contractId,
        method: 'get_reputation',
        args: [StellarSdk.nativeToScVal(address, { type: 'address' })],
      });
      if (!result) return null;
      return parseStats(StellarSdk.scValToNative(result) as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  /** Fetch all reviews received by an address. Returns [] if contract not deployed. */
  async getReviews(address: string, publicKey: string): Promise<Review[]> {
    if (!this.contractId) return [];
    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: this.contractId,
        method: 'get_reviews',
        args: [StellarSdk.nativeToScVal(address, { type: 'address' })],
      });
      if (!result) return [];
      const raw = StellarSdk.scValToNative(result) as Array<Record<string, unknown>>;
      return raw.map(parseReview);
    } catch {
      return [];
    }
  }

  /** Fetch a single review for a job. Returns null if none exists. */
  async getReview(jobId: number, publicKey: string): Promise<Review | null> {
    if (!this.contractId) return null;
    try {
      const result = await stellar.simulateRead({
        publicKey,
        contractId: this.contractId,
        method: 'get_review',
        args: [StellarSdk.nativeToScVal(jobId, { type: 'u64' })],
      });
      if (!result) return null;
      const native = StellarSdk.scValToNative(result);
      // Returns Option<Review> — may be void/null if not found
      if (!native || typeof native !== 'object') return null;
      return parseReview(native as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  /** Submit a review for a completed job. */
  async submitReview(params: {
    publicKey: string;
    jobId: number;
    reviewee: string;
    rating: number;
    comment: string;
  }): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey:  params.publicKey,
      contractId: this.contractId,
      method:     'submit_review',
      args: [
        StellarSdk.nativeToScVal(params.publicKey,  { type: 'address' }),
        StellarSdk.nativeToScVal(params.jobId,      { type: 'u64' }),
        StellarSdk.nativeToScVal(params.reviewee,   { type: 'address' }),
        StellarSdk.nativeToScVal(params.rating,     { type: 'u32' }),
        StellarSdk.nativeToScVal(params.comment,    { type: 'string' }),
      ],
    });
  }
}

export const reputationClient = new ReputationContractClient();
