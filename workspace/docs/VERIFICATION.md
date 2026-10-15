# Verification record — 15 October 2026

Environment: Windows, Node 24.20.0, pnpm 10.34.7, local PostgreSQL 18.4, Microsoft Edge. Final dependency set includes Vitest 4.1.11 and next-intl 4.14.9. Provider mode was explicitly local/fake; no real payment or email was sent.

| Check | Final observed result |
| --- | --- |
| pnpm install | Passed; Windows embedded-PostgreSQL postinstall ran |
| Prisma generate / migrate deploy | Passed; three migrations applied to development and isolated test databases |
| pnpm lint | API and client passed |
| pnpm typecheck | API and client passed |
| pnpm test | 30 API unit tests and 7 client unit tests passed |
| pnpm --filter @nkb/api test:integration | 22 tests passed using nkb_test PostgreSQL database |
| pnpm local --preview | Built API and Next and started PostgreSQL, API, local worker and standalone client |
| pnpm --filter @nkb/client test:e2e | Six tests passed against the final standalone production bundle in 17.1 seconds |
| Prettier check | API/client source, tests and scripts passed |
| pnpm audit --prod | No known vulnerabilities found after dependency remediation |
| Workspace restoration | node api/scripts/restore-workspace.mjs passed without overwriting local changes |

Total automated tests: 65. The mobile catalogue passed the tested axe WCAG 2 A/AA and 2.1 AA rules and had no horizontal overflow at 375px. This is not a complete accessibility certification. Desktop screenshots were captured at 1440px. Test screenshots are in client/test/evidence and contain only synthetic records.

The provider refund transport tests use controlled HTTP responses, including timeout and failure. Database tests use real transactions. Browser tests use the actual running API and database. Docker images, GitHub-hosted CI, real Redis transport, logical restore and external provider calls have not been executed here; their acceptance remains outstanding. See IMPLEMENTATION_STATUS.md for additional implementation limits.

Temporary browser-test staff grants were disabled and sessions revoked after the final run. To run browser tests again, create a fresh ephemeral identity with the documented local-only script. Create the first real owner using SETUP.md; no default password is provided.
