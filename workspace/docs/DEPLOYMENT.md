# Deployment runbook

This is a candidate topology, not a completed deployment. Docker and live providers have not been exercised on this Windows host. Do not accept real orders until the remaining checks in IMPLEMENTATION_STATUS.md pass.

## Topology
Place api and client checkouts beside the shared workspace inputs. Build from the root context using docker build -f api/Dockerfile -t nkb-api . and docker build -f client/Dockerfile --build-arg NEXT_PUBLIC_SITE_URL=https://YOUR_APPROVED_DOMAIN --build-arg API_INTERNAL_URL=http://api:4000 -t nkb-client . . Substitute an owned domain; no domain has been invented or registered.

Run three non-root services: Next client on 3000, API on 4000, and the same API image with command node dist/worker.js. Keep API, database and Redis private. Terminate TLS at an ingress and route /api/v1/* and /api/auth/* to API; all other traffic goes to Next. Enforce ingress request limits and distributed rate limits. Trust forwarded IP headers only from your ingress; the API intentionally does not trust arbitrary forwarded headers. Configure Redis with persistence and noeviction. Provide backups/PITR for PostgreSQL and a dedicated application role without migration ownership privileges. Provide a separate MIGRATION_DATABASE_URL only to the release job.

## Release sequence
1. Freeze and review both repository revisions and the shared lockfile. Run dependency/license/security scanning in the target environment.
2. Run CI against PostgreSQL 17 and Redis 7.4. Build Linux images, verify health, graceful shutdown and non-root operation. Containers have not been locally verified because Docker is absent.
3. Back up the target database; run prisma migrate deploy with the migration role as a one-off release job from the source/build environment. Do not seed demonstration data in staging or production.
4. Configure server-only secrets using api/.env.example as the contract. APP_ENV=production requires live PayHere, Cloudinary, Resend, HTTPS origins, approved sender and terms version. The startup gate rejects active demo products and draft policies. Manual shipping is supported; SHIPPING_PROVIDER=dhl deliberately refuses startup until its adapter is implemented and accepted.
5. Start the API and worker. Probe /health/live and /health/ready; readiness tests database schema access and production Redis. Alert on unhealthy or missing worker and aged outbox leases.
6. Start Next with the same internal API address used during the build. Use the standalone server; its public and static assets must accompany it. NEXT_PUBLIC_* values are public build inputs, never secrets.
7. Create a verified first owner, configure MFA, approve real catalogue, shipping/tax and policies in a controlled staging workflow, then complete provider sandbox and live verification. Test duplicate callbacks, a small payment and refund, email delivery, actual image upload and merchant IP allowlisting.

## Rollback
Keep the previous application images/revisions. Prefer backward-compatible expand/contract migrations. Roll back applications only when their schema expectations remain compatible; do not undo ledger facts or blindly reverse migrations. If data recovery is required, restore into a separate database, verify counts and accounting/stock invariants, reconcile provider facts after the recovery point, and explicitly approve cutover. Never restore a dump over the only live copy.

## CI configuration
Both repositories include workflows. Set repository variable NKB_API_REPOSITORY on the client repository to the owner/name of the API repository. A private sibling checkout needs a least-privilege read token in NKB_CI_TOKEN. API CI restores shared workspace inputs from api/workspace. Client CI checks both repositories out as siblings and uses the API lockfile. CI files are provided but have not been run on GitHub; no remote was supplied or pushed.

The current implementation uses English and LKR, manual configured delivery, a single advisory commerce lock and process-local HTTP throttles. Complete the documented scale, locale and infrastructure work before enabling additional markets or replicas.
