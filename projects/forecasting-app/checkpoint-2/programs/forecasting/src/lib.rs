use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWYDLsh6d8JQRqWSZC9sDgG");

#[program]
pub mod forecasting {
    use super::*;

    pub fn create_question(
        ctx: Context<CreateQuestion>,
        question_id: u64,
        text: String,
        outcomes: Vec<String>,
        close_time: i64,
    ) -> Result<()> {
        require!(!text.trim().is_empty(), ForecastError::EmptyText);
        require!(
            text.len() <= Question::MAX_TEXT_LEN,
            ForecastError::TextTooLong
        );
        require!(
            outcomes.len() >= 2 && outcomes.len() <= Question::MAX_OUTCOMES,
            ForecastError::InvalidOutcomeCount
        );
        for outcome in outcomes.iter() {
            require!(
                !outcome.trim().is_empty() && outcome.len() <= Question::MAX_OUTCOME_LEN,
                ForecastError::InvalidOutcomeLabel
            );
        }
        let now = Clock::get()?.unix_timestamp;
        require!(close_time > now, ForecastError::InvalidCloseTime);

        let question = &mut ctx.accounts.question;
        question.authority = ctx.accounts.authority.key();
        question.question_id = question_id;
        question.text = text;
        question.outcomes = outcomes;
        question.close_time = close_time;
        question.resolved_outcome = None;
        question.participant_count = 0;
        question.bump = ctx.bumps.question;
        Ok(())
    }

    pub fn register_player(ctx: Context<RegisterPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.user = ctx.accounts.user.key();
        player.points = Player::STARTING_POINTS;
        player.score = 0;
        player.bump = ctx.bumps.player;
        Ok(())
    }

    pub fn predict(ctx: Context<Predict>, choice: u8, points: u64) -> Result<()> {
        let question = &mut ctx.accounts.question;
        let now = Clock::get()?.unix_timestamp;
        require!(now < question.close_time, ForecastError::QuestionClosed);
        require!(
            (choice as usize) < question.outcomes.len(),
            ForecastError::InvalidChoice
        );
        require!(points > 0, ForecastError::ZeroPoints);

        let player = &mut ctx.accounts.player;
        player.points = player
            .points
            .checked_sub(points)
            .ok_or(ForecastError::NotEnoughPoints)?;
        question.participant_count = question
            .participant_count
            .checked_add(1)
            .ok_or(ForecastError::MathOverflow)?;

        let position = &mut ctx.accounts.position;
        position.question = question.key();
        position.user = ctx.accounts.user.key();
        position.choice = choice;
        position.points = points;
        position.claimed = false;
        position.bump = ctx.bumps.position;
        Ok(())
    }

    pub fn resolve(ctx: Context<Resolve>, outcome: u8) -> Result<()> {
        let question = &mut ctx.accounts.question;
        let now = Clock::get()?.unix_timestamp;
        require!(
            now >= question.close_time,
            ForecastError::QuestionStillOpen
        );
        require!(
            question.resolved_outcome.is_none(),
            ForecastError::AlreadyResolved
        );
        require!(
            (outcome as usize) < question.outcomes.len(),
            ForecastError::InvalidChoice
        );
        question.resolved_outcome = Some(outcome);
        Ok(())
    }
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

#[derive(Accounts)]
pub struct RegisterPlayer<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Player::INIT_SPACE,
        seeds = [b"player", user.key().as_ref()],
        bump
    )]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub question: Account<'info, Question>,
    #[account(
        mut,
        seeds = [b"player", user.key().as_ref()],
        bump = player.bump
    )]
    pub player: Account<'info, Player>,
    #[account(
        init,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", question.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(mut, has_one = authority @ ForecastError::Unauthorized)]
    pub question: Account<'info, Question>,
    pub authority: Signer<'info>,
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
    #[msg("Câu hỏi đã đóng, không nhận dự đoán")]
    QuestionClosed,
    #[msg("Lựa chọn không tồn tại")]
    InvalidChoice,
    #[msg("Số điểm phải lớn hơn 0")]
    ZeroPoints,
    #[msg("Không đủ điểm giả lập")]
    NotEnoughPoints,
    #[msg("Phép tính điểm bị tràn")]
    MathOverflow,
    #[msg("Chỉ authority của câu hỏi được resolve")]
    Unauthorized,
    #[msg("Câu hỏi chưa đóng nên chưa resolve được")]
    QuestionStillOpen,
    #[msg("Câu hỏi đã được resolve")]
    AlreadyResolved,
}
