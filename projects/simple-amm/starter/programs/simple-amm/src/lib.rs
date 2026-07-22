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
        let _ = (ctx, fee_bps);
        todo!("TODO 1: canonical pair và Pool/vault/LP setup")
    }
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        minimum_lp: u64,
    ) -> Result<()> {
        let _ = (ctx, amount_a, amount_b, minimum_lp);
        todo!("TODO 2: proportional LP shares và CPI")
    }
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        minimum_a: u64,
        minimum_b: u64,
    ) -> Result<()> {
        let _ = (ctx, lp_amount, minimum_a, minimum_b);
        todo!("TODO 3: burn LP và proportional withdrawal")
    }
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_output: u64,
        a_to_b: bool,
    ) -> Result<()> {
        let _ = (ctx, amount_in, minimum_output, a_to_b);
        todo!("TODO 4: constant-product swap và slippage")
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
