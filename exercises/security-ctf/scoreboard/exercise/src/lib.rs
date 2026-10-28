//! Scoreboard: bảng xếp hạng của một giải đấu. Theo thiết kế, chỉ ban tổ chức
//! (authority lưu trong board) mới được ghi người dẫn đầu.
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Board {
    pub is_initialized: bool,
    pub authority: Pubkey,
    pub leader: Pubkey,
    pub top_score: u64,
}

impl Board {
    pub const LEN: usize = 1 + 32 + 32 + 8;
}

#[derive(BorshSerialize, BorshDeserialize)]
pub enum BoardInstruction {
    /// Accounts: [board (writable), authority (signer)]
    Init,
    /// Accounts: [board (writable), authority (signer)]
    RecordLeader { leader: Pubkey, score: u64 },
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    match BoardInstruction::try_from_slice(data)
        .map_err(|_| ProgramError::InvalidInstructionData)?
    {
        BoardInstruction::Init => init(program_id, accounts),
        BoardInstruction::RecordLeader { leader, score } => {
            record_leader(program_id, accounts, leader, score)
        }
    }
}

fn init(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let iter = &mut accounts.iter();
    let board_account = next_account_info(iter)?;
    let authority = next_account_info(iter)?;

    if board_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    let mut data = board_account.try_borrow_mut_data()?;
    if Board::try_from_slice(&data)?.is_initialized {
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    Board {
        is_initialized: true,
        authority: *authority.key,
        leader: Pubkey::default(),
        top_score: 0,
    }
    .serialize(&mut &mut data[..])?;
    Ok(())
}

fn record_leader(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    leader: Pubkey,
    score: u64,
) -> ProgramResult {
    let iter = &mut accounts.iter();
    let board_account = next_account_info(iter)?;
    let authority = next_account_info(iter)?;

    if board_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    // BUG: kiểm tra có ký nhưng không kiểm tra có phải board.authority.
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let mut data = board_account.try_borrow_mut_data()?;
    let mut board = Board::try_from_slice(&data)?;
    board.leader = leader;
    board.top_score = score;
    board.serialize(&mut &mut data[..])?;
    Ok(())
}
