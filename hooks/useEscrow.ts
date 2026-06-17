'use client';

import { useCallback, useEffect, useState } from 'react';
import { escrowClient } from '@/lib/contracts/escrow-client';
import type { EscrowDeposit } from '@/lib/types';

export function useEscrow(jobId: number, publicKey?: string) {
  const [escrow, setEscrow] = useState<EscrowDeposit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEscrow = useCallback(async () => {
    if (!publicKey || !jobId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await escrowClient.getEscrow(jobId, publicKey);
      setEscrow(data);
    } catch {
      setEscrow(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, publicKey]);

  useEffect(() => {
    fetchEscrow();
  }, [fetchEscrow]);

  return { escrow, loading, refetch: fetchEscrow };
}
