'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { reputationClient } from '@/lib/contracts/reputation-client';
import type { Review, ReputationStats } from '@/lib/types';

export function useReputation(address: string | null | undefined) {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use connected wallet as the simulation key, fall back to address itself if
  // the user isn't connected (read-only profile view).
  const simKey = publicKey || address || '';

  useEffect(() => {
    if (!address || !simKey) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      reputationClient.getReputation(address, simKey),
      reputationClient.getReviews(address, simKey),
    ])
      .then(([s, r]) => {
        if (cancelled) return;
        setStats(s);
        setReviews(r);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message || e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [address, simKey]);

  return { stats, reviews, loading, error };
}
