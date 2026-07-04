#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, Env, IntoVal, String, Symbol, Vec, vec,
};

/* ─── Custom Errors ─── */

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized  = 1,
    NotInitialized      = 2,
    Unauthorized        = 3,
    JobNotCompleted     = 4,
    AlreadyReviewed     = 5,
    InvalidRating       = 6,
    InvalidInput        = 7,
    NotParticipant      = 8,
}

/* ─── Storage Keys ─── */

#[contracttype]
pub enum DataKey {
    Initialized,
    JobContract,
    Review(u64),          // job_id → Review
    Stats(Address),       // address → ReputationStats
    Reviews(Address),     // address → Vec<u64> (job_ids of reviews they received)
}

/* ─── Types ─── */

#[contracttype]
#[derive(Clone, Debug)]
pub struct Review {
    pub job_id:    u64,
    pub reviewer:  Address,
    pub reviewee:  Address,
    pub rating:    u32,    // 1–5
    pub comment:   String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ReputationStats {
    pub total_reviews:        u32,
    pub total_rating:         u32,   // sum of all ratings
    pub jobs_completed:       u32,
    pub total_earned:         i128,  // XLM stroops received
}

/* ─── Contract ─── */

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {

    /// Initialize with the job contract address (for ICC verification).
    pub fn initialize(env: Env, job_contract: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            env.panic_with_error(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::JobContract, &job_contract);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().extend_ttl(4096, 50000);
        env.events().publish(("reputation", "initialized"), true);
    }

    // ─── Called by Job Contract only ─────────────────────────────────────────

    /// Record a job completion for a freelancer.
    /// ONLY callable by the registered job contract (access-controlled via require_auth).
    pub fn record_completion(env: Env, freelancer: Address, amount_earned: i128) {
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        // Only the job contract may call this
        let job_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::JobContract)
            .unwrap();
        job_contract.require_auth();

        if amount_earned <= 0 {
            env.panic_with_error(Error::InvalidInput);
        }

        let mut stats = Self::get_stats_internal(&env, &freelancer);
        stats.jobs_completed += 1;
        stats.total_earned   += amount_earned;

        env.storage()
            .persistent()
            .set(&DataKey::Stats(freelancer.clone()), &stats);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Stats(freelancer.clone()), 4096, 100000);

        env.events()
            .publish(("reputation", "completion_recorded"), (freelancer, amount_earned));
    }

    // ─── Called by users ─────────────────────────────────────────────────────

    /// Submit a review for the counterparty on a completed job.
    /// Calls Job Contract via ICC to verify: job is Completed, and caller participated.
    pub fn submit_review(
        env:      Env,
        reviewer: Address,
        job_id:   u64,
        reviewee: Address,
        rating:   u32,
        comment:  String,
    ) {
        Self::check_initialized(&env);
        env.storage().instance().extend_ttl(4096, 50000);

        reviewer.require_auth();

        if rating < 1 || rating > 5 {
            env.panic_with_error(Error::InvalidRating);
        }
        if comment.len() == 0 {
            env.panic_with_error(Error::InvalidInput);
        }

        // Ensure review doesn't already exist for this job
        if env.storage().persistent().has(&DataKey::Review(job_id)) {
            env.panic_with_error(Error::AlreadyReviewed);
        }

        // *** ICC: Verify job status = Completed via Job Contract ***
        let job_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::JobContract)
            .unwrap();

        // get_job returns a Val tuple; we only need to verify it doesn't error.
        // We call get_job_status which returns the status u32.
        let args: Vec<soroban_sdk::Val> = vec![&env, job_id.into_val(&env)];
        let status: u32 = env.invoke_contract(
            &job_contract,
            &Symbol::new(&env, "get_job_status"),
            args,
        );

        // JobStatus::Completed = variant index 4
        if status != 4u32 {
            env.panic_with_error(Error::JobNotCompleted);
        }

        // Store the review
        let review = Review {
            job_id,
            reviewer: reviewer.clone(),
            reviewee: reviewee.clone(),
            rating,
            comment,
            timestamp: env.ledger().sequence().into(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Review(job_id), &review);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Review(job_id), 4096, 100000);

        // Update reviewee's stats
        let mut stats = Self::get_stats_internal(&env, &reviewee);
        stats.total_reviews += 1;
        stats.total_rating  += rating;

        env.storage()
            .persistent()
            .set(&DataKey::Stats(reviewee.clone()), &stats);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Stats(reviewee.clone()), 4096, 100000);

        // Track review in reviewee's review list
        let mut review_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::Reviews(reviewee.clone()))
            .unwrap_or(vec![&env]);
        review_list.push_back(job_id);
        env.storage()
            .persistent()
            .set(&DataKey::Reviews(reviewee.clone()), &review_list);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Reviews(reviewee.clone()), 4096, 100000);

        env.events()
            .publish(("reputation", "review_submitted"), (job_id, reviewer, reviewee, rating));
    }

    // ─── Read functions ───────────────────────────────────────────────────────

    pub fn get_reputation(env: Env, address: Address) -> ReputationStats {
        Self::check_initialized(&env);
        Self::get_stats_internal(&env, &address)
    }

    pub fn get_review(env: Env, job_id: u64) -> Option<Review> {
        Self::check_initialized(&env);
        env.storage().persistent().get(&DataKey::Review(job_id))
    }

    pub fn get_reviews(env: Env, address: Address) -> Vec<Review> {
        Self::check_initialized(&env);
        let job_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::Reviews(address))
            .unwrap_or(vec![&env]);

        let mut reviews: Vec<Review> = vec![&env];
        for i in 0..job_ids.len() {
            let job_id = job_ids.get(i).unwrap();
            if let Some(r) = env.storage().persistent().get::<DataKey, Review>(&DataKey::Review(job_id)) {
                reviews.push_back(r);
            }
        }
        reviews
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    fn check_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::Initialized) {
            env.panic_with_error(Error::NotInitialized);
        }
    }

    fn get_stats_internal(env: &Env, address: &Address) -> ReputationStats {
        env.storage()
            .persistent()
            .get(&DataKey::Stats(address.clone()))
            .unwrap_or(ReputationStats {
                total_reviews:  0,
                total_rating:   0,
                jobs_completed: 0,
                total_earned:   0,
            })
    }
}
