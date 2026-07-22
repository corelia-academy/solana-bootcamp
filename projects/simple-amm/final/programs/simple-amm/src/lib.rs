use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, TransferChecked},
};
pub mod math;
use math::{initial_lp, subsequent_lp, swap_output};

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod simple_amm {
    use super::*;
    pub fn initialize_pool(ctx: Context<InitializePool>, fee_bps: u16) -> Result<()> {
        require!(
            ctx.accounts.mint_a.key().to_bytes() < ctx.accounts.mint_b.key().to_bytes(),
            AmmError::NonCanonicalMints
        );
        require!(fee_bps < 10_000, AmmError::InvalidFee);
        ctx.accounts.pool.set_inner(Pool {
            mint_a: ctx.accounts.mint_a.key(),
            mint_b: ctx.accounts.mint_b.key(),
            fee_bps,
            bump: ctx.bumps.pool,
        });
        Ok(())
    }
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        minimum_lp: u64,
    ) -> Result<()> {
        let shares = if ctx.accounts.lp_mint.supply == 0 {
            initial_lp(amount_a, amount_b)?
        } else {
            subsequent_lp(
                amount_a,
                amount_b,
                ctx.accounts.vault_a.amount,
                ctx.accounts.vault_b.amount,
                ctx.accounts.lp_mint.supply,
            )?
        };
        require!(
            shares > 0 && shares >= minimum_lp,
            AmmError::SlippageExceeded
        );
        transfer_from_user(
            &ctx.accounts.token_program,
            &ctx.accounts.provider_a,
            &ctx.accounts.mint_a,
            &ctx.accounts.vault_a,
            &ctx.accounts.provider,
            amount_a,
        )?;
        transfer_from_user(
            &ctx.accounts.token_program,
            &ctx.accounts.provider_b,
            &ctx.accounts.mint_b,
            &ctx.accounts.vault_b,
            &ctx.accounts.provider,
            amount_b,
        )?;
        let a = ctx.accounts.pool.mint_a;
        let b = ctx.accounts.pool.mint_b;
        let seeds: &[&[&[u8]]] = &[&[b"pool", a.as_ref(), b.as_ref(), &[ctx.accounts.pool.bump]]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    to: ctx.accounts.provider_lp.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                seeds,
            ),
            shares,
        )
    }
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        minimum_a: u64,
        minimum_b: u64,
    ) -> Result<()> {
        require!(
            lp_amount > 0 && ctx.accounts.lp_mint.supply > 0,
            AmmError::InvalidAmount
        );
        let amount_a = u64::try_from(
            (lp_amount as u128) * (ctx.accounts.vault_a.amount as u128)
                / (ctx.accounts.lp_mint.supply as u128),
        )
        .map_err(|_| error!(AmmError::Overflow))?;
        let amount_b = u64::try_from(
            (lp_amount as u128) * (ctx.accounts.vault_b.amount as u128)
                / (ctx.accounts.lp_mint.supply as u128),
        )
        .map_err(|_| error!(AmmError::Overflow))?;
        require!(
            amount_a >= minimum_a && amount_b >= minimum_b,
            AmmError::SlippageExceeded
        );
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.lp_mint.to_account_info(),
                    from: ctx.accounts.provider_lp.to_account_info(),
                    authority: ctx.accounts.provider.to_account_info(),
                },
            ),
            lp_amount,
        )?;
        transfer_from_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            &ctx.accounts.vault_a,
            &ctx.accounts.mint_a,
            &ctx.accounts.provider_a,
            amount_a,
        )?;
        transfer_from_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            &ctx.accounts.vault_b,
            &ctx.accounts.mint_b,
            &ctx.accounts.provider_b,
            amount_b,
        )
    }
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_output: u64,
        a_to_b: bool,
    ) -> Result<()> {
        let (input_vault, output_vault, input_mint, output_mint, user_input, user_output) =
            if a_to_b {
                (
                    &ctx.accounts.vault_a,
                    &ctx.accounts.vault_b,
                    &ctx.accounts.mint_a,
                    &ctx.accounts.mint_b,
                    &ctx.accounts.user_a,
                    &ctx.accounts.user_b,
                )
            } else {
                (
                    &ctx.accounts.vault_b,
                    &ctx.accounts.vault_a,
                    &ctx.accounts.mint_b,
                    &ctx.accounts.mint_a,
                    &ctx.accounts.user_b,
                    &ctx.accounts.user_a,
                )
            };
        let output = swap_output(
            amount_in,
            input_vault.amount,
            output_vault.amount,
            ctx.accounts.pool.fee_bps,
        )?;
        require!(
            output > 0 && output >= minimum_output,
            AmmError::SlippageExceeded
        );
        transfer_from_user(
            &ctx.accounts.token_program,
            user_input,
            input_mint,
            input_vault,
            &ctx.accounts.trader,
            amount_in,
        )?;
        transfer_from_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.pool,
            output_vault,
            output_mint,
            user_output,
            output,
        )
    }
}

