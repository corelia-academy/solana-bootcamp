use crate::StablecoinError;
use anchor_lang::prelude::*;

pub fn authorize_mint(
    paused: bool,
    remaining: u64,
    minted: u64,
    cap: u64,
    amount: u64,
) -> Result<(u64, u64)> {
    require!(amount > 0, StablecoinError::InvalidAmount);
    require!(!paused, StablecoinError::Paused);
    require!(remaining >= amount, StablecoinError::AllowanceExceeded);
    let new_total = minted
        .checked_add(amount)
        .ok_or(StablecoinError::Overflow)?;
    require!(new_total <= cap, StablecoinError::CapExceeded);
    Ok((remaining - amount, new_total))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn updates_allowance_and_total() {
        assert_eq!(authorize_mint(false, 50, 20, 100, 10).unwrap(), (40, 30))
    }
    #[test]
    fn rejects_pause() {
        assert!(authorize_mint(true, 50, 20, 100, 10).is_err())
    }
    #[test]
    fn rejects_allowance() {
        assert!(authorize_mint(false, 9, 20, 100, 10).is_err())
    }
    #[test]
    fn rejects_cap() {
        assert!(authorize_mint(false, 50, 95, 100, 10).is_err())
    }
    #[test]
    fn rejects_zero_and_overflow() {
        assert!(authorize_mint(false, 50, 20, 100, 0).is_err());
        assert!(authorize_mint(false, u64::MAX, u64::MAX, u64::MAX, 1).is_err())
    }
}
