use poll_counter_exercise::{Poll, VoteChoice};
use std::io::{self, Write};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut poll = Poll::new("Bạn có muốn học Solana không?")?;
    println!("{}", poll.title);
    println!("Nhập yes, no hoặc abstain. Nhập quit để kết thúc.");

    loop {
        print!("> ");
        io::stdout().flush()?;
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        if input.trim().eq_ignore_ascii_case("quit") {
            break;
        }

        match input.parse::<VoteChoice>() {
            Ok(choice) => poll.vote(choice)?,
            Err(error) => eprintln!("{error}"),
        }
    }

    println!(
        "yes={} no={} abstain={} total={}",
        poll.yes,
        poll.no,
        poll.abstain,
        poll.total()
    );
    Ok(())
}
