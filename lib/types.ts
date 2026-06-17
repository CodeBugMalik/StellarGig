/* ─── Job & Milestone Types ─── */

export type JobStatus =
  | 'open'
  | 'funded'
  | 'in_progress'
  | 'under_review'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'disputed';

export interface Milestone {
  description: string;
  amount: string;
  status: MilestoneStatus;
  deadline?: number;
}

export interface Job {
  id: number;
  client: string;
  freelancer: string;
  title: string;
  description: string;
  totalAmount: string;
  milestones: Milestone[];
  status: JobStatus;
  escrowContract: string;
  createdAt: number;
}

/* ─── Escrow Types ─── */

export interface EscrowDeposit {
  jobId: number;
  client: string;
  totalAmount: string;
  releasedAmount: string;
  isActive: boolean;
}

/* ─── Event Types ─── */

export interface ContractEvent {
  id: string;
  type: string;
  topic: string[];
  value: unknown;
  ledger: number;
  txHash: string;
  createdAt: string;
}

/* ─── Transaction Types ─── */

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'failed';

export interface TransactionResult {
  status: TransactionStatus;
  hash?: string;
  message: string;
  returnValue?: string;
  error?: string;
}

/* ─── Milestone Input (for form) ─── */

export interface MilestoneInput {
  description: string;
  amount: string;
}
