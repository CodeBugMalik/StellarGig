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
      const promises = [];
      for (let i = 1; i <= count; i++) {
        promises.push(jobClient.getJob(i, publicKey).catch(() => null));
      }
      const results = await Promise.all(promises);
      const fetched = results.filter((job): job is Job => job !== null);

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
