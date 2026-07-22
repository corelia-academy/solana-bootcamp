# Testing strategy

| Layer | Best for | Trade-off |
| --- | --- | --- |
| Rust unit tests | Pure calculations and validation helpers | No runtime/account behavior |
| LiteSVM | Fast program execution and account setup | Additional Rust test setup |
| Anchor TypeScript | IDL/client behavior and realistic flows | Slower and more integration-heavy |
| Local validator | Deployment and end-to-end behavior | Slowest and environment-dependent |

Every instruction should have a happy-path test, missing/wrong authority test, invalid account relationship test, and relevant boundary test.
