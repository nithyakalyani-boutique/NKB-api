import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
mkdirSync('.local', { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir: resolve('.local/postgres'),
  user: 'nkb',
  password: 'nkb_local',
  port: 5432,
  persistent: true,
  postgresFlags: ['-h', '127.0.0.1'],
  onLog: () => {},
  onError: console.error,
});
if (!existsSync('.local/postgres/PG_VERSION')) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
for (const name of ['nkb', 'nkb_test']) {
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name]);
  if (!result.rowCount) await client.query('CREATE DATABASE ' + name);
}
await client.end();
console.log('Local PostgreSQL ready on localhost:5432 (nkb and nkb_test).');
for (const sig of ['SIGINT', 'SIGTERM'])
  process.on(sig, async () => {
    await pg.stop();
    process.exit(0);
  });
setInterval(() => {}, 60000);

process.on('message', async (message) => {
  if (message === 'stop') {
    await pg.stop();
    process.exit(0);
  }
});
