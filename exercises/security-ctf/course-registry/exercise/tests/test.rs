use borsh::BorshDeserialize;
use course_registry::{Course, CourseInstruction};
use litesvm::LiteSVM;
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
    svm.add_program_from_file(program_id, "target/deploy/course_registry.so")
        .unwrap();

    let admin = Keypair::new();
    let attacker = Keypair::new();
    svm.airdrop(&admin.pubkey(), 1_000_000_000).unwrap();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();

    let course = Pubkey::new_unique();
    svm.set_account(
        course,
        Account {
            lamports: Rent::default().minimum_balance(Course::LEN),
            data: vec![0; Course::LEN],
            owner: program_id,
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();

    // Admin tạo khóa học với giá 1_000_000.
    let create = Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(course, false),
            AccountMeta::new_readonly(admin.pubkey(), true),
        ],
        data: borsh::to_vec(&CourseInstruction::Create { price: 1_000_000 }).unwrap(),
    };
    svm.send_transaction(Transaction::new_signed_with_payer(
        &[create],
        Some(&admin.pubkey()),
        &[&admin],
        svm.latest_blockhash(),
    ))
    .unwrap();

    // ------------------------------------------------------------------
    // Viết code tấn công ở đây: dùng ví `attacker` đưa giá khóa học về 0
    // mà admin không ký transaction. Chỉ được ký bằng `attacker`.
    // ------------------------------------------------------------------
    // TODO: viết transaction khai thác ở đây, ký bằng `attacker`.


    let state = Course::try_from_slice(&svm.get_account(&course).unwrap().data).unwrap();
    assert_eq!(state.price, 0, "Exploit chưa thành công: giá vẫn là {}", state.price);
}
