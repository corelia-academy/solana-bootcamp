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
