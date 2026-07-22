use borsh::BorshDeserialize;
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{Sysvar, clock::Clock},
};

use super::lib::get_pda;
use crate::state::Lock;

pub fn unlock(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    bump: u8,
) -> Result<(), ProgramError> {
    let account_iter = &mut accounts.iter();
    let payer = next_account_info(account_iter)?;
    let pda = next_account_info(account_iter)?;
    let sys_program = next_account_info(account_iter)?;

    // Missing check that pda from input matches PDA calculated in this program
    // Caller can drain arbitrary PDA owned by this program

    // Load lock state
    let lock_exp = {
        let data = pda.data.borrow();
        let lock = Lock::try_from_slice(&data)?;
        lock.exp
    }; // Drop borrow here

    // Verify lock has expired
    let clock = Clock::get()?;
    let now: u64 = clock.unix_timestamp.try_into().unwrap();
    if lock_exp >= now {
        return Err(ProgramError::InvalidArgument);
    }

    // Get PDA balance and transfer lamports directly
    // Rent + locked amount
    let pda_lamports = pda.lamports();

    **pda.try_borrow_mut_lamports()? = 0;
    **payer.try_borrow_mut_lamports()? = payer
        .lamports()
        .checked_add(pda_lamports)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    // Clear out data
    pda.resize(0)?;

    // Assign the account to the System Program
    pda.assign(sys_program.key);

    Ok(())
}
