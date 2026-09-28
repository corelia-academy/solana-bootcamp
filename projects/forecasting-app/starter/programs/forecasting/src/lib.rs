use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod forecasting {
    use super::*;
}

#[derive(Accounts)]
#[instruction(question_id: u64)]
pub struct CreateQuestion<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Question::INIT_SPACE,
        seeds = [b"question", authority.key().as_ref(), question_id.to_le_bytes().as_ref()],
        bump
    )]
    pub question: Account<'info, Question>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Question {
    pub authority: Pubkey,
    pub question_id: u64,
    #[max_len(120)]
    pub text: String,
    #[max_len(4, 24)]
    pub outcomes: Vec<String>,
    pub close_time: i64,
    pub resolved_outcome: Option<u8>,
    pub participant_count: u32,
    pub bump: u8,
}

impl Question {
    pub const MAX_TEXT_LEN: usize = 120;
    pub const MAX_OUTCOMES: usize = 4;
    pub const MAX_OUTCOME_LEN: usize = 24;
}

#[account]
#[derive(InitSpace)]
pub struct Player {
    pub user: Pubkey,
    pub points: u64,
    pub score: u64,
    pub bump: u8,
}

impl Player {
    pub const STARTING_POINTS: u64 = 1_000;
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub question: Pubkey,
    pub user: Pubkey,
    pub choice: u8,
    pub points: u64,
    pub claimed: bool,
    pub bump: u8,
}

#[error_code]
pub enum ForecastError {
    #[msg("Câu hỏi không được để trống")]
    EmptyText,
    #[msg("Câu hỏi dài hơn 120 bytes")]
    TextTooLong,
    #[msg("Câu hỏi cần từ 2 đến 4 lựa chọn")]
    InvalidOutcomeCount,
    #[msg("Mỗi lựa chọn phải có chữ và không dài hơn 24 bytes")]
    InvalidOutcomeLabel,
    #[msg("Giờ đóng phải ở tương lai")]
    InvalidCloseTime,
}
