mod tree;

use std::time::Duration;
use tokio::time::sleep;
use tree::{get_proof, merkle_root, verify};

async fn fetch_half(first: bool) -> Vec<&'static str> {
    sleep(Duration::from_millis(if first { 10 } else { 20 })).await;
    if first {
        vec!["Lan", "Minh"]
    } else {
        vec!["An", "Bình"]
    }
}

async fn load_guests() -> Vec<&'static str> {
    let (mut first, second) = tokio::join!(fetch_half(true), fetch_half(false));
    first.extend(second);
    first
}

async fn gate(label: &'static str, delay_ms: u64) -> &'static str {
    sleep(Duration::from_millis(delay_ms)).await;
    label
}

async fn fastest_gate() -> &'static str {
    tokio::select! {
        biased;
        label = gate("cổng nhanh", 10) => label,
        label = gate("cổng chậm", 100) => label,
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pending = load_guests();
    println!("Đã tạo yêu cầu lấy khách; bắt đầu chờ bằng await");
    let guests = pending.await;
    println!("Số khách: {}", guests.len());
    println!("Phản hồi đầu tiên: {}", fastest_gate().await);

    let root = merkle_root(&guests).ok_or("danh sách rỗng")?;
    let proof = get_proof(&guests, 1).ok_or("không có khách ở index 1")?;
    println!("Minh có vé: {}", verify("Minh", &proof, &root));
    println!("Đổi tên có vé: {}", verify("Người khác", &proof, &root));
    println!("Số hash trong proof: {}", proof.len());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test(flavor = "current_thread")]
    async fn joins_both_guest_lists_in_source_order() {
        assert_eq!(load_guests().await, vec!["Lan", "Minh", "An", "Bình"]);
    }

    #[tokio::test(flavor = "current_thread")]
    async fn selects_the_fast_gate() {
        assert_eq!(fastest_gate().await, "cổng nhanh");
    }
}