fn transfer_from_user<'info>(
    token_program: &Program<'info, Token>,
    from: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
    to: &Account<'info, TokenAccount>,
    authority: &Signer<'info>,
    amount: u64,
) -> Result<()> {
    token::transfer_checked(
        CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                from: from.to_account_info(),
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        amount,
        mint.decimals,
    )
}
fn transfer_from_pool<'info>(
    token_program: &Program<'info, Token>,
    pool: &Account<'info, Pool>,
    from: &Account<'info, TokenAccount>,
    mint: &Account<'info, Mint>,
    to: &Account<'info, TokenAccount>,
    amount: u64,
) -> Result<()> {
    let a = pool.mint_a;
    let b = pool.mint_b;
    let seeds: &[&[&[u8]]] = &[&[b"pool", a.as_ref(), b.as_ref(), &[pool.bump]]];
    token::transfer_checked(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            TransferChecked {
                from: from.to_account_info(),
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: pool.to_account_info(),
            },
            seeds,
        ),
        amount,
        mint.decimals,
    )
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(init,payer=payer,space=8+Pool::INIT_SPACE,seeds=[b"pool",mint_a.key().as_ref(),mint_b.key().as_ref()],bump)]
    pub pool: Account<'info, Pool>,
    #[account(init,payer=payer,mint::decimals=6,mint::authority=pool,seeds=[b"lp",pool.key().as_ref()],bump)]
    pub lp_mint: Account<'info, Mint>,
    #[account(init,payer=payer,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(init,payer=payer,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    pub provider: Signer<'info>,
    #[account(seeds=[b"pool",pool.mint_a.as_ref(),pool.mint_b.as_ref()],bump=pool.bump,has_one=mint_a,has_one=mint_b)]
    pub pool: Account<'info, Pool>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(mut,seeds=[b"lp",pool.key().as_ref()],bump)]
    pub lp_mint: Account<'info, Mint>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_a,token::authority=provider)]
    pub provider_a: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_b,token::authority=provider)]
    pub provider_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=lp_mint,token::authority=provider)]
    pub provider_lp: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    pub provider: Signer<'info>,
    #[account(seeds=[b"pool",pool.mint_a.as_ref(),pool.mint_b.as_ref()],bump=pool.bump,has_one=mint_a,has_one=mint_b)]
    pub pool: Account<'info, Pool>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(mut,seeds=[b"lp",pool.key().as_ref()],bump)]
    pub lp_mint: Account<'info, Mint>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_a,token::authority=provider)]
    pub provider_a: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_b,token::authority=provider)]
    pub provider_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=lp_mint,token::authority=provider)]
    pub provider_lp: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    pub trader: Signer<'info>,
    #[account(seeds=[b"pool",pool.mint_a.as_ref(),pool.mint_b.as_ref()],bump=pool.bump,has_one=mint_a,has_one=mint_b)]
    pub pool: Account<'info, Pool>,
    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,
    #[account(mut,associated_token::mint=mint_a,associated_token::authority=pool)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut,associated_token::mint=mint_b,associated_token::authority=pool)]
    pub vault_b: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_a,token::authority=trader)]
    pub user_a: Account<'info, TokenAccount>,
    #[account(mut,token::mint=mint_b,token::authority=trader)]
    pub user_b: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

#[error_code]
pub enum AmmError {
    #[msg("Amount hoặc reserves không hợp lệ")]
    InvalidAmount,
    #[msg("Fee phải nhỏ hơn 10,000 bps")]
    InvalidFee,
    #[msg("Mint pair phải canonical")]
    NonCanonicalMints,
    #[msg("Minimum output/LP không đạt")]
    SlippageExceeded,
    #[msg("Arithmetic overflow")]
    Overflow,
}
