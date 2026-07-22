use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod escrow {
    use super::*;

    pub fn make(
        ctx: Context<Make>,
        seed: u64,
        offered_amount: u64,
        wanted_amount: u64,
    ) -> Result<()> {
        let _ = (ctx, seed, offered_amount, wanted_amount);
        todo!("TODO 1: validate input, lưu Escrow và chuyển token A vào vault")
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        let _ = ctx;
        todo!("TODO 2: settlement atomic và đóng vault/state")
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let _ = ctx;
        todo!("TODO 3: maker refund bằng PDA signer rồi đóng account")
    }
}

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct Make<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint_a, token::authority = maker, token::token_program = token_program)]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    #[account(init, payer = maker, space = 8 + Escrow::INIT_SPACE, seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(init, payer = maker, associated_token::mint = mint_a, associated_token::authority = escrow, associated_token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    /// CHECK: Khóa bằng `has_one = maker`; chỉ nhận rent khi đóng account.
    #[account(mut)]
    pub maker: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"escrow", escrow.maker.as_ref(), escrow.seed.to_le_bytes().as_ref()], bump = escrow.bump, has_one = maker, has_one = mint_a, has_one = mint_b, close = maker)]
    pub escrow: Account<'info, Escrow>,
    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut, associated_token::mint = mint_a, associated_token::authority = escrow, associated_token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_a, token::authority = taker, token::token_program = token_program)]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_b, token::authority = taker, token::token_program = token_program)]
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_b, token::authority = maker, token::token_program = token_program)]
    pub maker_ata_b: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(mut, seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()], bump = escrow.bump, has_one = maker, has_one = mint_a, close = maker)]
    pub escrow: Account<'info, Escrow>,
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mut, associated_token::mint = mint_a, associated_token::authority = escrow, associated_token::token_program = token_program)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, token::mint = mint_a, token::authority = maker, token::token_program = token_program)]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub seed: u64,
    pub maker: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub offered_amount: u64,
    pub wanted_amount: u64,
    pub bump: u8,
}

#[error_code]
pub enum EscrowError {
    #[msg("Số lượng offer và wanted phải lớn hơn 0")]
    InvalidAmount,
    #[msg("Mint A và mint B phải khác nhau")]
    SameMint,
}
