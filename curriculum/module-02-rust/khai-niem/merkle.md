# Merkle tree — Chứng minh một tên có trong danh sách

Bạn đã biết giữ danh sách khách. Giờ muốn gửi bằng chứng cho một tên mà không phải gửi cả danh sách. Bài này đọc bằng giấy trước; code ở project vé.

## 1. Hash của một tên

Một hàm băm mật mã như SHA-256 biến byte dữ liệu thành dấu vân tay 32 byte. Hash không phải mã hóa có khóa để giải ngược ra tên. Tính an toàn dựa trên việc khó tìm dữ liệu khác có cùng hash; không nên diễn đạt là tuyệt đối không bao giờ có trùng.

Lab dùng L(x) = SHA256(0x00 nối byte UTF-8 của x) cho leaf. Nội dung node dùng N(a,b) = SHA256(0x01 nối a nối b). Prefix khác nhau phân biệt leaf với node; trái/phải giữ nguyên.

## 2. Ghép bốn tên

```text
A = L(Lan)       B = L(Minh)       C = L(An)       D = L(Bình)
      \          /                      \          /
       AB = N(A,B)                        CD = N(C,D)
                \                        /
                    ROOT = N(AB,CD)
```

Một tầng mới có khoảng một nửa số hash tầng cũ. Lặp đến khi còn một root. Không có leaf thì lab trả None; một leaf thì hash leaf là root. Tầng lẻ ghép node cuối với chính nó.

## 3. Proof cho Minh cần gì?

Người kiểm tra đã có root đáng tin và biết các quy tắc băm. Người gửi đưa tên Minh và proof:

| Bước | Dữ liệu được đưa thêm | Tính |
| --- | --- | --- |
| Bắt đầu | Tên Minh | B = L(Minh) |
| 1 | A, hướng bên trái | AB = N(A,B) |
| 2 | CD, hướng bên phải | ROOT' = N(AB,CD) |
| Kết luận | Root đã biết từ trước | ROOT' có bằng ROOT không? |

Proof không cần gửi C/D riêng vì chỉ cần CD để đi từ AB lên root. Với bốn leaf có hai sibling hash. Với n là lũy thừa 2, có log2(n) sibling hashes; theo quy tắc của lab, cây lẻ có ceil(log2(n)) tầng khi n > 1.

## 4. Vì sao index và hướng quan trọng?

Ở một tầng, node index lẻ nằm bên phải; sibling bên trái là index - 1. Index chẵn ở bên trái; sibling bên phải là index + 1. Lên tầng mới thì chia index cho 2 bằng phép chia nguyên.

Minh index 1: bước đầu lấy Lan bên trái. Lên tầng trên thành index 0: lấy CD bên phải. Verify không đảo thứ tự ghép; đảo một bước thường tạo root khác.

## 5. Chứng minh điều gì, chưa chứng minh điều gì?

Proof xác nhận membership dưới một root, theo bộ quy tắc đã thống nhất. Nếu người gửi tự chọn cả root mà bên nhận tin, họ có thể tạo danh sách tùy ý. Root phải có nguồn đáng tin từ trước.

Một cái tên trong danh sách không tự xác thực người đang cầm vé. Membership cũng không chứng minh tên duy nhất, chưa từng dùng vé hoặc tổng số leaf. Với quy tắc lặp node cuối, có thể có danh sách khác độ dài nhưng cùng root khi lặp thêm leaf cuối; đừng suy ra số khách từ root này.

## Tự làm trên giấy

Từ cây trên, viết proof cho Lan, An và Bình, ghi cả hướng. Sau đó quay lại code để đối chiếu. Đổi tên trong verify nhưng giữ proof cũ: kết quả phải false.

**Quay lại:** [vé — tạo root](../03-ve-su-kien/README.md#ticket-3) · [vé — proof và verify](../03-ve-su-kien/README.md#ticket-4).
