use std::collections::HashMap;
use std::fmt::{self, Display};
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Choice {
    Yes,
    No,
    Abstain,
}

// From có tham số kiểu: chuyển Choice thành nhãn &str sống suốt chương trình.
impl From<Choice> for &'static str {
    fn from(choice: Choice) -> Self {
        match choice {
            Choice::Yes => "yes",
            Choice::No => "no",
            Choice::Abstain => "abstain",
        }
    }
}

impl Display for Choice {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let label: &str = (*self).into();
        formatter.write_str(label)
    }
}

impl FromStr for Choice {
    type Err = &'static str;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        match input.trim().to_ascii_lowercase().as_str() {
            "yes" => Ok(Self::Yes),
            // TODO 1: nhận thêm no và abstain.
            _ => Err("chỉ nhận yes, no hoặc abstain"),
        }
    }
}

pub struct Poll {
    title: String,
    counts: HashMap<Choice, u64>,
}

impl Poll {
    pub fn new(title: &str) -> Result<Self, &'static str> {
        // TODO 2: từ chối tiêu đề chỉ có khoảng trắng.
        Ok(Self {
            title: title.to_owned(),
            counts: HashMap::new(),
        })
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub fn count(&self, choice: Choice) -> u64 {
        self.counts.get(&choice).copied().unwrap_or(0)
    }

    pub fn vote(&mut self, choice: Choice) -> Result<(), &'static str> {
        // TODO 3: tăng đúng counter bằng checked_add; lỗi thì giữ nguyên dữ liệu.
        let _ = choice;
        Err("chưa làm bước đếm phiếu")
    }

    pub fn total(&self) -> u128 {
        // TODO 4: chuyển từng counter sang u128 rồi cộng.
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_three_choices_and_rejects_invalid_input() {
        assert_eq!(" YES ".parse(), Ok(Choice::Yes));
        assert_eq!("no".parse(), Ok(Choice::No));
        assert_eq!("Abstain".parse(), Ok(Choice::Abstain));
        assert!("maybe".parse::<Choice>().is_err());
        assert!("".parse::<Choice>().is_err());
        assert_eq!(Choice::No.to_string(), "no");
    }

    #[test]
    fn counts_all_choices_and_rejects_empty_title() {
        assert!(Poll::new("   ").is_err());
        let mut poll = Poll::new("Học Rust?").unwrap();
        assert_eq!(poll.title(), "Học Rust?");
        assert_eq!(poll.count(Choice::Yes), 0);
        for choice in [Choice::Yes, Choice::No, Choice::Abstain, Choice::Yes] {
            poll.vote(choice).unwrap();
        }
        assert_eq!(poll.count(Choice::Yes), 2);
        assert_eq!(poll.count(Choice::No), 1);
        assert_eq!(poll.count(Choice::Abstain), 1);
        assert_eq!(poll.total(), 4);
    }

    #[test]
    fn overflow_does_not_change_state_and_total_stays_exact() {
        let mut poll = Poll::new("Giới hạn").unwrap();
        poll.counts.insert(Choice::Yes, u64::MAX);
        poll.counts.insert(Choice::No, 1);
        assert_eq!(poll.vote(Choice::Yes), Err("quá nhiều phiếu"));
        assert_eq!(poll.count(Choice::Yes), u64::MAX);
        assert_eq!(poll.total(), u128::from(u64::MAX) + 1);
    }
}
