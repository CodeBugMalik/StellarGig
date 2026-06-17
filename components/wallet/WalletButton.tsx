'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { stellar } from '@/lib/stellar';
import { FiCheck, FiCopy, FiCreditCard, FiLogOut } from 'react-icons/fi';

const walletOptions = [
  { id: 'freighter', label: 'Freighter', note: 'Browser extension' },
  { id: 'xbull', label: 'xBull', note: 'Extension / WalletConnect' },
  { id: 'albedo', label: 'Albedo', note: 'Link-based wallet' },
];

export default function WalletButton() {
  const { publicKey, isConnected, loading, error, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="btn-secondary h-10 px-3 text-xs"
          title="Copy address"
        >
          {copied ? (
            <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <FiCopy className="h-3.5 w-3.5" />
          )}
          <span className="font-mono">{stellar.formatAddress(publicKey, 4, 4)}</span>
        </button>
        <button
          onClick={disconnect}
          className="btn-secondary h-10 px-3"
          title="Disconnect"
        >
          <FiLogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={loading}
        className="btn-primary h-10"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <FiCreditCard className="h-4 w-4" />
        )}
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {dropdownOpen && !loading && (
        <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-surface-700 bg-surface-800 p-2 shadow-xl animate-slide-up">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => {
                setDropdownOpen(false);
                connect(wallet.id);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-700"
            >
              <div>
                <p className="font-medium text-white">{wallet.label}</p>
                <p className="text-xs text-slate-400">{wallet.note}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="absolute right-0 top-12 mt-1 max-w-xs text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
