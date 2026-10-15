import { Queue, Worker } from 'bullmq';
import { db, transaction } from './database/db.js';
import { env } from './config/env.js';
import { expireReservations } from './modules/payments.js';
import { processEvent } from './jobs/process.js';
const local = process.env.WORKER_TRANSPORT === 'postgres';
if (local && env.APP_ENV === 'production') throw Error('Production requires Redis/BullMQ');
const url = new URL(env.REDIS_URL);
const connection = {
  host: url.hostname,
  port: Number(url.port || 6379),
  username: url.username ? decodeURIComponent(url.username) : undefined,
  password: url.password ? decodeURIComponent(url.password) : undefined,
  db: Number(url.pathname.slice(1) || 0),
  ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
};
const queue = local ? null : new Queue('nkb-outbox', { connection });
const worker = local
  ? null
  : new Worker('nkb-outbox', (job) => processEvent(String(job.data.id)), {
      connection,
      concurrency: 4,
    });
worker?.on('failed', async (job) => {
  console.error(JSON.stringify({ level: 'error', event: 'job.failed', jobId: job?.id }));
  if (job)
    await db.outboxEvent
      .updateMany({
        where: { id: String(job.data.id), processedAt: null },
        data: { lastError: 'Provider operation failed; inspect and reconcile before replay' },
      })
      .catch(() => {});
});
let stopped = false;
async function tick() {
  if (stopped) return;
  try {
    await expireReservations();
    const rows = await transaction(async (tx) => {
      const rows = await tx.outboxEvent.findMany({
        where: {
          processedAt: null,
          attempts: { lt: 8 },
          availableAt: { lte: new Date() },
          OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
        },
        take: 20,
        orderBy: { createdAt: 'asc' },
      });
      for (const row of rows)
        await tx.outboxEvent.update({
          where: { id: row.id },
          data: { leaseUntil: new Date(Date.now() + 60000), attempts: { increment: 1 } },
        });
      return rows;
    });
    for (const row of rows) {
      try {
        if (queue)
          await queue.add(
            row.kind,
            { id: row.id },
            {
              jobId: row.id,
              attempts: 5,
              backoff: { type: 'exponential', delay: 2000 },
              removeOnComplete: 1000,
              removeOnFail: 1000,
            },
          );
        else await processEvent(row.id);
      } catch {
        await db.outboxEvent.update({
          where: { id: row.id },
          data: {
            lastError: 'Provider operation failed; inspect and reconcile before replay',
            availableAt: new Date(Date.now() + Math.min(3600000, 2000 * 2 ** row.attempts)),
            leaseUntil: null,
          },
        });
      }
    }
  } catch {
    console.error(JSON.stringify({ level: 'error', event: 'worker.tick.failed' }));
  }
  if (!stopped) setTimeout(tick, 2000);
}
console.log('Worker ready using ' + (local ? 'explicit local PostgreSQL transport' : 'BullMQ'));
await tick();
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, async () => {
    stopped = true;
    await worker?.close();
    await queue?.close();
    await db.$disconnect();
    process.exit(0);
  });
