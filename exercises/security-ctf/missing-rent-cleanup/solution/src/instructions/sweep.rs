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

// Any one can call to sweep excess SOL above locked amount in the PDA
pub fn sweep(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    bump: u8,
) -> Result<(), ProgramError> {
    let account_iter = &mut accounts.iter();
    let payer = next_account_info(account_iter)?;
    let owner = next_account_info(account_iter)?;
    let pda = next_account_info(account_iter)?;
    let sys_program = next_account_info(account_iter)?;

    if !payer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    if *pda.key != get_pda(program_id, owner.key, bump)? {
        return Err(ProgramError::InvalidSeeds);
    }

    // Load lock state
    let lock_amt = {
        let data = pda.data.borrow();
        let lock = Lock::try_from_slice(&data)?;
        lock.amt
    }; // Drop borrow here

    // Get PDA balance and transfer lamports directly
    let pda_lamports = pda.lamports();
    if pda_lamports > lock_amt {
        let diff = pda_lamports - lock_amt;

        **pda.try_borrow_mut_lamports()? -= diff;
        **payer.try_borrow_mut_lamports()? = payer
            .lamports()
            .checked_add(diff)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    }

    Ok(())
}
