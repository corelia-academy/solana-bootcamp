//! Savings Vault: mỗi người có một vault PDA (seeds = ["vault", owner]) để gửi
//! SOL. Theo thiết kế, chỉ chủ vault mới rút được SOL của chính mình.
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn vault_pda(program_id: &Pubkey, owner: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"vault", owner.as_ref()], program_id)
}

#[derive(BorshSerialize, BorshDeserialize)]
pub enum VaultInstruction {
    /// Rút toàn bộ SOL của vault về recipient.
    /// Accounts: [owner (signer), vault (writable), recipient (writable)]
    WithdrawAll,
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    match VaultInstruction::try_from_slice(data)
        .map_err(|_| ProgramError::InvalidInstructionData)?
    {
        VaultInstruction::WithdrawAll => withdraw_all(program_id, accounts),
    }
}

fn withdraw_all(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let iter = &mut accounts.iter();
    let owner = next_account_info(iter)?;
    let vault = next_account_info(iter)?;
    let recipient = next_account_info(iter)?;

    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if vault.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // BUG: không derive lại PDA từ owner.key để so với vault được truyền vào.
    // Người ký có thể đưa vault của bất kỳ ai khác.

    let amount = vault.lamports();
    **vault.try_borrow_mut_lamports()? -= amount;
    **recipient.try_borrow_mut_lamports()? += amount;
    Ok(())
}
