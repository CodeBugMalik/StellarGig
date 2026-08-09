import { describe, it, expect, vi } from 'vitest';

/* Test the pure parsing/conversion functions extracted from the contract clients.
   These don't require browser or Stellar SDK — they test our data-mapping logic. */

describe('Contract client parsing edge cases', () => {
  // ─── Job status parsing ───────────────────────────────────────────

  const jobStatusMap: Record<string, string> = {
    Open: 'open', Funded: 'funded', InProgress: 'in_progress',
    UnderReview: 'under_review', Completed: 'completed',
    Disputed: 'disputed', Cancelled: 'cancelled',
  };

  function parseJobStatus(val: string): string {
    return jobStatusMap[val] || 'open';
  }

  it('maps all known contract job statuses', () => {
    expect(parseJobStatus('Open')).toBe('open');
    expect(parseJobStatus('Funded')).toBe('funded');
    expect(parseJobStatus('InProgress')).toBe('in_progress');
    expect(parseJobStatus('UnderReview')).toBe('under_review');
    expect(parseJobStatus('Completed')).toBe('completed');
    expect(parseJobStatus('Disputed')).toBe('disputed');
    expect(parseJobStatus('Cancelled')).toBe('cancelled');
  });

  it('falls back to "open" for unknown job status', () => {
    expect(parseJobStatus('SomeWeirdStatus')).toBe('open');
    expect(parseJobStatus('')).toBe('open');
  });

  // ─── Milestone status parsing ─────────────────────────────────────

  const milestoneStatusMap: Record<string, string> = {
    Pending: 'pending', Submitted: 'submitted',
    Approved: 'approved', Disputed: 'disputed',
  };

  function parseMilestoneStatus(val: string): string {
    return milestoneStatusMap[val] || 'pending';
  }

  it('maps all known milestone statuses', () => {
    expect(parseMilestoneStatus('Pending')).toBe('pending');
    expect(parseMilestoneStatus('Submitted')).toBe('submitted');
    expect(parseMilestoneStatus('Approved')).toBe('approved');
    expect(parseMilestoneStatus('Disputed')).toBe('disputed');
  });

  it('falls back to "pending" for unknown milestone status', () => {
    expect(parseMilestoneStatus('Unknown')).toBe('pending');
    expect(parseMilestoneStatus('')).toBe('pending');
  });

  // ─── Stroops conversion edge cases ────────────────────────────────

  function stroopsToXlm(stroops: string | number | bigint): string {
    const value = BigInt(stroops);
    const whole = value / BigInt(10_000_000);
    const fraction = value % BigInt(10_000_000);
    return `${whole}.${String(fraction).padStart(7, '0')}`;
  }

  function xlmToStroops(xlm: string): string {
    const parts = xlm.split('.');
    const whole = BigInt(parts[0] || '0') * BigInt(10_000_000);
    const frac = parts[1] ? BigInt(parts[1].padEnd(7, '0').slice(0, 7)) : BigInt(0);
    return String(whole + frac);
  }

  it('handles very large stroops values', () => {
    // 1 billion XLM in stroops
    expect(stroopsToXlm('10000000000000000')).toBe('1000000000.0000000');
  });

  it('round-trips XLM → stroops → XLM', () => {
    const original = '123.4567890';
    const stroops = xlmToStroops(original);
    const backToXlm = stroopsToXlm(stroops);
    expect(backToXlm).toBe(original);
  });

  it('handles zero correctly in both directions', () => {
    expect(xlmToStroops('0')).toBe('0');
    expect(stroopsToXlm('0')).toBe('0.0000000');
  });

  it('handles whole numbers without decimals', () => {
    expect(xlmToStroops('100')).toBe('1000000000');
  });
});
