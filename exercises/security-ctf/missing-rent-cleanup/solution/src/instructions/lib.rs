use solana_program::pubkey::{Pubkey, PubkeyError};

pub fn get_pda(
    program_id: &Pubkey,
    payer: &Pubkey,
    bump: u8,
) -> Result<Pubkey, PubkeyError> {
    Pubkey::create_program_address(
        &[b"lock", payer.as_ref(), &[bump]],
        program_id,
    )
}
