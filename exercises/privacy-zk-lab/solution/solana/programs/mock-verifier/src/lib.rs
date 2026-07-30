use anchor_lang::prelude::*;

declare_id!("mBKqcnGotbsSb5vNrdyhzZ5EhqZdids9QYiTRckvi7v");

#[program]
pub mod mock_verifier {
    use super::*;

    /// Creates a verifier-owned context bound to the public inputs.
    ///
    /// SECURITY: this instruction verifies no cryptographic proof. It exists only to teach the
    /// account/CPI boundary that a production verifier would expose.
    pub fn verify_fixture(
        ctx: Context<VerifyFixture>,
        root: [u8; 32],
        nullifier: [u8; 32],
        output_commitment: [u8; 32],
        domain: [u8; 32],
    ) -> Result<()> {
        let verified = &mut ctx.accounts.verified_context;
        verified.authority = ctx.accounts.authority.key();
        verified.root = root;
        verified.nullifier = nullifier;
        verified.output_commitment = output_commitment;
        verified.domain = domain;
        verified.bump = ctx.bumps.verified_context;
        Ok(())
    }

    /// CPI target used by the application. Account deserialization proves that `verified_context`
    /// is owned by this program; field checks bind the context to this exact state transition.
    pub fn assert_context(
        ctx: Context<AssertContext>,
        root: [u8; 32],
        nullifier: [u8; 32],
        output_commitment: [u8; 32],
        domain: [u8; 32],
    ) -> Result<()> {
        let verified = &ctx.accounts.verified_context;
        require_keys_eq!(
            verified.authority,
            ctx.accounts.authority.key(),
            MockVerifierError::AuthorityMismatch
        );
        require!(verified.root == root, MockVerifierError::RootMismatch);
        require!(
            verified.nullifier == nullifier,
            MockVerifierError::NullifierMismatch
        );
        require!(
            verified.output_commitment == output_commitment,
            MockVerifierError::OutputMismatch
        );
        require!(verified.domain == domain, MockVerifierError::DomainMismatch);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(_root: [u8; 32], nullifier: [u8; 32])]
pub struct VerifyFixture<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + VerifiedContext::INIT_SPACE,
        seeds = [b"verified", authority.key().as_ref(), nullifier.as_ref()],
        bump
    )]
    pub verified_context: Account<'info, VerifiedContext>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssertContext<'info> {
    pub authority: Signer<'info>,
    pub verified_context: Account<'info, VerifiedContext>,
}

#[account]
#[derive(InitSpace)]
pub struct VerifiedContext {
    pub authority: Pubkey,
    pub root: [u8; 32],
    pub nullifier: [u8; 32],
    pub output_commitment: [u8; 32],
    pub domain: [u8; 32],
    pub bump: u8,
}

#[error_code]
pub enum MockVerifierError {
    #[msg("Verified context authority does not match")]
    AuthorityMismatch,
    #[msg("Verified context root does not match")]
    RootMismatch,
    #[msg("Verified context nullifier does not match")]
    NullifierMismatch,
    #[msg("Verified context output commitment does not match")]
    OutputMismatch,
    #[msg("Verified context domain does not match")]
    DomainMismatch,
}
