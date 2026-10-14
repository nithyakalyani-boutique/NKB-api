# Nithyakalyani Boutique API

NestJS 12 / Express 5, strict TypeScript ESM, Prisma 7/PostgreSQL, Better Auth, durable outbox and BullMQ worker. Business routes: /api/v1. Authentication: /api/auth. Health probes: /health/live and /health/ready.

From the parent workspace: pnpm db:generate, pnpm db:migrate, pnpm db:seed, pnpm --filter @nkb/api dev. Local standalone worker: set WORKER_TRANSPORT=postgres, then pnpm --filter @nkb/api worker. Production requires BullMQ/Redis.

Tests: pnpm test and pnpm test:integration. Integration tests require a database name ending in _test and do not reset development data. Review workspace/docs/SETUP.md and workspace/docs/IMPLEMENTATION_STATUS.md for exact evidence and limitations.

Root workspace files are versioned in workspace/ because API and client have separate Git repositories. To reconstruct a parent workspace from this checkout, use scripts/restore-workspace.mjs from this directory; it copies missing files only.
