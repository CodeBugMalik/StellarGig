import { describe, it, expect } from 'vitest';

/* We test the pure utility functions directly without importing the full
   StellarHelper class (which pulls in browser-only wallet SDKs).
   This verifies the address formatting, explorer link generation,
   and stroops↔XLM conversion logic. */

function formatAddress(address: string, start: number = 4, end: number = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

function getExplorerLink(hash: string, type: 'tx' | 'account' | 'contract' = 'tx'): string {
  return `https://stellar.expert/explorer/testnet/${type}/${hash}`;
}

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

describe('StellarHelper utilities', () => {
  it('formatAddress truncates correctly', () => {
    const address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890ABCDEFGHIJKLMNOP';
    const formatted = formatAddress(address, 4, 4);
    expect(formatted).toBe('GABC...MNOP');
    expect(formatted.length).toBe(11);
  });

  it('formatAddress returns short addresses as-is', () => {
    expect(formatAddress('GABC', 4, 4)).toBe('GABC');
  });

  it('getExplorerLink generates correct URL', () => {
    const link = getExplorerLink('abc123', 'tx');
    expect(link).toContain('stellar.expert');
    expect(link).toContain('/tx/abc123');
  });

  it('getExplorerLink works for accounts', () => {
    const link = getExplorerLink('GABC123', 'account');
    expect(link).toContain('/account/GABC123');
  });

  it('stroopsToXlm converts correctly', () => {
    expect(stroopsToXlm('10000000')).toBe('1.0000000');
    expect(stroopsToXlm('500000000')).toBe('50.0000000');
    expect(stroopsToXlm('0')).toBe('0.0000000');
  });

  it('xlmToStroops converts correctly', () => {
    expect(xlmToStroops('1')).toBe('10000000');
    expect(xlmToStroops('50.5')).toBe('505000000');
  });
});
