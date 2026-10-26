use anchor_lang::prelude::*;

declare_id!("6YTLFqVyQQTEqrxMaTLLRFT9CcJ8nbMkY4q2QdnuRyqS");

#[program]
pub mod treasury {
    use super::*;
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
