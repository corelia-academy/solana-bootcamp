use anchor_lang::prelude::*;
use mock_verifier::program::MockVerifier;

declare_id!("AoVsGaj8MSJ6xwKxfFxo9iZWH3enC8RRTXKH2fx2F8os");

#[program]
pub mod privacy_app {
    use super::*;

    pub fn initialize_state(
        ctx: Context<InitializeState>,
        domain: [u8; 32],
        initial_root: [u8; 32],
    ) -> Result<()> {
        require!(domain != [0; 32], PrivacyError::EmptyDomain);
        require!(initial_root != [0; 32], PrivacyError::EmptyRoot);

        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.domain = domain;
        state.current_root = initial_root;
        state.latest_output_commitment = [0; 32];
        state.outputs_count = 0;
        state.bump = ctx.bumps.state;
        Ok(())
    }

    pub fn consume_note(
        ctx: Context<ConsumeNote>,
        root: [u8; 32],
        nullifier: [u8; 32],
        output_commitment: [u8; 32],
        domain: [u8; 32],
    ) -> Result<()> {
        require!(
            root == ctx.accounts.state.current_root,
            PrivacyError::StaleRoot
        );
        require!(
            domain == ctx.accounts.state.domain,
            PrivacyError::DomainMismatch
        );
        require!(nullifier != [0; 32], PrivacyError::EmptyNullifier);
        require!(
            output_commitment != [0; 32],
            PrivacyError::EmptyOutputCommitment
        );

        let cpi_program = ctx.accounts.verifier_program.to_account_info();
        let cpi_accounts = mock_verifier::cpi::accounts::AssertContext {
            authority: ctx.accounts.authority.to_account_info(),
            verified_context: ctx.accounts.verified_context.to_account_info(),
        };
        mock_verifier::cpi::assert_context(
            CpiContext::new(cpi_program, cpi_accounts),
            root,
            nullifier,
            output_commitment,
            domain,
        )?;

        // These writes happen only after CPI success. Any later error rolls back the transaction.
        let record = &mut ctx.accounts.nullifier_record;
        record.state = ctx.accounts.state.key();
        record.nullifier = nullifier;
        record.bump = ctx.bumps.nullifier_record;

        let state = &mut ctx.accounts.state;
        state.latest_output_commitment = output_commitment;
        state.outputs_count = state
            .outputs_count
            .checked_add(1)
            .ok_or(PrivacyError::CounterOverflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + PrivacyState::INIT_SPACE,
        seeds = [b"state", authority.key().as_ref()],
        bump
    )]
    pub state: Account<'info, PrivacyState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_root: [u8; 32], nullifier: [u8; 32])]
pub struct ConsumeNote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"state", authority.key().as_ref()],
        bump = state.bump,
        has_one = authority
    )]
    pub state: Account<'info, PrivacyState>,
    #[account(
        init,
        payer = authority,
        space = 8 + NullifierRecord::INIT_SPACE,
        seeds = [b"nullifier", state.key().as_ref(), nullifier.as_ref()],
        bump
    )]
    pub nullifier_record: Account<'info, NullifierRecord>,
    pub verified_context: Account<'info, mock_verifier::VerifiedContext>,
    #[account(address = mock_verifier::ID)]
    pub verifier_program: Program<'info, MockVerifier>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct PrivacyState {
    pub authority: Pubkey,
    pub domain: [u8; 32],
    pub current_root: [u8; 32],
    pub latest_output_commitment: [u8; 32],
    pub outputs_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct NullifierRecord {
    pub state: Pubkey,
    pub nullifier: [u8; 32],
    pub bump: u8,
}

#[error_code]
pub enum PrivacyError {
    #[msg("Domain cannot be all zeroes")]
    EmptyDomain,
    #[msg("Merkle root cannot be all zeroes")]
    EmptyRoot,
    #[msg("Nullifier cannot be all zeroes")]
    EmptyNullifier,
    #[msg("Output commitment cannot be all zeroes")]
    EmptyOutputCommitment,
    #[msg("Spend root is not the current root")]
    StaleRoot,
    #[msg("Spend domain does not match state")]
    DomainMismatch,
    #[msg("Output counter overflow")]
    CounterOverflow,
}
