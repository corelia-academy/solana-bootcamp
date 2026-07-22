use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    program_error::ProgramError,
};

use crate::state::Oracle;

pub fn update(
    accounts: &[AccountInfo],
    price: u64,
) -> Result<(), ProgramError> {
    let account_iter = &mut accounts.iter();
    let oracle_account = next_account_info(account_iter)?;
    let signer = next_account_info(account_iter)?;

    let mut data = oracle_account.data.borrow_mut();
    let mut oracle = Oracle::try_from_slice(&data)?;

    if !signer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Missing check on oracle.owner
    // Any signer can update price without oracle.owner's authorization

    oracle.price = price;
    oracle.serialize(&mut &mut data[..])?;

    Ok(())
}
