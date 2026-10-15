# NITHYAKALYANI BOUTIQUE

A custom Next.js storefront and staff dashboard, backed by a NestJS API, PostgreSQL/Prisma, Better Auth, and a durable commerce worker. The supplied boutique logo is included. Local payments and stock are explicitly synthetic.

## Start locally on this Windows machine

Node **24.20.0** is installed. From this folder:

```powershell
.\node_modules\.bin\pnpm.cmd local
```

For a built storefront preview, append --preview. Stop any already-running project services first. This starts workspace-local PostgreSQL, applies migrations without resetting data, seeds idempotent demo products, builds the API, and starts API, worker, and storefront. It creates random local auth configuration only when .env files are absent. Press Ctrl+C to stop the owned processes.

Open **http://localhost:3000/en** and **http://localhost:3000/admin/sign-in**. No universal admin password is seeded. Follow [setup](docs/SETUP.md) to create the first owner.

For a clean checkout: install pnpm 10.34.7 (or use `npm exec --yes --package=pnpm@10.34.7 -- pnpm install --frozen-lockfile`), then run the commands above. Docker users can use `pnpm infra:up` and `pnpm dev`; this mode expects Redis. Details: [SETUP.md](docs/SETUP.md).

## Verification and launch state

See [implementation status](docs/IMPLEMENTATION_STATUS.md), [technology decisions](docs/TECHNOLOGY_DECISIONS.md), and [business inputs](docs/BUSINESS_INPUTS.md). A working local store is not an approved live deployment or a claim that every detailed blueprint feature is finished. PayHere/DHL/provider credentials, approved product photos, policies, delivery/tax rules, and staging checks remain necessary.

## Separate repositories

- Backend history: `api/.git`
- Frontend history: `client/.git`
- No root Git repository was introduced.
- Shared root configuration, docs and the workspace lockfile are committed under `api/workspace/`. The client carries a copy of root dependency inputs for standalone CI. Changes were committed incrementally; no empty count-padding commits were created.
- Commit author is the explicit local automation identity `Codex <codex@localhost>`; no personal identity was invented.

The original [PROJECT.md](PROJECT.md) remains the canonical requested specification. Deliberate deviations and unfinished launch requirements are listed in the status document.
