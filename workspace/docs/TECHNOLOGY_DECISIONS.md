# Technology decisions

Runtime 24.20.0 (installed Node LTS); pnpm 10.34.7; Next.js 16.4.0; React 19.3.0; NestJS/Express adapter 12.1.3; Express 5.1.0; Prisma/client/pg adapter 7.10.0; Better Auth 1.7.7; TypeScript 5.9.3; Tailwind 4.1.16; TanStack Query 5.90.5; React Hook Form 7.65.0; Zod 4.1.12; next-intl 4.14.9; Vitest 4.1.11; Playwright 1.56.1; BullMQ 5.58.5. Exact transitive versions are in pnpm-lock.yaml.

Current npm latest Prisma was a release candidate; stable Prisma 7.10.0 was selected instead. ESM build, generated Prisma client, adapter-pg and Better Auth's official schema generator were verified together. The selected framework versions compile and run on installed Node 24.20.0. TypeScript 5.9 is retained for known decorator/tool compatibility rather than adopting a newer compiler solely for novelty.

Official compatibility references checked: [Next installation](https://nextjs.org/docs/app/getting-started/installation), [Nest setup](https://docs.nestjs.com/first-steps), [Better Auth Express](https://better-auth.com/docs/integrations/express), [Prisma adapter](https://better-auth.com/docs/adapters/prisma), [Prisma generators](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators).

Separate Git repositories take precedence over the blueprint's root-repository assumption. A shared root pnpm lockfile is kept, with its canonical tracked copy under api/workspace. No Git history is rewritten and no empty commits are used. The client contains committed generated API types, avoiding a database-model dependency.

Commerce writes use one PostgreSQL advisory transaction lock. This conservative single-store design makes stock, refunds, receipts and idempotency serialize safely; scaling requires measured replacement with ordered aggregate locks. Redis is never the inventory authority. Local Windows worker transport may explicitly poll the durable PostgreSQL outbox; production rejects this option and requires BullMQ.

The schema consolidates some blueprint tables: product material attributes are controlled text fields, current variant pricing is versioned in the variant, addresses and immutable quote/order details are JSON snapshots. Full historical price windows, hierarchical taxonomy, multi-location routing, advanced consignment allocations, and all blueprint administration screens are not claimed as implemented. See IMPLEMENTATION_STATUS.md for remaining scope.

System Georgia/Arial fonts avoid remote font dependencies. Approved self-hosted Tamil/Sinhala font assets remain part of translation launch work. The visual system uses customized Radix/shadcn-style primitives, not an unchanged stock theme.

## Security maintenance, 15 October 2026
The first npm production audit found nine advisories. Updated next-intl to 4.14.9 and Vitest to 4.1.11. Scoped workspace overrides pin uuid 11.1.1, mysql2 3.24.6 and Prisma config's deepmerge-ts 8.0.2. The latter is an explicit compatibility exception because Prisma 7.10.0 still pins an affected version; Prisma generation and migrations were rerun against the override. The application uses PostgreSQL, not MySQL. Remove overrides when upstream packages adopt patched versions. The follow-up pnpm audit --prod returned no known vulnerabilities. This is a point-in-time registry check, not a security certification.

References: [deepmerge advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [Vitest advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9).

Storefront response types now derive from exported OpenAPI components. Integration tests validate serialized product/cart/order responses against those schemas. Administrative table responses that vary by resource retain generic row contracts; full endpoint-by-endpoint response validation is still release hardening work.
