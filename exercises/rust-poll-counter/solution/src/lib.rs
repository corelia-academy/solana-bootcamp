use std::fmt;
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseVoteError(pub String);

impl fmt::Display for ParseVoteError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "lựa chọn không hợp lệ: {}", self.0)
    }
}

impl std::error::Error for ParseVoteError {}

impl FromStr for VoteChoice {
    type Err = ParseVoteError;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        match input.trim().to_ascii_lowercase().as_str() {
            "yes" => Ok(Self::Yes),
            "no" => Ok(Self::No),
            "abstain" => Ok(Self::Abstain),
            _ => Err(ParseVoteError(input.trim().to_owned())),
        }
    }
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct Poll {
    pub title: String,
    pub yes: u64,
    pub no: u64,
    pub abstain: u64,
}

impl Poll {
    pub fn new(title: impl Into<String>) -> Result<Self, &'static str> {
        let title = title.into();
        if title.trim().is_empty() {
            return Err("tiêu đề không được để trống");
        }
        Ok(Self {
            title,
            ..Self::default()
        })
    }

    pub fn vote(&mut self, choice: VoteChoice) -> Result<(), &'static str> {
        let counter = match choice {
            VoteChoice::Yes => &mut self.yes,
            VoteChoice::No => &mut self.no,
            VoteChoice::Abstain => &mut self.abstain,
        };
        *counter = counter.checked_add(1).ok_or("vote counter bị overflow")?;
        Ok(())
    }

    pub fn total(&self) -> u64 {
        self.yes
            .saturating_add(self.no)
            .saturating_add(self.abstain)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_all_choices() {
        assert_eq!("yes".parse(), Ok(VoteChoice::Yes));
        assert_eq!(" NO ".parse(), Ok(VoteChoice::No));
        assert_eq!("Abstain".parse(), Ok(VoteChoice::Abstain));
    }

    #[test]
    fn rejects_unknown_choice() {
        assert!("maybe".parse::<VoteChoice>().is_err());
    }

    #[test]
    fn counts_votes() {
        let mut poll = Poll::new("Solana có phù hợp cho app realtime?").unwrap();
        poll.vote(VoteChoice::Yes).unwrap();
        poll.vote(VoteChoice::No).unwrap();
        poll.vote(VoteChoice::Yes).unwrap();
        assert_eq!(
            (poll.yes, poll.no, poll.abstain, poll.total()),
            (2, 1, 0, 3)
        );
    }

    #[test]
    fn rejects_empty_title() {
        assert_eq!(Poll::new("   "), Err("tiêu đề không được để trống"));
    }
}
