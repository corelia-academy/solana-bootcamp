use anchor_lang::prelude::*;

pub mod state;
pub use state::*;

declare_id!("A8pt6YDBMdyws1Ue3vGJvvqW8fRTSPx5HduMvahYzYQC");

#[program]
pub mod pda_counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts
            .counter
            .init(ctx.accounts.owner.key(), ctx.bumps.counter);
        Ok(())
    }

    pub fn increment(ctx: Context<UpdateCounter>) -> Result<()> {
        ctx.accounts.counter.checked_increment()
    }

    pub fn decrement(ctx: Context<UpdateCounter>) -> Result<()> {
        ctx.accounts.counter.checked_decrement()
    }

    pub fn reset(ctx: Context<UpdateCounter>) -> Result<()> {
        ctx.accounts.counter.reset_value();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Counter::INIT_SPACE,
        seeds = [b"counter", owner.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCounter<'info> {
    #[account(
        mut,
        seeds = [b"counter", owner.key().as_ref()],
        bump = counter.bump,
        has_one = owner
    )]
    pub counter: Account<'info, Counter>,
    pub owner: Signer<'info>,
}
