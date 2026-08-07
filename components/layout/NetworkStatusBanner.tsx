'use client';

import { NETWORK_PASSPHRASE } from '@/lib/constants';
import { FiWifi, FiAlertCircle } from 'react-icons/fi';

/**
 * Displays a banner indicating the current Stellar network (Testnet / Mainnet).
 * Helps users avoid accidentally transacting on the wrong network.
 */
export default function NetworkStatusBanner() {
  const isTestnet = NETWORK_PASSPHRASE.includes('Test');
  const label = isTestnet ? 'Stellar Testnet' : 'Stellar Mainnet';
  const Icon = isTestnet ? FiAlertCircle : FiWifi;

  if (!isTestnet) return null; // Only show banner on testnet

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-300">
      <Icon className="h-3.5 w-3.5" />
      <span>
        You are on <strong>{label}</strong> — transactions use test XLM only.
      </span>
    </div>
  );
}
