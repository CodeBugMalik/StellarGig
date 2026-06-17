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
  open: { bg: 'bg-zinc-800/40 border border-zinc-800', text: 'text-zinc-300', dot: 'bg-zinc-400' },
  funded: { bg: 'bg-zinc-800/60 border border-zinc-700/50', text: 'text-zinc-200', dot: 'bg-zinc-300' },
  in_progress: { bg: 'bg-zinc-900 border border-zinc-800', text: 'text-zinc-300', dot: 'bg-white' },
  under_review: { bg: 'bg-zinc-950 border border-zinc-800', text: 'text-zinc-300', dot: 'bg-zinc-400' },
  completed: { bg: 'bg-white/10 border border-white/20', text: 'text-white', dot: 'bg-white' },
  disputed: { bg: 'bg-red-500/10 border border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-zinc-950 border border-zinc-900', text: 'text-zinc-500', dot: 'bg-zinc-700' },
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
