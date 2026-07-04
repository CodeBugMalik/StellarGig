#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, vec, Address, Env, IntoVal, String, Symbol, Vec};

/* ─── Custom Errors ─── */

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    JobNotOpen = 3,
    JobNotFunded = 4,
    JobNotInProgress = 5,
    NotFreelancer = 6,
    MilestoneNotPending = 7,
    NotClient = 8,
    MilestoneNotSubmitted = 9,
    CannotCancel = 10,
    InvalidMilestone = 11,
    AlreadyFunded = 12,
    InvalidInput = 13,
    SelfDealing = 14,
    Unauthorized = 15,
}

/* ─── Storage keys ─── */

#[contracttype]
pub enum DataKey {
    JobCount,
    Job(u64),
    ClientJobs(Address),
    FreelancerJobs(Address),
    EscrowContract,
    ReputationContract,
    Initialized,
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
        if env.storage().instance().has(&DataKey::Initialized) {
            env.panic_with_error(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::JobCount, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::EscrowContract, &escrow_contract);
        env.storage()
            .instance()
            .set(&DataKey::Initialized, &true);
        env.storage().instance().extend_ttl(4096, 50000);
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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        client.require_auth();

        if title.len() == 0 || description.len() == 0 {
            env.panic_with_error(Error::InvalidInput);
        }

        if milestones.len() == 0 || milestones.len() > 10 {
            env.panic_with_error(Error::InvalidMilestone);
        }

        // Calculate total amount & validate milestone amounts
        let mut total: i128 = 0;
        for i in 0..milestones.len() {
            let m = milestones.get(i).unwrap();
            if m.amount <= 0 {
                env.panic_with_error(Error::InvalidInput);
            }
            total += m.amount;
        }

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::JobCount)
            .unwrap_or(0);
        let job_id = count + 1;

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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        freelancer.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.status != JobStatus::Funded {
            env.panic_with_error(Error::JobNotFunded);
        }

