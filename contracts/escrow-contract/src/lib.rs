#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, vec, Address, Env, IntoVal, Symbol, Vec};

/* ─── Custom Errors ─── */

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    EscrowNotActive = 4,
    ReleaseExceedsAmount = 5,
    EscrowAlreadySettled = 6,
    AlreadyFunded = 7,
    InvalidAmount = 8,
}

/* ─── Storage keys ─── */

#[contracttype]
pub enum DataKey {
    Escrow(u64),
    JobContract,
    TotalEscrowed,
    Initialized,
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
        if env.storage().instance().has(&DataKey::Initialized) {
            env.panic_with_error(Error::AlreadyInitialized);
        }

        env.storage()
            .instance()
            .set(&DataKey::JobContract, &job_contract);
        env.storage()
            .instance()
            .set(&DataKey::TotalEscrowed, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::Initialized, &true);

        env.storage().instance().extend_ttl(4096, 50000);
        env.events().publish(("escrow", "initialized"), true);
    }

    /// Client funds escrow for a job.
    pub fn fund_job(env: Env, client: Address, job_id: u64, amount: i128) {
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        client.require_auth();

        if amount <= 0 {
            env.panic_with_error(Error::InvalidAmount);
        }

        if env.storage().instance().has(&DataKey::Escrow(job_id)) {
            env.panic_with_error(Error::AlreadyFunded);
        }

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

        // *** INTER-CONTRACT CALL: Mark Job as Funded ***
        let job_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::JobContract)
            .unwrap();

        let args: Vec<soroban_sdk::Val> = vec![
            &env,
            job_id.into_val(&env),
        ];

        env.invoke_contract::<()>(
            &job_contract,
            &Symbol::new(&env, "mark_funded"),
            args,
        );

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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        let job_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::JobContract)
            .unwrap();
        job_contract.require_auth();

        let mut deposit: EscrowDeposit = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .unwrap();

        if !deposit.is_active {
            env.panic_with_error(Error::EscrowNotActive);
        }
        if deposit.released_amount + amount > deposit.total_amount {
            env.panic_with_error(Error::ReleaseExceedsAmount);
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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        let job_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::JobContract)
            .unwrap();
        job_contract.require_auth();

        let mut deposit: EscrowDeposit = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .unwrap();

        if !deposit.is_active {
            env.panic_with_error(Error::EscrowAlreadySettled);
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
        env.storage().instance().extend_ttl(4096, 50000);
        env.storage()
            .instance()
            .get(&DataKey::Escrow(job_id))
            .unwrap()
    }

    pub fn get_total_escrowed(env: Env) -> i128 {
        env.storage().instance().extend_ttl(4096, 50000);
        env.storage()
            .instance()
            .get(&DataKey::TotalEscrowed)
            .unwrap_or(0)
    }

    /* ─── Helpers ─── */

    fn check_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::Initialized) {
            env.panic_with_error(Error::NotInitialized);
        }
    }
}

mod test;
