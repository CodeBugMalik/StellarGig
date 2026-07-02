#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String, Vec};

/* ─── Mock Escrow Contract for Testing ─── */

#[contract]
pub struct MockEscrowContract;

#[contractimpl]
impl MockEscrowContract {
    pub fn release_milestone(_env: Env, _job_id: u64, _milestone_index: u32, _freelancer: Address, _amount: i128) {
        // Stub to satisfy ICC release calls
    }
    pub fn refund(_env: Env, _job_id: u64, _client: Address) {
        // Stub to satisfy ICC refund calls
    }
}

fn setup_env() -> (Env, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(JobContract, ());
    let client = JobContractClient::new(&env, &contract_id);

    let escrow_addr = env.register(MockEscrowContract, ());
    client.initialize(&escrow_addr);

    (env, contract_id, escrow_addr)
}

fn make_milestones(env: &Env) -> Vec<Milestone> {
    let mut milestones = Vec::new(env);
    milestones.push_back(Milestone {
        description: String::from_str(env, "Design mockups"),
        amount: 100_0000000,
        status: MilestoneStatus::Pending,
        deadline: 0,
    });
    milestones.push_back(Milestone {
        description: String::from_str(env, "Build frontend"),
        amount: 200_0000000,
        status: MilestoneStatus::Pending,
        deadline: 0,
    });
    milestones
}

#[test]
fn test_create_job() {
    let (env, contract_id, _) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &user,
        &String::from_str(&env, "Build a dApp"),
        &String::from_str(&env, "Full stack Stellar dApp"),
        &milestones,
    );

    assert_eq!(job_id, 1);
    assert_eq!(client.get_job_count(), 1);

    let job = client.get_job(&1);
    assert_eq!(job.status, JobStatus::Open);
    assert_eq!(job.total_amount, 300_0000000);
    assert_eq!(job.milestones.len(), 2);
}

#[test]
fn test_accept_job_and_submit_milestone() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Test job"),
        &String::from_str(&env, "Description"),
        &milestones,
    );

    // Mark as funded (must be called from escrow_addr now!)
    env.as_contract(&escrow_addr, || {
        client.mark_funded(&job_id);
    });
    
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Funded);

    // Freelancer accepts
    client.accept_job(&job_id, &freelancer);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::InProgress);
    assert_eq!(job.freelancer, freelancer);

    // Submit milestone 0
    client.submit_milestone(&job_id, &0, &freelancer);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::UnderReview);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        MilestoneStatus::Submitted
    );
}

#[test]
fn test_approve_milestone() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Approve test"),
        &String::from_str(&env, "Description"),
        &milestones,
    );

    env.as_contract(&escrow_addr, || {
        client.mark_funded(&job_id);
    });

    client.accept_job(&job_id, &freelancer);
    client.submit_milestone(&job_id, &0, &freelancer);

    // Client approves milestone 0
    client.approve_milestone(&job_id, &0, &owner);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::InProgress);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        MilestoneStatus::Approved
    );
}

#[test]
fn test_dispute_milestone() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Dispute test"),
        &String::from_str(&env, "Test disputes"),
        &milestones,
    );

    env.as_contract(&escrow_addr, || {
        client.mark_funded(&job_id);
    });
    client.accept_job(&job_id, &freelancer);
    client.submit_milestone(&job_id, &0, &freelancer);

    // Client disputes
    client.dispute_milestone(&job_id, &0, &owner);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Disputed);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        MilestoneStatus::Disputed
    );
}

#[test]
fn test_resolve_dispute_approve() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Resolve approve test"),
        &String::from_str(&env, "Description"),
        &milestones,
    );

    env.as_contract(&escrow_addr, || {
        client.mark_funded(&job_id);
    });
    client.accept_job(&job_id, &freelancer);
    client.submit_milestone(&job_id, &0, &freelancer);
    client.dispute_milestone(&job_id, &0, &owner);

    // Client resolves dispute in favor of freelancer (approves)
    client.resolve_dispute(&job_id, &0, &owner, &true);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::InProgress);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        MilestoneStatus::Approved
    );
}

#[test]
fn test_resolve_dispute_reject() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);
    let freelancer = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Resolve reject test"),
        &String::from_str(&env, "Description"),
        &milestones,
    );

    env.as_contract(&escrow_addr, || {
        client.mark_funded(&job_id);
    });
    client.accept_job(&job_id, &freelancer);
    client.submit_milestone(&job_id, &0, &freelancer);
    client.dispute_milestone(&job_id, &0, &owner);

    // Client resolves dispute by rejecting (moves back to Pending for freelancer to redo)
    client.resolve_dispute(&job_id, &0, &owner, &false);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::InProgress);
    assert_eq!(
        job.milestones.get(0).unwrap().status,
        MilestoneStatus::Pending
    );
}

#[test]
fn test_cancel_open_job() {
    let (env, contract_id, _) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Cancel test"),
        &String::from_str(&env, "Will be cancelled"),
        &milestones,
    );

    client.cancel_job(&job_id, &owner);
    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Cancelled);
}

#[test]
#[should_panic]
fn test_create_job_empty_title() {
    let (env, contract_id, _) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let user = Address::generate(&env);
    let milestones = make_milestones(&env);

    client.create_job(
        &user,
        &String::from_str(&env, ""),
        &String::from_str(&env, "Description"),
        &milestones,
    );
}

#[test]
#[should_panic]
fn test_accept_job_self_dealing() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    let owner = Address::generate(&env);

    let milestones = make_milestones(&env);
    let job_id = client.create_job(
        &owner,
        &String::from_str(&env, "Self deal"),
        &String::from_str(&env, "Description"),
        &milestones,
    );

    env.as_contract(&escrow_addr, || {
        client.mark_funded(&job_id);
    });

    // Client trying to accept their own job -> should panic
    client.accept_job(&job_id, &owner);
}

#[test]
#[should_panic]
fn test_double_initialization() {
    let (env, contract_id, escrow_addr) = setup_env();
    let client = JobContractClient::new(&env, &contract_id);
    client.initialize(&escrow_addr);
}
