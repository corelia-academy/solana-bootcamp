# Pre-deploy security checklist

- [ ] Every writable account is intentionally writable.
- [ ] Every signer is explicitly checked.
- [ ] Account owners and discriminators are validated.
- [ ] PDA seeds and bumps are correct and verified.
- [ ] Reinitialization is impossible unless explicitly designed.
- [ ] Duplicate-account inputs cannot bypass invariants.
- [ ] Token mints, token-account owners, and authorities are validated.
- [ ] Arithmetic uses checked operations where overflow is possible.
- [ ] CPI targets and transferred amounts are constrained.
- [ ] Close/refund destinations are authorized.
- [ ] Error messages describe actionable failures.
- [ ] Tests cover happy paths, authorization failures, invalid accounts, and boundary values.
- [ ] Devnet program ID and frontend configuration match.
- [ ] No private key, seed phrase, or mainnet credential is committed.

## Token and CPI checks

- [ ] Token program IDs are constrained to the expected implementation.
- [ ] Token accounts match the expected mint and authority.
- [ ] Transfers use checked decimals where appropriate.
- [ ] CPI target programs and every forwarded account are validated.
- [ ] PDA signer seeds are derived from validated state.

## Client and operations checks

- [ ] The client shows the selected cluster and program ID.
- [ ] Transactions are simulated or previewed when risk warrants it.
- [ ] Retry logic does not accidentally submit the same economic action twice.
- [ ] Slippage, fees, and spending limits are enforced deterministically.
- [ ] Upgrade authority, admin keys, pause/kill switch, and recovery are documented.
- [ ] Logs and monitoring avoid secrets and contain actionable identifiers.

For each checked item, link to code, test, diagram, or written rationale. A checkbox without evidence is not a completed review.
