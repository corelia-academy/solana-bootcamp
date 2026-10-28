use borsh::BorshDeserialize;
use litesvm::LiteSVM;
use scoreboard::{Board, BoardInstruction};
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    rent::Rent,
    signature::{Keypair, Signer},
    transaction::Transaction,
};

#[test]
fn exploit() {
    let mut svm = LiteSVM::new();
    let program_id = Pubkey::new_unique();
    svm.add_program_from_file(program_id, "target/deploy/scoreboard.so")
        .unwrap();

    let organizer = Keypair::new();
    let attacker = Keypair::new();
    svm.airdrop(&organizer.pubkey(), 1_000_000_000).unwrap();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();

    let board = Pubkey::new_unique();
    svm.set_account(
        board,
        Account {
            lamports: Rent::default().minimum_balance(Board::LEN),
            data: vec![0; Board::LEN],
            owner: program_id,
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();

    // Ban tổ chức khởi tạo bảng xếp hạng.
    let init = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(board, false),
            AccountMeta::new_readonly(organizer.pubkey(), true),
        ],
        data: borsh::to_vec(&BoardInstruction::Init).unwrap(),
    };
    svm.send_transaction(Transaction::new_signed_with_payer(
        &[init],
        Some(&organizer.pubkey()),
        &[&organizer],
        svm.latest_blockhash(),
    ))
    .unwrap();

    // ------------------------------------------------------------------
    // Viết code tấn công ở đây: dùng ví `attacker` tự ghi mình là người
    // dẫn đầu với 1_000_000 điểm. Chỉ được ký bằng `attacker`.
    // ------------------------------------------------------------------
    // TODO: viết transaction khai thác ở đây, ký bằng `attacker`.


    let state = Board::try_from_slice(&svm.get_account(&board).unwrap().data).unwrap();
    assert_eq!(state.leader, attacker.pubkey(), "Exploit chưa thành công: leader chưa phải attacker");
    assert_eq!(state.top_score, 1_000_000);
}
