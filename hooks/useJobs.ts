'use client';

import { useCallback, useEffect, useState } from 'react';
import { jobClient } from '@/lib/contracts/job-client';
import type { Job } from '@/lib/types';

export function useJobs(publicKey?: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async () => {
    if (!publicKey) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const count = await jobClient.getJobCount(publicKey);
      const fetched: Job[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const job = await jobClient.getJob(i, publicKey);
          fetched.push(job);
        } catch {
          /* skip jobs that fail to load */
        }
      }

      setJobs(fetched.reverse());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load jobs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}
