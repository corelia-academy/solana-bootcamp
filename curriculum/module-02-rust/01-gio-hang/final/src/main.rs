const GIFT_THRESHOLD: u128 = 60_000;

#[derive(Debug)]
struct CartItem {
    name: String,
    price: u32,
    quantity: u16,
}

impl CartItem {
    fn subtotal(&self) -> u64 {
        u64::from(self.price) * u64::from(self.quantity)
    }

    fn rename(&mut self, name: &str) {
        self.name = name.to_owned();
    }
}

fn total(items: &[CartItem]) -> u128 {
    items.iter().map(|item| u128::from(item.subtotal())).sum()
}

fn main() {
    let menu = [("Cà phê", 25_000_u32), ("Trà", 18_000), ("Nước", 8_000)];
    for (index, (name, price)) in menu.iter().enumerate() {
        println!("{}. {name}: {price}đ", index + 1);
    }

    let mut cart = vec![CartItem {
        name: menu[0].0.to_owned(),
        price: menu[0].1,
        quantity: 2,
    }];
    cart.push(CartItem {
        name: menu[1].0.to_owned(),
        price: menu[1].1,
        quantity: 1,
    });
    cart[1].rename("Trà đá");

    for item in &cart {
        println!("{} x{} = {}đ", item.name, item.quantity, item.subtotal());
    }
    let amount = total(&cart);
    let gets_gift = amount >= GIFT_THRESHOLD;
    let message = if gets_gift {
        "Được tặng nước"
    } else {
        "Chưa có quà"
    };
    let currency: char = 'đ';
    println!("Tổng: {amount}{currency} — {message}");
    println!("Giỏ vẫn còn {} món sau khi tính tổng", cart.len());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn calculates_quantity_and_total_without_consuming_cart() {
        let mut cart = vec![CartItem {
            name: "Trà".to_owned(),
            price: 18_000,
            quantity: 2,
        }];
        assert_eq!(cart[0].subtotal(), 36_000);
        assert_eq!(total(&cart), 36_000);
        cart[0].rename("Trà đá");
        assert_eq!(cart[0].name, "Trà đá");
        assert_eq!(total(&[]), 0);
    }

    #[test]
    fn widens_numbers_before_multiplication() {
        let item = CartItem {
            name: "Giới hạn".to_owned(),
            price: u32::MAX,
            quantity: u16::MAX,
        };
        assert_eq!(item.subtotal(), u64::from(u32::MAX) * u64::from(u16::MAX));
    }
}
