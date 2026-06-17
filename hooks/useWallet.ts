'use client';

import { useCallback, useEffect, useState } from 'react';
import { stellar } from '@/lib/stellar';

export function useWallet() {
  const [publicKey, setPublicKey] = useState('');
  const [walletId, setWalletId] = useState('freighter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Restore from session on mount */
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('sg_wallet') : null;
    if (stored) setPublicKey(stored);
  }, []);

  const connect = useCallback(async (id?: string) => {
    try {
      setLoading(true);
      setError('');
      if (id) setWalletId(id);
      const key = await stellar.connectWallet(id);
      setPublicKey(key);
      sessionStorage.setItem('sg_wallet', key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    stellar.disconnect();
    setPublicKey('');
    setError('');
    sessionStorage.removeItem('sg_wallet');
  }, []);

  return {
    publicKey,
    isConnected: !!publicKey,
    walletId,
    loading,
    error,
    connect,
    disconnect,
  };
}
