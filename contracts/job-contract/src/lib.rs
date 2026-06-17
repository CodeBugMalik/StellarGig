#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, vec, Address, Env, IntoVal, String, Symbol, Vec};

/* ─── Storage keys ─── */

#[contracttype]
pub enum DataKey {
    JobCount,
    Job(u64),
    ClientJobs(Address),
    FreelancerJobs(Address),
    EscrowContract,
}

/* ─── Types ─── */

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum JobStatus {
    Open,
    Funded,
    InProgress,
    UnderReview,
    Completed,
    Disputed,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Disputed,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub title: String,
    pub description: String,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub status: JobStatus,
    pub escrow_contract: Address,
    pub created_at: u64,
}

/* ─── Contract ─── */

#[contract]
pub struct JobContract;

#[contractimpl]
impl JobContract {
    /// Initialize the contract with the escrow contract address.
    pub fn initialize(env: Env, escrow_contract: Address) {
        env.storage().instance().set(&DataKey::JobCount, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        env.events().publish(("contract", "initialized"), true);
    }

    /// Create a new job with milestones.
    pub fn create_job(
        env: Env,
        client: Address,
        title: String,
        description: String,
        milestones: Vec<Milestone>,
    ) -> u64 {
        client.require_auth();

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::JobCount)
            .unwrap_or(0);
        let job_id = count + 1;

        // Calculate total amount
        let mut total: i128 = 0;
        for i in 0..milestones.len() {
            let m = milestones.get(i).unwrap();
            total += m.amount;
        }

        let escrow_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .unwrap();

        let job = Job {
            id: job_id,
            client: client.clone(),
            freelancer: client.clone(), // placeholder — updated on accept
            title,
            description,
            total_amount: total,
            milestones,
            status: JobStatus::Open,
            escrow_contract,
            created_at: env.ledger().sequence().into(),
        };

        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.storage().instance().set(&DataKey::JobCount, &job_id);

        // Track client's jobs
        let mut client_jobs: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::ClientJobs(client.clone()))
            .unwrap_or(vec![&env]);
        client_jobs.push_back(job_id);
        env.storage()
            .instance()
            .set(&DataKey::ClientJobs(client), &client_jobs);

        env.events().publish(("job", "created"), job_id);
        job_id
    }

    /// Freelancer accepts a funded job.
    pub fn accept_job(env: Env, job_id: u64, freelancer: Address) {
        freelancer.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.status != JobStatus::Funded {
            panic!("Job must be funded before accepting");
        }

        job.freelancer = freelancer.clone();
        job.status = JobStatus::InProgress;
        env.storage().instance().set(&DataKey::Job(job_id), &job);

        // Track freelancer's jobs
        let mut fl_jobs: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::FreelancerJobs(freelancer.clone()))
            .unwrap_or(vec![&env]);
        fl_jobs.push_back(job_id);
        env.storage()
            .instance()
            .set(&DataKey::FreelancerJobs(freelancer.clone()), &fl_jobs);

        env.events()
            .publish(("job", "accepted"), (job_id, freelancer));
    }

    /// Freelancer submits a milestone.
    pub fn submit_milestone(env: Env, job_id: u64, milestone_index: u32, freelancer: Address) {
        freelancer.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.freelancer != freelancer {
            panic!("Only assigned freelancer can submit");
        }
        if job.status != JobStatus::InProgress {
            panic!("Job must be in progress");
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Pending {
            panic!("Milestone already submitted or completed");
        }

        m.status = MilestoneStatus::Submitted;
        job.milestones.set(milestone_index, m);
        job.status = JobStatus::UnderReview;

        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events()
            .publish(("milestone", "submitted"), (job_id, milestone_index));
    }

    /// Client approves a milestone → triggers inter-contract escrow release.
    pub fn approve_milestone(env: Env, job_id: u64, milestone_index: u32, client: Address) {
        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            panic!("Only the client can approve");
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Submitted {
            panic!("Milestone must be submitted first");
        }

        let amount = m.amount;
        m.status = MilestoneStatus::Approved;
        job.milestones.set(milestone_index, m);

        // *** INTER-CONTRACT CALL: Release escrow ***
        let escrow_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .unwrap();

        // *** INTER-CONTRACT CALL via env.invoke_contract ***
        let args: Vec<soroban_sdk::Val> = vec![
            &env,
            job_id.into_val(&env),
            milestone_index.into_val(&env),
            job.freelancer.into_val(&env),
            amount.into_val(&env),
        ];
        env.invoke_contract::<()>(
            &escrow_address,
            &Symbol::new(&env, "release_milestone"),
            args,
        );

        // Check if all milestones are approved
        let mut all_done = true;
        for i in 0..job.milestones.len() {
            let ms = job.milestones.get(i).unwrap();
            if ms.status != MilestoneStatus::Approved {
                all_done = false;
                break;
            }
        }

        job.status = if all_done {
            JobStatus::Completed
        } else {
            JobStatus::InProgress
        };

        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events()
            .publish(("milestone", "approved"), (job_id, milestone_index, amount));
    }

    /// Client disputes a milestone.
    pub fn dispute_milestone(env: Env, job_id: u64, milestone_index: u32, client: Address) {
        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            panic!("Only the client can dispute");
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Submitted {
            panic!("Can only dispute submitted milestones");
        }

        m.status = MilestoneStatus::Disputed;
        job.milestones.set(milestone_index, m);
        job.status = JobStatus::Disputed;

        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events()
            .publish(("milestone", "disputed"), (job_id, milestone_index));
    }

    /// Cancel a job (only if open/funded and no freelancer assigned).
    pub fn cancel_job(env: Env, job_id: u64, client: Address) {
        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            panic!("Only the client can cancel");
        }
        if job.status != JobStatus::Open && job.status != JobStatus::Funded {
            panic!("Can only cancel open or funded jobs");
        }

        if job.status == JobStatus::Funded {
            // Inter-contract call: refund escrow
            let escrow_address: Address = env
                .storage()
                .instance()
                .get(&DataKey::EscrowContract)
                .unwrap();
            // Inter-contract call: refund escrow
            let args: Vec<soroban_sdk::Val> = vec![
                &env,
                job_id.into_val(&env),
                client.into_val(&env),
            ];
            env.invoke_contract::<()>(
                &escrow_address,
                &Symbol::new(&env, "refund"),
                args,
            );
        }

        job.status = JobStatus::Cancelled;
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events().publish(("job", "cancelled"), job_id);
    }

    /// Mark a job as funded (called after escrow is funded).
    pub fn mark_funded(env: Env, job_id: u64) {
        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.status != JobStatus::Open {
            panic!("Job must be open to fund");
        }

        job.status = JobStatus::Funded;
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events().publish(("job", "funded"), job_id);
    }

    /* ─── Read functions ─── */

    pub fn get_job(env: Env, job_id: u64) -> Job {
        env.storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap()
    }

    pub fn get_job_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::JobCount)
            .unwrap_or(0)
    }

    pub fn get_client_jobs(env: Env, client: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::ClientJobs(client))
            .unwrap_or(vec![&env])
    }

    pub fn get_freelancer_jobs(env: Env, freelancer: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::FreelancerJobs(freelancer))
            .unwrap_or(vec![&env])
    }
}

mod test;
