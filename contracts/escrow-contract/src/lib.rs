#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

/* ─── Storage keys ─── */

#[contracttype]
pub enum DataKey {
    Escrow(u64),
    JobContract,
    TotalEscrowed,
}

/* ─── Types ─── */

#[contracttype]
#[derive(Clone)]
pub struct EscrowDeposit {
    pub job_id: u64,
    pub client: Address,
    pub total_amount: i128,
    pub released_amount: i128,
    pub is_active: bool,
}

/* ─── Contract ─── */

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize with the authorized job contract address.
    pub fn initialize(env: Env, job_contract: Address) {
        env.storage()
            .instance()
            .set(&DataKey::JobContract, &job_contract);
        env.storage()
            .instance()
            .set(&DataKey::TotalEscrowed, &0i128);
        env.events().publish(("escrow", "initialized"), true);
    }

    /// Client funds escrow for a job.
    /// In a production contract this would use SAC token transfer.
    /// For the demo/testnet we track amounts without actual XLM movement
    /// to avoid SAC complexity and focus on the inter-contract pattern.
    pub fn fund_job(env: Env, client: Address, job_id: u64, amount: i128) {
        client.require_auth();

        let deposit = EscrowDeposit {
            job_id,
            client: client.clone(),
            total_amount: amount,
            released_amount: 0,
            is_active: true,
        };

        env.storage()
            .instance()
            .set(&DataKey::Escrow(job_id), &deposit);

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalEscrowed)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalEscrowed, &(total + amount));

        env.events()
            .publish(("escrow", "funded"), (job_id, amount));
    }

    /// Release milestone payment to freelancer.
    /// Called by the Job Contract via inter-contract call.
    pub fn release_milestone(
        env: Env,
        job_id: u64,
        _milestone_index: u32,
        freelancer: Address,
        amount: i128,
    ) {
        let mut deposit: EscrowDeposit = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .unwrap();

        if !deposit.is_active {
            panic!("Escrow is not active");
        }
        if deposit.released_amount + amount > deposit.total_amount {
            panic!("Release exceeds escrowed amount");
        }

        deposit.released_amount += amount;

        if deposit.released_amount >= deposit.total_amount {
            deposit.is_active = false;
        }

        env.storage()
            .instance()
            .set(&DataKey::Escrow(job_id), &deposit);

        env.events()
            .publish(("escrow", "released"), (job_id, freelancer, amount));
    }

    /// Refund remaining escrow to client (for cancelled jobs).
    pub fn refund(env: Env, job_id: u64, client: Address) {
        let mut deposit: EscrowDeposit = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .unwrap();

        if !deposit.is_active {
            panic!("Escrow already settled");
        }

        let refund_amount = deposit.total_amount - deposit.released_amount;
        deposit.is_active = false;
        deposit.released_amount = deposit.total_amount;

        env.storage()
            .instance()
            .set(&DataKey::Escrow(job_id), &deposit);

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalEscrowed)
            .unwrap_or(0);
        let new_total = if total >= refund_amount {
            total - refund_amount
        } else {
            0
        };
        env.storage()
            .instance()
            .set(&DataKey::TotalEscrowed, &new_total);

        env.events()
            .publish(("escrow", "refunded"), (job_id, client, refund_amount));
    }

    /* ─── Read functions ─── */

    pub fn get_escrow(env: Env, job_id: u64) -> EscrowDeposit {
        env.storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .unwrap()
    }

    pub fn get_total_escrowed(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalEscrowed)
            .unwrap_or(0)
    }
}

mod test;
