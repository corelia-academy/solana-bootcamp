use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Counter {
    pub owner: Pubkey,
    pub value: u64,
    pub bump: u8,
}

impl Counter {
    pub fn init(&mut self, owner: Pubkey, bump: u8) {
        self.owner = owner;
        self.value = 0;
        self.bump = bump;
    }

    pub fn checked_increment(&mut self) -> Result<()> {
        self.value = self
            .value
            .checked_add(1)
            .ok_or(CounterError::Overflow)?;
        Ok(())
    }

    pub fn checked_decrement(&mut self) -> Result<()> {
        self.value = self
            .value
            .checked_sub(1)
            .ok_or(CounterError::Underflow)?;
        Ok(())
    }

    pub fn reset_value(&mut self) {
        self.value = 0;
    }
}

#[error_code]
pub enum CounterError {
    #[msg("Giá trị counter đã đạt giới hạn tối đa")]
    Overflow,
    #[msg("Counter đang bằng 0 nên không thể giảm")]
    Underflow,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh() -> Counter {
        Counter {
            owner: Pubkey::default(),
            value: 0,
            bump: 0,
        }
    }

    fn assert_err_contains(err: Error, needle: &str) {
        let text = format!("{err:?}");
        assert!(
            text.contains(needle),
            "expected error to contain `{needle}`, got: {text}",
        );
    }

    #[test]
    fn init_sets_owner_bump_and_zeroes_value() {
        let mut c = fresh();
        c.value = 999;
        let owner = Pubkey::new_unique();
        c.init(owner, 254);
        assert_eq!(c.owner, owner);
        assert_eq!(c.value, 0);
        assert_eq!(c.bump, 254);
    }

    #[test]
    fn increment_from_zero_gives_one() {
        let mut c = fresh();
        c.checked_increment().unwrap();
        assert_eq!(c.value, 1);
    }

    #[test]
    fn increment_many_times_accumulates() {
        let mut c = fresh();
        for _ in 0..100 {
            c.checked_increment().unwrap();
        }
        assert_eq!(c.value, 100);
    }

    #[test]
    fn increment_at_u64_max_returns_overflow_and_keeps_state() {
        let mut c = fresh();
        c.value = u64::MAX;
        let err = c.checked_increment().unwrap_err();
        assert_err_contains(err, "Overflow");
        assert_eq!(c.value, u64::MAX, "state phải giữ nguyên khi lỗi");
    }

    #[test]
    fn decrement_from_zero_returns_underflow_and_keeps_state() {
        let mut c = fresh();
        let err = c.checked_decrement().unwrap_err();
        assert_err_contains(err, "Underflow");
        assert_eq!(c.value, 0);
    }

    #[test]
    fn decrement_from_one_gives_zero() {
        let mut c = fresh();
        c.value = 1;
        c.checked_decrement().unwrap();
        assert_eq!(c.value, 0);
    }

    #[test]
    fn reset_zeroes_any_value() {
        let mut c = fresh();
        c.value = u64::MAX / 2;
        c.reset_value();
        assert_eq!(c.value, 0);
    }

    #[test]
    fn reset_does_not_touch_owner_or_bump() {
        let mut c = fresh();
        let owner = Pubkey::new_unique();
        c.init(owner, 200);
        c.value = 42;
        c.reset_value();
        assert_eq!(c.owner, owner);
        assert_eq!(c.bump, 200);
    }
}
