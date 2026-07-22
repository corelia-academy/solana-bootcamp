use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token_interface::{
    burn_checked, mint_to_checked, BurnChecked, Mint, MintToChecked, TokenAccount, TokenInterface,
};

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod stablecoin_lite {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, total_cap: u64) -> Result<()> {
        require!(total_cap > 0, StablecoinError::InvalidAmount);
        require!(
            ctx.accounts.mint.mint_authority == COption::Some(ctx.accounts.config.key()),
            StablecoinError::InvalidMintAuthority
        );
        let config = &mut ctx.accounts.config;
        config.set_inner(Config {
            admin: ctx.accounts.admin.key(),
            mint: ctx.accounts.mint.key(),
            paused: false,
            total_cap,
            minted_by_protocol: 0,
            bump: ctx.bumps.config,
        });
        Ok(())
    }

    pub fn set_minter(ctx: Context<SetMinter>, allowance: u64) -> Result<()> {
        let account = &mut ctx.accounts.allowance;
        account.config = ctx.accounts.config.key();
        account.minter = ctx.accounts.minter.key();
        account.remaining = allowance;
        account.bump = ctx.bumps.allowance;
        Ok(())
    }

    pub fn set_paused(ctx: Context<AdminConfig>, paused: bool) -> Result<()> {
        let _ = (ctx, paused);
        todo!("Checkpoint 2: pause/unpause")
    }

    pub fn authorized_mint(ctx: Context<AuthorizedMint>, amount: u64) -> Result<()> {
        let _ = (ctx, amount);
        todo!("Checkpoint 2: allowance/cap/pause và mint CPI")
    }

    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let _ = (ctx, amount);
        todo!("Final: holder burn_checked")
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(init, payer=admin, space=8+Config::INIT_SPACE, seeds=[b"config",mint.key().as_ref()], bump)]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetMinter<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(seeds=[b"config",config.mint.as_ref()],bump=config.bump,has_one=admin)]
    pub config: Account<'info, Config>,
    /// CHECK: Chỉ dùng public key làm PDA seed và field authority.
    pub minter: UncheckedAccount<'info>,
    #[account(init_if_needed,payer=admin,space=8+MinterAllowance::INIT_SPACE,seeds=[b"minter",config.key().as_ref(),minter.key().as_ref()],bump)]
    pub allowance: Account<'info, MinterAllowance>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminConfig<'info> {
    pub admin: Signer<'info>,
    #[account(mut,seeds=[b"config",config.mint.as_ref()],bump=config.bump,has_one=admin)]
    pub config: Account<'info, Config>,
}

#[derive(Accounts)]
pub struct AuthorizedMint<'info> {
    pub minter: Signer<'info>,
    #[account(mut,seeds=[b"config",mint.key().as_ref()],bump=config.bump,has_one=mint)]
    pub config: Account<'info, Config>,
    #[account(mut,seeds=[b"minter",config.key().as_ref(),minter.key().as_ref()],bump=allowance.bump,has_one=config,has_one=minter)]
    pub allowance: Account<'info, MinterAllowance>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut,token::mint=mint,token::token_program=token_program)]
    pub destination: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    pub holder: Signer<'info>,
    #[account(seeds=[b"config",mint.key().as_ref()],bump=config.bump,has_one=mint)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut,token::mint=mint,token::authority=holder,token::token_program=token_program)]
    pub holder_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub paused: bool,
    pub total_cap: u64,
    pub minted_by_protocol: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct MinterAllowance {
    pub config: Pubkey,
    pub minter: Pubkey,
    pub remaining: u64,
    pub bump: u8,
}

#[error_code]
pub enum StablecoinError {
    #[msg("Amount phải lớn hơn 0")]
    InvalidAmount,
    #[msg("Protocol đang pause")]
    Paused,
    #[msg("Minter allowance không đủ")]
    AllowanceExceeded,
    #[msg("Vượt total cap")]
    CapExceeded,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Config PDA phải là mint authority trước khi initialize")]
    InvalidMintAuthority,
}
