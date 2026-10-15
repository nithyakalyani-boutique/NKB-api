# Implementation status — 15 October 2026

A working custom local storefront, staff dashboard, API and worker are implemented. This is **not a claim that every detailed requirement in PROJECT.md is complete**, and it has not been deployed for real sales. The provided logo is used. The catalogue, policies, local email and payment simulator are explicitly demonstrations.

| Milestone | Status | Evidence / limits |
| --- | --- | --- |
| M0 foundation | verified locally | Pinned pnpm workspace; independent api/.git and client/.git; fresh root-input restoration; dependency installation, Prisma generation and migrations |
| M1 data/staff | core verified locally | Real PostgreSQL; official Better Auth/MFA schema; owner bootstrap; backend RBAC/CSRF; audit records; no universal password |
| M2 storefront | verified locally | Responsive homepage, catalogue, filters, products, cart, wishlist, account/content routes; supplied branding; real browser screenshots |
| M3 commerce | core verified locally | Exact money, immutable quotes, stock reservations, callbacks, idempotency, guest access, refund submission/recovery and cart merging |
| M4 operations | core verified locally | Staff catalogue/media, inventory, purchasing/receipts, shipments, return inspection, refunds/reconciliation, promotions, content and settings; local notification worker |
| M5 release candidate | incomplete | Dockerfiles, CI and runbooks provided; infrastructure/provider acceptance and remaining detailed scope below are outstanding |
| M6 live launch | not performed | Requires approved business inputs, hosting, provider verification and release acceptance |

## Checks actually run

- API unit tests: 30 passed. Client unit tests: 7 passed.
- PostgreSQL integration tests: 22 passed, including stock races, checkout replay/mismatch, stale quotes/terms, payment mismatch/replay/late capture, partial dispatch, concurrent refunds, interrupted refund recovery, duplicate capture refunds, receipt replay, ownership, cart merge and generated response contracts.
- Browser suite: six passed using installed Microsoft Edge: staff sign-in and saved operations; guest checkout through a simulated successful payment; mobile reflow and axe catalogue checks; private-order denial; HTTP origin/CSRF/auth enforcement; owned image upload and invalid-image rejection.
- API and Next production builds, TypeScript checks and ESLint passed. Final standalone preview acceptance is recorded in VERIFICATION.md.
- pnpm audit --prod: no known vulnerabilities after resolving the initial nine findings. No test or audit result guarantees production security.
- The local launcher starts real PostgreSQL, applies migrations without resetting data, seeds idempotent fixtures, builds the API, and starts API/worker/storefront. --preview builds and starts the standalone Next bundle. Shared files can be restored using node api/scripts/restore-workspace.mjs.

## Remaining implementation and release work

The detailed blueprint is broader than the verified local core. Remaining work includes staff email invitation acceptance (current owner assigns existing accounts), scheduled historical pricing and fully normalized taxonomy/translation administration, all detailed administration CRUD screens, comprehensive response schemas for every admin endpoint, provider payment-retrieval reconciliation and a complete financial-exception resolution workflow, configured return-window/exclusion rules, Sentry wiring, distributed HTTP throttling, indexed database-level search/pagination at larger scale, and representative performance measurements. Existing exception screens preserve unresolved evidence and block unsafe fulfillment; they are not an automated settlement service.

PayHere checkout verification and refund HTTP adapters are implemented and tested with synthetic inputs; real sandbox/live calls, merchant credentials, refunds and settlement verification have **not** occurred. Cloudinary and Resend adapters need credentialed end-to-end acceptance. Manual configured delivery works locally; contracted DHL integration is not implemented and selecting dhl fails clearly. English and LKR are the initial supported locale/currency. Reviewed Tamil/Sinhala translations and additional market rules are not invented.

Docker, Redis/BullMQ, GitHub CI, Linux containers and a logical backup/restore rehearsal have not been run on this Windows host. Docker and Redis are absent; pg_dump/pg_restore are not included in the embedded server package. CI includes a real Redis worker check and isolated PostgreSQL restore rehearsal, but no remote repository was supplied or workflow run claimed. PostgreSQL 18.4 was used locally; CI/Compose target 17.6. Validate that version difference before release.

The current schema consolidates some blueprint tables into versioned records and JSON snapshots. Commerce writes use one PostgreSQL advisory transaction lock for boutique-scale correctness. Broader screen-reader, keyboard, device and load testing remain; the axe result covers the tested mobile catalogue, not the entire site.

## Evidence and changed areas

Browser screenshots: client/test/evidence/home-desktop.png, admin-desktop.png, checkout-desktop.png, order-desktop.png and shop-mobile.png. Key code areas: api/prisma, api/src/modules, api/src/integrations, api/src/contracts, api/src/jobs, api/test, client/src/app, client/src/components, client/src/lib/api and client/test. Startup, Docker, CI and handoff documentation are included. Canonical root files and the original specification are tracked under api/workspace; dependency snapshots are also in client/workspace.

Failures encountered and resolved: sandbox restrictions required authorized network/process reruns; local services stopped across conversation pauses, producing connection-refused tests before restart; browser labels/mobile sort naming were corrected; the invalid-media test was corrected to expect the API's 422 response; initial dependency audit findings were patched. No failed or unrun check is counted as passed.

See SETUP.md, DEPLOYMENT.md, OPERATIONS.md, BUSINESS_INPUTS.md and TECHNOLOGY_DECISIONS.md. Both repositories exceed the requested minimum commit counts; histories consist of nonempty incremental changes.
