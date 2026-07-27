use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod pda_counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.owner = ctx.accounts.owner.key();
        counter.value = 0;
        counter.bump = ctx.bumps.counter;
        Ok(())
    }

    pub fn increment(ctx: Context<UpdateCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = counter.value.checked_add(1).ok_or(CounterError::Overflow)?;
        Ok(())
    }

    pub fn decrement(ctx: Context<UpdateCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = counter
            .value
            .checked_sub(1)
            .ok_or(CounterError::Underflow)?;
        Ok(())
    }

    pub fn reset(ctx: Context<UpdateCounter>) -> Result<()> {
        ctx.accounts.counter.value = 0;
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

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub owner: Pubkey,
    pub value: u64,
    pub bump: u8,
}

#[error_code]
pub enum CounterError {
    #[msg("Giá trị counter đã đạt giới hạn tối đa")]
    Overflow,
    #[msg("Counter đang bằng 0 nên không thể giảm")]
    Underflow,
}
