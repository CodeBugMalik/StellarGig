#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_env() -> (Env, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    let job_contract = Address::generate(&env);
    client.initialize(&job_contract);

    (env, contract_id)
}

#[test]
fn test_fund_job() {
    let (env, contract_id) = setup_env();
    let client = EscrowContractClient::new(&env, &contract_id);
    let funder = Address::generate(&env);

    client.fund_job(&funder, &1, &500_0000000);

    let deposit = client.get_escrow(&1);
    assert_eq!(deposit.total_amount, 500_0000000);
    assert_eq!(deposit.released_amount, 0);
    assert!(deposit.is_active);
    assert_eq!(client.get_total_escrowed(), 500_0000000);
}

#[test]
fn test_release_milestone() {
    let (env, contract_id) = setup_env();
    let client = EscrowContractClient::new(&env, &contract_id);
    let funder = Address::generate(&env);
    let freelancer = Address::generate(&env);

    client.fund_job(&funder, &1, &300_0000000);
    client.release_milestone(&1, &0, &freelancer, &100_0000000);

    let deposit = client.get_escrow(&1);
    assert_eq!(deposit.released_amount, 100_0000000);
    assert!(deposit.is_active);

    // Release remaining
    client.release_milestone(&1, &1, &freelancer, &200_0000000);
    let deposit = client.get_escrow(&1);
    assert_eq!(deposit.released_amount, 300_0000000);
    assert!(!deposit.is_active); // fully released
}

#[test]
fn test_refund() {
    let (env, contract_id) = setup_env();
    let client = EscrowContractClient::new(&env, &contract_id);
    let funder = Address::generate(&env);

    client.fund_job(&funder, &1, &400_0000000);
    assert_eq!(client.get_total_escrowed(), 400_0000000);

    client.refund(&1, &funder);

    let deposit = client.get_escrow(&1);
    assert!(!deposit.is_active);
    assert_eq!(client.get_total_escrowed(), 0);
}
