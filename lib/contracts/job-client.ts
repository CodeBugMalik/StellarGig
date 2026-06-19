import * as StellarSdk from '@stellar/stellar-sdk';
import { stellar } from '../stellar';
import { JOB_CONTRACT_ID } from '../constants';
import type { Job, Milestone, MilestoneInput, JobStatus, MilestoneStatus } from '../types';

function parseJobStatus(val: string): JobStatus {
  const map: Record<string, JobStatus> = {
    Open: 'open', Funded: 'funded', InProgress: 'in_progress',
    UnderReview: 'under_review', Completed: 'completed',
    Disputed: 'disputed', Cancelled: 'cancelled',
  };
  return map[val] || 'open';
}

function parseMilestoneStatus(val: string): MilestoneStatus {
  const map: Record<string, MilestoneStatus> = {
    Pending: 'pending', Submitted: 'submitted',
    Approved: 'approved', Disputed: 'disputed',
  };
  return map[val] || 'pending';
}

function parseJob(raw: Record<string, unknown>): Job {
  const milestones = (raw.milestones as Array<Record<string, unknown>> || []).map((m) => ({
    description: String(m.description || ''),
    amount: stellar.stroopsToXlm(String(m.amount || '0')),
    status: parseMilestoneStatus(String(m.status || 'Pending')),
    deadline: Number(m.deadline || 0),
  }));

  return {
    id: Number(raw.id || 0),
    client: String(raw.client || ''),
    freelancer: String(raw.freelancer || ''),
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    totalAmount: stellar.stroopsToXlm(String(raw.total_amount || '0')),
    milestones,
    status: parseJobStatus(String(raw.status || 'Open')),
    escrowContract: String(raw.escrow_contract || ''),
    createdAt: Number(raw.created_at || 0),
  };
}

export class JobContractClient {
  private contractId: string;

  constructor(contractId: string = JOB_CONTRACT_ID) {
    this.contractId = contractId;
  }

  async getJobCount(publicKey: string): Promise<number> {
    const result = await stellar.simulateRead({
      publicKey, contractId: this.contractId, method: 'get_job_count',
    });
    return result ? Number(StellarSdk.scValToNative(result)) : 0;
  }

  async getJob(jobId: number, publicKey: string): Promise<Job> {
    const result = await stellar.simulateRead({
      publicKey, contractId: this.contractId, method: 'get_job',
      args: [StellarSdk.nativeToScVal(jobId, { type: 'u64' })],
    });
    if (!result) throw new Error('Job not found');
    return parseJob(StellarSdk.scValToNative(result) as Record<string, unknown>);
  }

  async getClientJobs(clientAddress: string, publicKey: string): Promise<number[]> {
    const result = await stellar.simulateRead({
      publicKey, contractId: this.contractId, method: 'get_client_jobs',
      args: [StellarSdk.nativeToScVal(clientAddress, { type: 'address' })],
    });
    return result ? (StellarSdk.scValToNative(result) as number[]) : [];
  }

  async getFreelancerJobs(freelancerAddress: string, publicKey: string): Promise<number[]> {
    const result = await stellar.simulateRead({
      publicKey, contractId: this.contractId, method: 'get_freelancer_jobs',
      args: [StellarSdk.nativeToScVal(freelancerAddress, { type: 'address' })],
    });
    return result ? (StellarSdk.scValToNative(result) as number[]) : [];
  }

  async createJob(params: {
    publicKey: string;
    title: string;
    description: string;
    milestones: MilestoneInput[];
  }): Promise<{ hash: string }> {
    const milestoneVals = params.milestones.map((m) =>
      StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('amount'),
          val: StellarSdk.nativeToScVal(BigInt(stellar.xlmToStroops(m.amount)), { type: 'i128' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('deadline'),
          val: StellarSdk.nativeToScVal(0, { type: 'u64' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('description'),
          val: StellarSdk.nativeToScVal(m.description, { type: 'string' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.xdr.ScVal.scvSymbol('status'),
          val: StellarSdk.xdr.ScVal.scvVec([StellarSdk.xdr.ScVal.scvSymbol('Pending')]),
        }),
      ])
    );

    return stellar.buildAndSignTx({
      publicKey: params.publicKey,
      contractId: this.contractId,
      method: 'create_job',
      args: [
        StellarSdk.nativeToScVal(params.publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(params.title, { type: 'string' }),
        StellarSdk.nativeToScVal(params.description, { type: 'string' }),
        StellarSdk.nativeToScVal(milestoneVals),
      ],
    });
  }

  async acceptJob(publicKey: string, jobId: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey, contractId: this.contractId, method: 'accept_job',
      args: [
        StellarSdk.nativeToScVal(jobId, { type: 'u64' }),
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
      ],
    });
  }

  async submitMilestone(publicKey: string, jobId: number, milestoneIndex: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey, contractId: this.contractId, method: 'submit_milestone',
      args: [
        StellarSdk.nativeToScVal(jobId, { type: 'u64' }),
        StellarSdk.nativeToScVal(milestoneIndex, { type: 'u32' }),
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
      ],
    });
  }

  async approveMilestone(publicKey: string, jobId: number, milestoneIndex: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey, contractId: this.contractId, method: 'approve_milestone',
      args: [
        StellarSdk.nativeToScVal(jobId, { type: 'u64' }),
        StellarSdk.nativeToScVal(milestoneIndex, { type: 'u32' }),
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
      ],
    });
  }

  async disputeMilestone(publicKey: string, jobId: number, milestoneIndex: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey, contractId: this.contractId, method: 'dispute_milestone',
      args: [
        StellarSdk.nativeToScVal(jobId, { type: 'u64' }),
        StellarSdk.nativeToScVal(milestoneIndex, { type: 'u32' }),
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
      ],
    });
  }

  async cancelJob(publicKey: string, jobId: number): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey, contractId: this.contractId, method: 'cancel_job',
      args: [
        StellarSdk.nativeToScVal(jobId, { type: 'u64' }),
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
      ],
    });
  }
}

export const jobClient = new JobContractClient();
