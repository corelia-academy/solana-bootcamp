use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Lock {
    // Lock expiration timestamp
    pub exp: u64,
    // Amount of SOL locked
    pub amt: u64,
}
