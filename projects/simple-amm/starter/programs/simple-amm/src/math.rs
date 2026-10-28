use crate::AmmError;
use anchor_lang::prelude::*;

/// LP shares bị khóa vĩnh viễn ở lần nạp đầu tiên (giống `MINIMUM_LIQUIDITY` của Uniswap V2).
/// Không ai sở hữu phần này, nên kẻ tấn công không thể đẩy giá 1 share lên cực cao
/// (first-depositor / inflation attack) rồi làm người nạp sau bị làm tròn về 0 share.
pub const MINIMUM_LIQUIDITY: u64 = 1_000;

/// Các mức phí được phép. Fee nằm trong seeds của Pool, nên mỗi cặp mint có tối đa
/// một pool cho mỗi mức phí: không ai chiếm được cặp mint bằng cách tạo pool phí 99%.
pub const FEE_TIERS_BPS: [u16; 3] = [5, 30, 100];

pub fn is_allowed_fee(fee_bps: u16) -> bool {
    FEE_TIERS_BPS.contains(&fee_bps)
}

pub fn integer_sqrt(value: u128) -> u128 {
    let _ = value;
    todo!("TODO math 1: integer square root, round down")
}

/// Tổng LP shares của lần nạp đầu tiên, gồm cả phần `MINIMUM_LIQUIDITY` sẽ bị khóa.
pub fn initial_lp(amount_a: u64, amount_b: u64) -> Result<u64> {
    let _ = (amount_a, amount_b);
    todo!("TODO math 2: sqrt(amount_a * amount_b), phải lớn hơn MINIMUM_LIQUIDITY")
}

/// Số share tối đa nhận được với `max_a`/`max_b`, làm tròn xuống (có lợi cho pool).
pub fn subsequent_lp(
    max_a: u64,
    max_b: u64,
    reserve_a: u64,
    reserve_b: u64,
    supply: u64,
) -> Result<u64> {
    let _ = (max_a, max_b, reserve_a, reserve_b, supply);
    todo!("TODO math 3: min proportional shares, round down")
}

/// Lượng token A/B thật sự phải nạp để nhận `shares`, làm tròn LÊN (có lợi cho pool).
/// Nhờ đó program chỉ lấy đúng phần tỷ lệ, phần dư của token còn lại ở lại ví user.
pub fn deposit_amounts(shares: u64, reserve_a: u64, reserve_b: u64, supply: u64) -> Result<(u64, u64)> {
    let _ = (shares, reserve_a, reserve_b, supply);
    todo!("TODO math 4: lượng A/B cần nạp cho shares, round up")
}

pub fn swap_output(amount_in: u64, reserve_in: u64, reserve_out: u64, fee_bps: u16) -> Result<u64> {
    let _ = (amount_in, reserve_in, reserve_out, fee_bps);
    todo!("TODO math 5: constant-product output sau fee")
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
        assert_eq!(initial_lp(1_000_000, 4_000_000).unwrap(), 2_000_000)
    }
    #[test]
    fn initial_shares_must_exceed_locked_minimum() {
        // sqrt(1_000 * 1_000) = 1_000, không lớn hơn MINIMUM_LIQUIDITY.
        assert!(initial_lp(1_000, 1_000).is_err());
        assert!(initial_lp(1, 1).is_err());
    }
    #[test]
    fn proportional_shares() {
        assert_eq!(subsequent_lp(100, 200, 1_000, 2_000, 500).unwrap(), 50)
    }
    #[test]
    fn deposit_only_takes_proportional_amounts() {
        // User đưa tối đa 100 A và 1_000 B nhưng tỷ lệ pool là 1:2.
        let shares = subsequent_lp(100, 1_000, 1_000, 2_000, 500).unwrap();
        assert_eq!(shares, 50);
        assert_eq!(deposit_amounts(shares, 1_000, 2_000, 500).unwrap(), (100, 200));
    }
    #[test]
    fn deposit_rounds_up_in_favor_of_pool() {
        // 1 share * 3 / 2 = 1.5 -> phải nạp 2.
        assert_eq!(deposit_amounts(1, 3, 3, 2).unwrap(), (2, 2));
    }
    #[test]
    fn fee_tiers() {
        assert!(is_allowed_fee(30));
        assert!(!is_allowed_fee(0));
        assert!(!is_allowed_fee(9_999));
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
