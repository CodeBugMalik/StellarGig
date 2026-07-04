'use client';

import { useState, useEffect, useCallback } from 'react';
import { stellar } from '@/lib/stellar';
import { JOB_CONTRACT_ID } from '@/lib/constants';
import type { ContractEvent } from '@/lib/types';

const STORAGE_KEY = 'stellargig_last_seen_ledger';

function getLastSeenLedger(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function setLastSeenLedger(ledger: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(ledger));
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  txHash: string;
  ledger: number;
  createdAt: string;
}

function eventToNotification(e: ContractEvent): Notification {
  const typeLabel = e.topic.join(':') || e.type;

  const labelMap: Record<string, { title: string; desc: string }> = {
    'job:created':         { title: 'New Job Created',        desc: 'A new job was posted on the platform.' },
    'job:accepted':        { title: 'Job Accepted',           desc: 'A freelancer accepted a job offer.' },
    'job:funded':          { title: 'Escrow Funded',          desc: 'Client funded the escrow for a job.' },
    'job:cancelled':       { title: 'Job Cancelled',          desc: 'A job has been cancelled.' },
    'milestone:submitted': { title: 'Milestone Submitted',    desc: 'Freelancer submitted work for review.' },
    'milestone:approved':  { title: 'Milestone Approved ✓',  desc: 'Client approved a milestone — funds released.' },
    'milestone:disputed':  { title: 'Milestone Disputed ⚠',  desc: 'A milestone is under dispute.' },
    'milestone:resolved':  { title: 'Dispute Resolved',       desc: 'A disputed milestone has been resolved.' },
  };

  const { title, desc } = labelMap[typeLabel] ?? {
    title: 'Contract Event',
    desc:  typeLabel,
  };

  return {
    id:          e.id,
    type:        typeLabel,
    title,
    description: desc,
    txHash:      e.txHash,
    ledger:      e.ledger,
    createdAt:   e.createdAt,
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetchAndDiff = useCallback(async () => {
    try {
      const events = await stellar.getContractEvents(JOB_CONTRACT_ID, 20);
      const all    = events.map(eventToNotification);

      setNotifications(all);

      const lastSeen = getLastSeenLedger();
      const newOnes  = all.filter((n) => n.ledger > lastSeen);
      setUnreadCount(newOnes.length);
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndDiff();
    const id = setInterval(fetchAndDiff, 30_000);
    return () => clearInterval(id);
  }, [fetchAndDiff]);

  const markAllRead = useCallback(() => {
    if (notifications.length === 0) return;
    const maxLedger = Math.max(...notifications.map((n) => n.ledger));
    setLastSeenLedger(maxLedger);
    setUnreadCount(0);
  }, [notifications]);

  return { notifications, unreadCount, loading, markAllRead };
}
