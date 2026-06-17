import * as StellarSdk from '@stellar/stellar-sdk';
import { stellar } from '../stellar';
import { ESCROW_CONTRACT_ID } from '../constants';
import type { EscrowDeposit } from '../types';

export class EscrowContractClient {
  private contractId: string;

  constructor(contractId: string = ESCROW_CONTRACT_ID) {
    this.contractId = contractId;
  }

  async getEscrow(jobId: number, publicKey: string): Promise<EscrowDeposit | null> {
    try {
      const result = await stellar.simulateRead({
        publicKey, contractId: this.contractId, method: 'get_escrow',
        args: [StellarSdk.nativeToScVal(jobId, { type: 'u64' })],
      });
      if (!result) return null;

      const raw = StellarSdk.scValToNative(result) as Record<string, unknown>;
      return {
        jobId: Number(raw.job_id || 0),
        client: String(raw.client || ''),
        totalAmount: stellar.stroopsToXlm(String(raw.total_amount || '0')),
        releasedAmount: stellar.stroopsToXlm(String(raw.released_amount || '0')),
        isActive: Boolean(raw.is_active),
      };
    } catch {
      return null;
    }
  }

  async getTotalEscrowed(publicKey: string): Promise<string> {
    try {
      const result = await stellar.simulateRead({
        publicKey, contractId: this.contractId, method: 'get_total_escrowed',
      });
      return result ? stellar.stroopsToXlm(String(StellarSdk.scValToNative(result))) : '0';
    } catch {
      return '0';
    }
  }

  async fundJob(publicKey: string, jobId: number, amountXlm: string): Promise<{ hash: string }> {
    return stellar.buildAndSignTx({
      publicKey, contractId: this.contractId, method: 'fund_job',
      args: [
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(jobId, { type: 'u64' }),
        StellarSdk.nativeToScVal(BigInt(stellar.xlmToStroops(amountXlm)), { type: 'i128' }),
      ],
    });
  }
}

export const escrowClient = new EscrowContractClient();
