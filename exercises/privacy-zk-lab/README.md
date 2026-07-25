# Privacy & ZK Lab

Lab mô phỏng commitment → proof binding → nullifier consumption. Bắt đầu ở [starter](./starter/src/privacy.ts), tự viết tests rồi đối chiếu [solution](./solution/src/privacy.ts).

> Mock proof **không phải zero-knowledge proof an toàn**. Nó chỉ minh họa data flow và replay protection; secret/witness không được đưa lên chain trong hệ thống thật.

![Privacy proof flow](../../notes/images/privacy-flow.png)

```bash
cd solution && pnpm install && pnpm test && pnpm run check
```

## Tài nguyên sơ đồ

[Mở Mermaid source](../../notes/images/privacy-flow.mmd) để chỉnh sửa sơ đồ.
