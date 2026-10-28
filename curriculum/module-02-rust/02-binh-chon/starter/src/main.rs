mod poll;

use poll::{Choice, Poll};
use std::fmt::Display;
use std::io::{self, Write};

// Dùng cùng hàm cho tiêu đề, Choice và tổng phiếu: chúng đều có Display.
fn show<T: Display>(value: T) {
    println!("{value}");
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut poll = Poll::new("Có nên học bằng project?")?;
    show(poll.title());
    println!("yes / no / abstain; quit để thoát");

    loop {
        print!("> ");
        io::stdout().flush()?;
        let mut input = String::new();
        if io::stdin().read_line(&mut input)? == 0 {
            break; // EOF: không còn dữ liệu để đọc.
        }
        if input.trim().eq_ignore_ascii_case("quit") {
            break;
        }
        match input.parse::<Choice>() {
            Ok(choice) => match poll.vote(choice) {
                Ok(()) => show(choice),
                Err(error) => eprintln!("{error}"),
            },
            Err(error) => eprintln!("{error}"),
        }
    }

    for choice in [Choice::Yes, Choice::No, Choice::Abstain] {
        println!("{choice}: {}", poll.count(choice));
    }
    print!("Tổng: ");
    show(poll.total());
    Ok(())
}
