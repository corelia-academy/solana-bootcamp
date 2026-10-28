//! Course Registry: lưu giá của từng khóa học. Theo thiết kế, chỉ admin của
//! khóa học mới được đổi giá.
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub struct Course {
    pub is_initialized: bool,
    pub admin: Pubkey,
    pub price: u64,
}

impl Course {
    pub const LEN: usize = 1 + 32 + 8;
}

#[derive(BorshSerialize, BorshDeserialize)]
pub enum CourseInstruction {
    /// Accounts: [course (writable), admin (signer)]
    Create { price: u64 },
    /// Accounts: [course (writable), admin]
    SetPrice { price: u64 },
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    match CourseInstruction::try_from_slice(data)
        .map_err(|_| ProgramError::InvalidInstructionData)?
    {
        CourseInstruction::Create { price } => create(program_id, accounts, price),
        CourseInstruction::SetPrice { price } => set_price(program_id, accounts, price),
    }
}

fn create(program_id: &Pubkey, accounts: &[AccountInfo], price: u64) -> ProgramResult {
    let iter = &mut accounts.iter();
    let course_account = next_account_info(iter)?;
    let admin = next_account_info(iter)?;

    if course_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    if !admin.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    let mut data = course_account.try_borrow_mut_data()?;
    if Course::try_from_slice(&data)?.is_initialized {
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    Course {
        is_initialized: true,
        admin: *admin.key,
        price,
    }
    .serialize(&mut &mut data[..])?;
    Ok(())
}

fn set_price(program_id: &Pubkey, accounts: &[AccountInfo], price: u64) -> ProgramResult {
    let iter = &mut accounts.iter();
    let course_account = next_account_info(iter)?;
    let admin = next_account_info(iter)?;

    if course_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    let mut data = course_account.try_borrow_mut_data()?;
    let mut course = Course::try_from_slice(&data)?;

    // BUG: chỉ so khóa admin, không kiểm tra account đó có ký hay không.
    if course.admin != *admin.key {
        return Err(ProgramError::IllegalOwner);
    }

    course.price = price;
    course.serialize(&mut &mut data[..])?;
    Ok(())
}
