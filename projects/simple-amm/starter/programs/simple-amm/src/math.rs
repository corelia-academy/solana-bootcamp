use crate::AmmError;
use anchor_lang::prelude::*;

pub fn integer_sqrt(value: u128) -> u128 {
    let _ = value;
    todo!("TODO math 1: integer square root, round down")
}

pub fn initial_lp(amount_a: u64, amount_b: u64) -> Result<u64> {
    let _ = (amount_a, amount_b);
    todo!("TODO math 2: sqrt(amount_a * amount_b)")
}

pub fn subsequent_lp(
    amount_a: u64,
    amount_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    supply: u64,
) -> Result<u64> {
    let _ = (amount_a, amount_b, reserve_a, reserve_b, supply);
    todo!("TODO math 3: min proportional shares")
}

pub fn swap_output(amount_in: u64, reserve_in: u64, reserve_out: u64, fee_bps: u16) -> Result<u64> {
    let _ = (amount_in, reserve_in, reserve_out, fee_bps);
    todo!("TODO math 4: constant-product output sau fee")
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
