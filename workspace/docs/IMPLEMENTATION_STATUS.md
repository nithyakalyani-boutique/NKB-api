# Implementation status — 14 October 2026

The application is implemented locally and is undergoing acceptance checks. It is **not production ready** and has not been deployed. Demo products, sample policies, and simulated payments are explicit.

| Milestone | Status | Evidence / limits |
| --- | --- | --- |
| M0 foundation | verified locally | pnpm install, pinned versions, Prisma generation, API/client builds passed; two independent repositories |
| M1 data/staff | verified locally | Real PostgreSQL migrations applied; generated Better Auth/MFA schema; audited staff operations; 24 unit tests passed |
| M2 storefront | in progress | Browser guest purchase passed; mobile axe found an unnamed sort control, fixed and being rerun |
| M3 purchase safety | verified locally | 17 PostgreSQL tests passed: stock race, idempotency, quote changes, callbacks, late capture, refunds, ownership |
| M4 operations | in progress | Partial shipment, receipt replay and local refund worker tests passed; staff browser test being rerun after label fix |
| M5 release candidate | in progress | Production build passed. Browser, production security review, backup/restore and CI hardening remain in progress |
| M6 live launch | blocked on external input | Approved catalogue/images, policies, delivery/tax rules, merchant credentials, domain/hosting and real provider verification required |

The host has Node 24.20.0 but no Docker or Redis. A workspace-local PostgreSQL 18.4 binary runs real database tests. Docker Compose targets PostgreSQL 17.6 and Redis 7.4; the version difference is documented and must be tested in CI. Explicit local PostgreSQL outbox transport is supported; production uses BullMQ/Redis. No Redis/BullMQ runtime verification has been claimed.

Known limits still being addressed or requiring launch work: live PayHere callback/refund reconciliation, contracted DHL adapter, localized reviewed translations, representative performance measurements, screen-reader audit, full backup restore rehearsal, and provider-specific infrastructure verification. The current first-release schema uses controlled text catalogue attributes and JSON snapshots instead of every optional normalized table in the blueprint. A single database advisory lock serializes commerce writes for correctness at boutique scale; load testing is required before higher-volume use.

Commands run and failures: sandbox blocked npm network, tsx userInfo, and esbuild reads; authorized reruns succeeded. An initial integration run failed because the PostgreSQL process stopped across the conversation pause; restart and rerun passed all 17 tests. Initial browser run: 2 passed, 2 failed (label lookup and hidden mobile sort name); fixes are in progress. No failed check is represented as passed.
