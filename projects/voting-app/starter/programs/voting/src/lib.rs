use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        _ctx: Context<InitializePoll>,
        _poll_id: u64,
        _title: String,
        _start_time: i64,
        _end_time: i64,
    ) -> Result<()> {
        todo!("TODO 1: validate input và khởi tạo Poll")
    }

    pub fn add_candidate(
        _ctx: Context<AddCandidate>,
        _poll_id: u64,
        candidate_id: u16,
        _name: String,
    ) -> Result<()> {
        let _ = candidate_id;
        todo!("TODO 2: validate time/authority và tạo Candidate")
    }

    pub fn vote(_ctx: Context<Vote>, _poll_id: u64, _candidate_id: u16) -> Result<()> {
        todo!("TODO 3: validate time, tăng votes và lưu VoteReceipt")
    }
}

/// Poll PDA gồm authority trong seeds: mỗi authority có namespace `poll_id` riêng,
/// nên không ai chiếm trước `poll_id` của người khác.
#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Poll::INIT_SPACE,
        seeds = [b"poll", authority.key().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_id: u16)]
pub struct AddCandidate<'info> {
    #[account(
        mut,
        seeds = [b"poll", authority.key().as_ref(), poll_id.to_le_bytes().as_ref()],
        bump = poll.bump,
        has_one = authority
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = authority,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [b"candidate", poll.key().as_ref(), candidate_id.to_le_bytes().as_ref()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_id: u16)]
pub struct Vote<'info> {
    #[account(
        seeds = [b"poll", poll.authority.as_ref(), poll_id.to_le_bytes().as_ref()],
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        mut,
        seeds = [b"candidate", poll.key().as_ref(), candidate_id.to_le_bytes().as_ref()],
        bump = candidate.bump,
        has_one = poll
    )]
    pub candidate: Account<'info, Candidate>,
    #[account(
        init,
        payer = voter,
        space = 8 + VoteReceipt::INIT_SPACE,
        seeds = [b"vote", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub authority: Pubkey,
    pub poll_id: u64,
    #[max_len(64)]
    pub title: String,
    pub start_time: i64,
    pub end_time: i64,
    pub candidate_count: u16,
    pub bump: u8,
}

impl Poll {
    pub const MAX_TITLE_LEN: usize = 64;
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    pub poll: Pubkey,
    pub candidate_id: u16,
    #[max_len(32)]
    pub name: String,
    pub votes: u64,
    pub bump: u8,
}

impl Candidate {
    pub const MAX_NAME_LEN: usize = 32;
}

#[account]
#[derive(InitSpace)]
pub struct VoteReceipt {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub candidate: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum VotingError {
    #[msg("Tiêu đề poll không được để trống")]
    EmptyTitle,
    #[msg("Tiêu đề poll dài hơn 64 bytes")]
    TitleTooLong,
    #[msg("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc")]
    InvalidTimeWindow,
    #[msg("Poll đã bắt đầu nên không thể thêm candidate")]
    PollAlreadyStarted,
    #[msg("Tên candidate không được để trống")]
    EmptyCandidateName,
    #[msg("Tên candidate dài hơn 32 bytes")]
    CandidateNameTooLong,
    #[msg("Poll chưa bắt đầu")]
    PollNotStarted,
    #[msg("Poll đã kết thúc")]
    PollEnded,
    #[msg("Phép tính bị overflow")]
    Overflow,
}
