use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token::spl_token;
use anchor_spl::token_interface::{
    burn_checked, initialize_mint2, mint_to_checked, BurnChecked, InitializeMint2, Mint,
    MintToChecked, TokenAccount, TokenInterface,
};
pub mod logic;
use logic::authorize_mint;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod stablecoin_lite {
    use super::*;

    /// Tạo mint MỚI và Config trong cùng một instruction.
    ///
    /// Không nhận mint có sẵn: nếu admin chuyển mint authority sang Config PDA ở một
    /// transaction riêng, kẻ khác có thể gọi `initialize_config` trước và trở thành admin.
    /// Tạo mint ở đây với authority = Config PDA thì không còn khoảng hở đó.
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        decimals: u8,
        total_cap: u64,
    ) -> Result<()> {
        require!(total_cap > 0, StablecoinError::InvalidAmount);
        let config_key = ctx.accounts.config.key();

        // 1. Cấp phát account cho mint, owner là token program đã chọn.
        let space = spl_token::state::Mint::LEN;
        create_account(
            CpiContext::new(ctx.accounts.system_program.key(),
                CreateAccount {
                    from: ctx.accounts.admin.to_account_info(),
                    to: ctx.accounts.mint.to_account_info(),
                },
            ),
            Rent::get()?.minimum_balance(space),
            space as u64,
            &ctx.accounts.token_program.key(),
        )?;
        // 2. Khởi tạo mint: Config PDA là mint authority, không có freeze authority.
        initialize_mint2(
            CpiContext::new(ctx.accounts.token_program.key(),
                InitializeMint2 {
                    mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            decimals,
            &config_key,
            None,
        )?;

        ctx.accounts.config.set_inner(Config {
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
        ctx.accounts.config.paused = paused;
        Ok(())
    }

    pub fn authorized_mint(ctx: Context<AuthorizedMint>, amount: u64) -> Result<()> {
        let (new_remaining, new_total) = authorize_mint(
            ctx.accounts.config.paused,
            ctx.accounts.allowance.remaining,
            ctx.accounts.config.minted_by_protocol,
            ctx.accounts.config.total_cap,
            amount,
        )?;

        let mint_key = ctx.accounts.config.mint;
        let signer_seeds: &[&[&[u8]]] =
            &[&[b"config", mint_key.as_ref(), &[ctx.accounts.config.bump]]];
        mint_to_checked(
            CpiContext::new_with_signer(ctx.accounts.token_program.key(),
                MintToChecked {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;
        ctx.accounts.allowance.remaining = new_remaining;
        ctx.accounts.config.minted_by_protocol = new_total;
        Ok(())
    }

    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, StablecoinError::InvalidAmount);
        burn_checked(
            CpiContext::new(ctx.accounts.token_program.key(),
                BurnChecked {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.holder_account.to_account_info(),
                    authority: ctx.accounts.holder.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// Keypair mới cho mint; được tạo và khởi tạo bên trong instruction.
    #[account(mut)]
    pub mint: Signer<'info>,
    #[account(init, payer=admin, space=8+Config::INIT_SPACE, seeds=[b"config",mint.key().as_ref()], bump)]
    pub config: Account<'info, Config>,
    pub token_program: Interface<'info, TokenInterface>,
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
}
