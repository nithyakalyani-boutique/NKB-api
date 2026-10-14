# API — Backend and Worker

This directory is reserved for the custom NestJS backend and background worker described in [PROJECT.md](../PROJECT.md).

Implement the catalogue, pricing, inventory, purchasing, orders, payments, shipping, refunds, customers, staff permissions, content, and notifications here. PostgreSQL is the source of truth; Prisma schema and migrations belong in `api/prisma/`.

Business endpoints use `/api/v1/*`; the API owns Better Auth at `/api/auth/*`. All sensitive operations require backend authorization. The frontend must not own commerce persistence or payment confirmation logic.

This handoff contains specifications only. Do not treat this directory as an already configured NestJS application.
