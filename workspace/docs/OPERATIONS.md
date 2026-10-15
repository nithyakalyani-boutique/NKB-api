# Operations and recovery

## Daily checks
Review staff reconciliation issues, UNKNOWN refunds, outbox failures, unfulfilled paid orders and inventory discrepancies. Compare provider settlement totals with append-only CAPTURE, REFUND and CHARGEBACK facts. Log request IDs and aggregate IDs, never passwords, auth tokens, payment secrets or complete addresses. Keep financial and audit records according to an approved retention policy.

## Uncertain refunds
A refund moves REQUESTED -> SUBMITTED before the provider call. A crash, timeout, malformed result or ambiguous HTTP response leaves UNKNOWN and reserves the refundable balance. Replays do not send a second monetary request. Finance must independently inspect the merchant record, then use the order screen to record a confirmed refund number or confirmed failure with statement evidence. Never mark failure merely because no response arrived. Refunds do not restock inventory; return inspection does that separately. PayHere credentials, sandbox/live validation and provider access are still required. The implementation follows [PayHere Refund API](https://support.payhere.lk/api-&-mobile-sdk/refund-api).

## Payment and fulfillment exceptions
Duplicate/late captures preserve paid financial facts and open an issue; they do not manufacture stock. Do not dispatch a financially flagged order. Compare merchant references, amounts and currency before resolving. Manual carrier fulfillment supports partial allocation and dispatch. A return request, physical receipt, inspection, restock and refund are separate operations. Outbox retries are bounded. Investigate provider delivery before replaying failed work.

## Backup and restore
Use infrastructure-managed encrypted backups plus WAL/PITR, restricted storage and an approved retention schedule. For a logical rehearsal use pg_dump -Fc against a nonproduction database, create a new isolated database, and run pg_restore --exit-on-error against that new database. Supply credentials through a private pgpass or secret injection. Match PostgreSQL client/server major versions; never print passwords or commit dumps. Verify migration history, record counts, order/payment totals, stock nonnegativity, reservations and append-only triggers after restore. Run acceptance checks on the restored database before cutover.

The embedded Windows package supplies the server but not pg_dump/pg_restore. A local logical restore rehearsal has therefore not been claimed. The API CI workflow includes a PostgreSQL-container dump/restore rehearsal. It must be run and reviewed before release. Test restoring media configuration and audit evidence alongside the database. Define RPO/RTO with the owner and measure actual recovery time; no SLA is invented here.

## Local preview lifecycle
pnpm local starts owned processes and persists .local/postgres. Stop with Ctrl+C. Do not delete .local/postgres to resolve a startup error; inspect port/process ownership first. Local notification files under api/.local/mailbox contain private verification/reset links and must not be shared. Browser tests create random private test identities; after testing run pnpm --filter @nkb/api exec tsx scripts/disable-test-staff.ts to revoke their grants/sessions. This also allows the first real owner bootstrap.

## Incident response
Pause affected checkout/provider operations at the ingress, preserve evidence, and restrict staff permissions as needed. Rotate compromised secrets through the hosting secret manager and invalidate sessions. Reconcile callbacks arriving during downtime before reopening fulfillment. Use compensating ledger facts and audited workflows; never edit or erase payment/inventory history to make totals match.
