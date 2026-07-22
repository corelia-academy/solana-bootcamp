use crate::AmmError;
use anchor_lang::prelude::*;

pub fn integer_sqrt(value: u128) -> u128 {
    if value < 2 {
        return value;
    }
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}

pub fn initial_lp(amount_a: u64, amount_b: u64) -> Result<u64> {
    require!(amount_a > 0 && amount_b > 0, AmmError::InvalidAmount);
    u64::try_from(integer_sqrt((amount_a as u128) * (amount_b as u128)))
        .map_err(|_| error!(AmmError::Overflow))
}

pub fn subsequent_lp(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    supply: u64,
) -> Result<u64> {
    require!(
        amount_a > 0 && amount_b > 0 && reserve_a > 0 && reserve_b > 0 && supply > 0,
        AmmError::InvalidAmount
    );
    let from_a = (amount_a as u128)
        .checked_mul(supply as u128)
        .ok_or(AmmError::Overflow)?
        / (reserve_a as u128);
    let from_b = (amount_b as u128)
        .checked_mul(supply as u128)
        .ok_or(AmmError::Overflow)?
        / (reserve_b as u128);
    u64::try_from(from_a.min(from_b)).map_err(|_| error!(AmmError::Overflow))
}

pub fn swap_output(amount_in: u64, reserve_in: u64, reserve_out: u64, fee_bps: u16) -> Result<u64> {
    require!(
        amount_in > 0 && reserve_in > 0 && reserve_out > 0,
        AmmError::InvalidAmount
    );
    require!(fee_bps < 10_000, AmmError::InvalidFee);
    let effective = (amount_in as u128)
        .checked_mul((10_000 - fee_bps) as u128)
        .ok_or(AmmError::Overflow)?
        / 10_000;
    let numerator = (reserve_out as u128)
        .checked_mul(effective)
        .ok_or(AmmError::Overflow)?;
    let denominator = (reserve_in as u128)
        .checked_add(effective)
        .ok_or(AmmError::Overflow)?;
    u64::try_from(numerator / denominator).map_err(|_| error!(AmmError::Overflow))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sqrt_floor() {
        assert_eq!(integer_sqrt(10), 3);
        assert_eq!(integer_sqrt(16), 4)
    }
    #[test]
    fn initial_shares() {
        assert_eq!(initial_lp(100, 400).unwrap(), 200)
    }
    #[test]
    fn proportional_shares() {
        assert_eq!(subsequent_lp(100, 200, 1_000, 2_000, 500).unwrap(), 50)
    }
    #[test]
    fn constant_product_quote() {
        let out = swap_output(100, 1_000, 1_000, 30).unwrap();
        assert_eq!(out, 90);
        assert!((1_100u128) * (910u128) >= 1_000_000)
    }
    #[test]
    fn slippage_inputs_rejected() {
        assert!(swap_output(0, 1_000, 1_000, 30).is_err());
        assert!(swap_output(1, 1, 1, 10_000).is_err())
    }
}
