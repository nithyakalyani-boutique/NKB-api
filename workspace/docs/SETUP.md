# Setup

## Requirements
Node 24.20.0, pnpm 10.34.7. PostgreSQL 17+ and Redis 7.4 for the standard stack. The Windows convenience launcher uses a workspace-local PostgreSQL 18.4 binary because Docker is not installed on this machine. It does not install a system service. The embedded-postgres npm wrapper is beta; the database binary is a real PostgreSQL server.

## Fresh checkout
Keep api and client as sibling folders. Restore root files from api/workspace if needed. Run pnpm install --frozen-lockfile. Copy api/.env.example to api/.env and client/.env.example to client/.env.local, replacing BETTER_AUTH_SECRET with at least 32 random characters. The local launcher creates these files safely if missing. Never commit them.

### Windows without Docker
Run pnpm local (or .\node_modules\.bin\pnpm.cmd local in PowerShell). Close prior project instances before starting. Data persists in .local/postgres. API:4000, client:3000. Worker uses the explicitly selected PostgreSQL local transport. No real emails or payments are sent.

### Docker infrastructure
Run pnpm infra:up, pnpm env:check, pnpm db:generate, pnpm db:migrate, pnpm db:seed, pnpm dev. Docker Compose provides database, Redis and Mailpit; local email messages are persisted in api/.local/mailbox, with a staff mailbox view. Mailpit is available for later SMTP adapter testing; the current local adapter writes files.

## First owner
1. Start the API and worker, then sign up at /en/sign-up with your own email and a unique password.
2. In local mode open the verification message from api/.local/mailbox and visit its URL. These files are private development data and ignored by Git.
3. Run pnpm admin:create and enter the verified email. The command grants only the first owner; subsequent changes require an existing owner and are audited.
4. Sign in at /admin/sign-in. Configure MFA in /en/account/profile before production access. MFA recovery codes must be stored privately.

The browser test identity is generated with a random password by api/scripts/create-test-staff.ts, restricted to APP_ENV local/test, and saved in ignored api/.local/e2e-user.json. It is not a public/demo login and must never be promoted to production.

## Verification
pnpm lint; pnpm typecheck; pnpm test; pnpm test:integration; pnpm build. Use a separate nkb_test database and set TEST_DATABASE_URL if needed. Run migrations against it with DATABASE_URL and MIGRATION_DATABASE_URL pointing to nkb_test before integration tests. No automatic database reset occurs.

Browser tests require a running API/client, seeded development data, and the local test identity. Run pnpm --filter @nkb/api exec tsx scripts/create-test-staff.ts, then pnpm test:e2e. Use PLAYWRIGHT_CHANNEL=chromium after pnpm --filter @nkb/client exec playwright install chromium on Linux. Tests create explicitly synthetic orders and records.

Do not run next build while next dev is regenerating its type output; stop dev first for a repeatable final build. On Windows PowerShell, use .cmd executables when execution policy blocks .ps1 wrappers.

## Standalone production preview
Use pnpm local --preview to build the storefront and run its standalone server with the same local-only providers. This is a production bundle preview, not production business configuration. The launcher shuts down its own stack together and asks the database to stop cleanly.

After browser testing, run pnpm --filter @nkb/api exec tsx scripts/disable-test-staff.ts to revoke ephemeral test operators before creating your own first owner.
