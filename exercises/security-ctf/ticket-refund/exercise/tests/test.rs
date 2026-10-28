use borsh::BorshSerialize;
use litesvm::LiteSVM;
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    rent::Rent,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use ticket_refund::{Ticket, TicketInstruction};

#[test]
fn exploit() {
    let mut svm = LiteSVM::new();
    let program_id = Pubkey::new_unique();
    svm.add_program_from_file(program_id, "target/deploy/ticket_refund.so")
        .unwrap();

    let buyer = Keypair::new();
    let attacker = Keypair::new();
    svm.airdrop(&attacker.pubkey(), 1_000_000_000).unwrap();

    // Vé giữ tiền cọc 1 SOL + rent-exempt reserve cho kích thước account.
    let deposit = 1_000_000_000u64;
    let rent = Rent::default().minimum_balance(Ticket::LEN);
    let ticket = Pubkey::new_unique();
    let mut data = vec![0u8; Ticket::LEN];
    Ticket {
        is_initialized: true,
        buyer: buyer.pubkey(),
        deposit,
    }
    .serialize(&mut &mut data[..])
    .unwrap();
    svm.set_account(
        ticket,
        Account {
            lamports: deposit + rent,
            data,
            owner: program_id,
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();

    let before = svm.get_account(&attacker.pubkey()).unwrap().lamports;

    // ------------------------------------------------------------------
    // Viết code tấn công ở đây: attacker quét phần rent-exempt reserve của
    // vé về ví mình, khiến account tụt xuống dưới mức miễn rent. Chỉ được
    // ký bằng `attacker`.
    // ------------------------------------------------------------------
    // TODO: viết transaction khai thác ở đây, ký bằng `attacker`.


    // Account tụt về đúng `deposit`, mất rent reserve.
    assert_eq!(svm.get_account(&ticket).unwrap().lamports, deposit);
    assert!(deposit < rent + deposit);
    let after = svm.get_account(&attacker.pubkey()).unwrap().lamports;
    assert!(after > before, "attacker chưa lấy được rent reserve");
    assert!(
        svm.get_account(&ticket).unwrap().lamports < Rent::default().minimum_balance(Ticket::LEN) + deposit,
        "rent reserve chưa bị rút"
    );
}
