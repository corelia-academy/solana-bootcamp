//! Ticket Refund: mỗi vé sự kiện là một account giữ tiền cọc của người mua.
//! Account được nạp dư lamports (cọc + rent-exempt reserve). Instruction `sweep`
//! nhằm trả lại phần lamports NGOÀI tiền cọc cho người mua.
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Ticket {
    pub is_initialized: bool,
    pub buyer: Pubkey,
    pub deposit: u64,
}

impl Ticket {
    pub const LEN: usize = 1 + 32 + 8;
}

#[derive(BorshSerialize, BorshDeserialize)]
pub enum TicketInstruction {
    /// Trả phần lamports vượt quá tiền cọc về recipient.
    /// Accounts: [caller (signer), ticket (writable), recipient (writable)]
    Sweep,
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    match TicketInstruction::try_from_slice(data)
        .map_err(|_| ProgramError::InvalidInstructionData)?
    {
        TicketInstruction::Sweep => sweep(program_id, accounts),
    }
}

fn sweep(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let iter = &mut accounts.iter();
    let caller = next_account_info(iter)?;
    let ticket_account = next_account_info(iter)?;
    let recipient = next_account_info(iter)?;

    if !caller.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if ticket_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    let ticket = Ticket::try_from_slice(&ticket_account.try_borrow_data()?)?;

    // BUG: chỉ giữ lại đúng `deposit`, quét luôn cả rent-exempt reserve.
    // Cũng không kiểm tra caller/recipient có phải buyer.
    let keep = ticket.deposit;
    let balance = ticket_account.lamports();
    if balance > keep {
        let diff = balance - keep;
        **ticket_account.try_borrow_mut_lamports()? -= diff;
        **recipient.try_borrow_mut_lamports()? += diff;
    }
    Ok(())
}
