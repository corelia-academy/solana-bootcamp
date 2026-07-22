# Program Derived Addresses

![Sơ đồ PDA](./images/pda.png)

[Mở source Excalidraw](./images/pda.excalidraw)

A PDA is a deterministic address derived from seeds and a program ID. It has no private key; the owning program can sign for it during a CPI by providing the original seeds and bump.

```mermaid
flowchart LR
    Seeds[Seeds: "poll" + poll_id] --> Derive[findProgramAddress]
    Program[Program ID] --> Derive
    Derive --> PDA[Poll PDA]
    Derive --> Bump[Bump]
```

## Rules

- Seeds must be stable, bounded, and unambiguous.
- Include namespace prefixes such as `b"poll"`.
- Validate the PDA in every instruction that depends on its identity.
- Never treat the bump alone as proof of identity.
- Frontend and tests must derive the same address from the same bytes.
