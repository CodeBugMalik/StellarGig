export const JOB_CONTRACT_ID =
  process.env.NEXT_PUBLIC_JOB_CONTRACT_ID || '';

export const ESCROW_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || '';

export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-rpc.testnet.stellar.org';

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export const EXPLORER_BASE_URL = 'https://stellar.expert/explorer/testnet';

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: 'bg-brand-500/10', text: 'text-brand-300', dot: 'bg-brand-400' },
  funded: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  in_progress: { bg: 'bg-amber-500/10', text: 'text-amber-300', dot: 'bg-amber-400' },
  under_review: { bg: 'bg-purple-500/10', text: 'text-purple-300', dot: 'bg-purple-400' },
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  disputed: { bg: 'bg-red-500/10', text: 'text-red-300', dot: 'bg-red-400' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
};

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  funded: 'Funded',
  in_progress: 'In Progress',
  under_review: 'Under Review',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
};
