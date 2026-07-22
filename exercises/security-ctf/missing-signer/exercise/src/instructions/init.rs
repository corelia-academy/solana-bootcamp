use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{AccountInfo, next_account_info},
    program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::state::Oracle;

pub fn init(
    accounts: &[AccountInfo],
    owner: Pubkey,
    price: u64,
) -> Result<(), ProgramError> {
    let account_iter = &mut accounts.iter();
    let oracle_account = next_account_info(account_iter)?;

    let mut data = oracle_account.data.borrow_mut();
    let mut oracle = Oracle::try_from_slice(&data)?;

    // Check oracle account is not initialized
    if oracle.owner != Pubkey::default() {
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    oracle.owner = owner;
    oracle.price = price;
    oracle.serialize(&mut &mut data[..])?;

    Ok(())
}
