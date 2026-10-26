use anchor_lang::prelude::*;

declare_id!("6YTLFqVyQQTEqrxMaTLLRFT9CcJ8nbMkY4q2QdnuRyqS");

#[program]
pub mod treasury {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, approvers: [Pubkey; 3]) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.admin = ctx.accounts.admin.key();
        treasury.approvers = approvers;
        treasury.paused = false;
        treasury.bump = ctx.bumps.treasury;
        treasury.vault_bump = ctx.bumps.vault;
        ctx.accounts.vault.treasury = treasury.key();
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let treasury = &ctx.accounts.treasury;
        require!(treasury.is_approver(&ctx.accounts.approver_one.key()), TreasuryError::NotApprover);
        require!(treasury.is_approver(&ctx.accounts.approver_two.key()), TreasuryError::NotApprover);

        let vault = ctx.accounts.vault.to_account_info();
        let recipient = ctx.accounts.recipient.to_account_info();
        let reserve = Rent::get()?.minimum_balance(vault.data_len());
        let remaining = vault
            .lamports()
            .checked_sub(amount)
            .ok_or(TreasuryError::InsufficientFunds)?;
        require!(remaining >= reserve, TreasuryError::InsufficientFunds);
        let received = recipient
            .lamports()
            .checked_add(amount)
            .ok_or(TreasuryError::Overflow)?;

        **vault.try_borrow_mut_lamports()? = remaining;
        **recipient.try_borrow_mut_lamports()? = received;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", admin.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(
        init,
        payer = admin,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", treasury.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub treasury: Account<'info, Treasury>,
    #[account(
        mut,
        seeds = [b"vault", treasury.key().as_ref()],
        bump = treasury.vault_bump
    )]
    pub vault: Account<'info, Vault>,
    pub approver_one: Signer<'info>,
    #[account(
        constraint = approver_two.key() != approver_one.key() @ TreasuryError::DuplicateApprover
    )]
    pub approver_two: Signer<'info>,
    #[account(mut)]
    pub recipient: SystemAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub admin: Pubkey,
    pub approvers: [Pubkey; 3],
    pub paused: bool,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Treasury {
    pub fn is_approver(&self, key: &Pubkey) -> bool {
        self.approvers.contains(key)
    }
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub treasury: Pubkey,
}

#[error_code]
pub enum TreasuryError {
    #[msg("Ví ký không nằm trong danh sách approver")]
    NotApprover,
    #[msg("Hai approver phải là hai ví khác nhau")]
    DuplicateApprover,
    #[msg("Vault không đủ SOL, phải giữ lại tiền rent")]
    InsufficientFunds,
    #[msg("Cộng lamports bị tràn số")]
    Overflow,
}