        if job.client == freelancer {
            env.panic_with_error(Error::SelfDealing);
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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        freelancer.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.freelancer != freelancer {
            env.panic_with_error(Error::NotFreelancer);
        }
        if job.status != JobStatus::InProgress {
            env.panic_with_error(Error::JobNotInProgress);
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Pending {
            env.panic_with_error(Error::MilestoneNotPending);
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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            env.panic_with_error(Error::NotClient);
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Submitted {
            env.panic_with_error(Error::MilestoneNotSubmitted);
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

        // *** ICC: Notify Reputation Contract of job completion ***
        if all_done {
            if let Some(rep_contract) = env
                .storage()
                .instance()
                .get::<DataKey, Address>(&DataKey::ReputationContract)
            {
                let rep_args: Vec<soroban_sdk::Val> = vec![
                    &env,
                    job.freelancer.into_val(&env),
                    job.total_amount.into_val(&env),
                ];
                env.invoke_contract::<()>(
                    &rep_contract,
                    &Symbol::new(&env, "record_completion"),
                    rep_args,
                );
            }
        }
    }

    /// Client disputes a milestone.
    pub fn dispute_milestone(env: Env, job_id: u64, milestone_index: u32, client: Address) {
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            env.panic_with_error(Error::NotClient);
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Submitted {
            env.panic_with_error(Error::MilestoneNotSubmitted);
        }

        m.status = MilestoneStatus::Disputed;
        job.milestones.set(milestone_index, m);
        job.status = JobStatus::Disputed;

        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events()
            .publish(("milestone", "disputed"), (job_id, milestone_index));
    }

    /// Client resolves a dispute, setting the milestone status and job status.
    pub fn resolve_dispute(env: Env, job_id: u64, milestone_index: u32, client: Address, approve: bool) {
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            env.panic_with_error(Error::NotClient);
        }

        let mut m = job.milestones.get(milestone_index).unwrap();
        if m.status != MilestoneStatus::Disputed {
            env.panic_with_error(Error::InvalidInput);
        }

        if approve {
            m.status = MilestoneStatus::Approved;
            job.milestones.set(milestone_index, m.clone());

            // Release escrow via ICC
            let escrow_address: Address = env
                .storage()
                .instance()
                .get(&DataKey::EscrowContract)
                .unwrap();

            let args: Vec<soroban_sdk::Val> = vec![
                &env,
                job_id.into_val(&env),
                milestone_index.into_val(&env),
                job.freelancer.into_val(&env),
                m.amount.into_val(&env),
            ];
            env.invoke_contract::<()>(
                &escrow_address,
                &Symbol::new(&env, "release_milestone"),
                args,
            );
        } else {
            m.status = MilestoneStatus::Pending;
            job.milestones.set(milestone_index, m);
        }

        // Recalculate job status
        let mut all_done = true;
        let mut in_dispute = false;
        let mut under_review = false;

        for i in 0..job.milestones.len() {
            let ms = job.milestones.get(i).unwrap();
            match ms.status {
                MilestoneStatus::Approved => {}
                MilestoneStatus::Disputed => {
                    all_done = false;
                    in_dispute = true;
                }
                MilestoneStatus::Submitted => {
                    all_done = false;
                    under_review = true;
                }
                MilestoneStatus::Pending => {
                    all_done = false;
                }
            }
        }

        job.status = if all_done {
            JobStatus::Completed
        } else if in_dispute {
            JobStatus::Disputed
        } else if under_review {
            JobStatus::UnderReview
        } else {
            JobStatus::InProgress
        };

        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events()
            .publish(("milestone", "resolved"), (job_id, milestone_index, approve));
    }

    /// Cancel a job (only if open/funded and no freelancer assigned).
    pub fn cancel_job(env: Env, job_id: u64, client: Address) {
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        client.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.client != client {
            env.panic_with_error(Error::NotClient);
        }
        if job.status != JobStatus::Open && job.status != JobStatus::Funded {
            env.panic_with_error(Error::CannotCancel);
        }

        if job.status == JobStatus::Funded {
            // Inter-contract call: refund escrow
            let escrow_address: Address = env
                .storage()
                .instance()
                .get(&DataKey::EscrowContract)
                .unwrap();

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
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        let escrow_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::EscrowContract)
            .unwrap();
        
        escrow_address.require_auth();

        let mut job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();

        if job.status != JobStatus::Open {
            env.panic_with_error(Error::JobNotOpen);
        }

        job.status = JobStatus::Funded;
        env.storage().instance().set(&DataKey::Job(job_id), &job);
        env.events().publish(("job", "funded"), job_id);
    }

    /// Admin: register the Reputation Contract address for ICC.
    /// Can only be called once (guards against re-initialization).
    pub fn set_reputation_contract(env: Env, caller: Address, reputation_contract: Address) {
        Self::check_initialized(&env);
        caller.require_auth();
        // Only allow setting if not already set
        if env.storage().instance().has(&DataKey::ReputationContract) {
            env.panic_with_error(Error::AlreadyInitialized);
        }
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().instance().extend_ttl(4096, 50000);
        env.events()
            .publish(("contract", "reputation_linked"), reputation_contract);
    }

    /* ─── Read functions ─── */

    pub fn get_job(env: Env, job_id: u64) -> Job {
        env.storage().instance().extend_ttl(4096, 50000);
        env.storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap()
    }

    pub fn get_job_count(env: Env) -> u64 {
        env.storage().instance().extend_ttl(4096, 50000);
        env.storage()
            .instance()
            .get(&DataKey::JobCount)
            .unwrap_or(0)
    }

    pub fn get_client_jobs(env: Env, client: Address) -> Vec<u64> {
        env.storage().instance().extend_ttl(4096, 50000);
        env.storage()
            .instance()
            .get(&DataKey::ClientJobs(client))
            .unwrap_or(vec![&env])
    }

    pub fn get_freelancer_jobs(env: Env, freelancer: Address) -> Vec<u64> {
        env.storage().instance().extend_ttl(4096, 50000);
        env.storage()
            .instance()
            .get(&DataKey::FreelancerJobs(freelancer))
            .unwrap_or(vec![&env])
    }

    /// Returns the numeric discriminant of the job's status.
    /// Used by the Reputation Contract ICC to verify completion.
    /// Open=0, Funded=1, InProgress=2, UnderReview=3, Completed=4, Disputed=5, Cancelled=6
    pub fn get_job_status(env: Env, job_id: u64) -> u32 {
        env.storage().instance().extend_ttl(4096, 50000);
        let job: Job = env
            .storage()
            .instance()
            .get(&DataKey::Job(job_id))
            .unwrap();
        match job.status {
            JobStatus::Open       => 0,
            JobStatus::Funded     => 1,
            JobStatus::InProgress => 2,
            JobStatus::UnderReview=> 3,
            JobStatus::Completed  => 4,
            JobStatus::Disputed   => 5,
            JobStatus::Cancelled  => 6,
        }
    }

    /* ─── Helpers ─── */

    fn check_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::Initialized) {
            env.panic_with_error(Error::NotInitialized);
        }
    }
}

mod test;
