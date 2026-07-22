use borsh::BorshDeserialize;
use litesvm::LiteSVM;
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    signature::{Keypair, Signer},
    transaction::Transaction,
};

use oracle::{Cmd, state::Oracle};

#[test]
fn test() {
    let mut svm = LiteSVM::new();

    let owner = Keypair::new();
    let attacker = Keypair::new();
    let oracle = Keypair::new();
    let program_keypair = Keypair::new();
    let program_id = program_keypair.pubkey();
    svm.add_program_from_file(program_id, "target/deploy/oracle.so")
        .unwrap();

    svm.airdrop(&owner.pubkey(), 1_000_000_000).unwrap();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();

    let oracle_account = Account {
        lamports: 1_000_000,
        owner: program_id,
        data: vec![0u8; std::mem::size_of::<Oracle>()],
        ..Account::default()
    };
    svm.set_account(oracle.pubkey(), oracle_account).unwrap();

    // Init
    let init_ix = Instruction {
        program_id,
        accounts: vec![AccountMeta::new(oracle.pubkey(), false)],
        data: borsh::to_vec(&Cmd::Init(owner.pubkey(), 123)).unwrap(),
    };

    svm.send_transaction(Transaction::new_signed_with_payer(
        &[init_ix],
        Some(&owner.pubkey()),
        &[&owner],
        svm.latest_blockhash(),
    ))
    .unwrap();

    let data = svm.get_account(&oracle.pubkey()).unwrap().data;
    let oracle_state = Oracle::try_from_slice(&data).unwrap();
    assert_eq!(oracle_state.owner, owner.pubkey());
    assert_eq!(oracle_state.price, 123);

    // Write your code here - send transaction using the attacker's keypair

    let data = svm.get_account(&oracle.pubkey()).unwrap().data;
    let oracle_state = Oracle::try_from_slice(&data).unwrap();
    assert_eq!(oracle_state.price, 1234);
}
