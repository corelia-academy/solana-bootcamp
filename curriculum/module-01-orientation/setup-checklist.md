# Module 1 setup & first deployment checklist

## Môi trường và project

- [ ] Hoàn thành [Module 0 readiness checklist](../module-00-orientation/readiness-checklist.md).
- [ ] Dùng macOS, Linux hoặc Windows WSL2 theo môi trường được hỗ trợ.
- [ ] Rust, Cargo, Solana CLI, Anchor, Node và pnpm khớp [course setup](../../docs/setup.md).
- [ ] Project mẫu nằm ngoài repo; khóa Rust/Node/Anchor và client theo lesson 1.3.
- [ ] Wallet riêng cho khóa học; không dùng lại key mainnet.
- [ ] Devnet được chọn cho Solana CLI và wallet có Devnet SOL.
- [ ] Explorer hiển thị đúng public wallet address trên Devnet.
- [ ] Xác định được config, source program, tests, IDL và deploy artifact.

## Build, deploy và kiểm tra

- [ ] `anchor build` thành công.
- [ ] `anchor test --provider.cluster localnet` thành công.
- [ ] Program ID trong keypair, `declare_id!`, Anchor.toml và IDL local đồng nhất.
- [ ] Anchor provider chọn Devnet và đúng wallet học tập trước deploy.
- [ ] Deploy chương trình mẫu lên Devnet thành công.
- [ ] Upgrade cùng Program ID thành công bằng wallet có upgrade authority.
- [ ] Explorer hiển thị executable program trên Devnet.
- [ ] IDL init và upgrade trên Devnet thành công; fetch được IDL.
- [ ] Địa chỉ và danh sách instruction của IDL fetch khớp IDL local.
- [ ] `anchor test --provider.cluster devnet --skip-deploy` thành công.
- [ ] Transaction test trên Explorer gọi đúng program và có log sau upgrade.

## Minh chứng và hoàn thành

- [ ] Lưu OS/terminal, version output, cây thư mục và build/test local output.
- [ ] Lưu public wallet address, Program ID, Explorer links và output deploy/upgrade/IDL/test Devnet.
- [ ] Báo cáo, screenshot và code không chứa seed phrase, private key hoặc keypair file.
- [ ] Khi gặp lỗi, ghi command, thư mục, lỗi đầy đủ, version và các cách đã thử.

[Lab và command chi tiết](./lessons.md#lab-cuối-module) · [Module 1](./README.md) · [Module 2](../module-02-rust/README.md)
