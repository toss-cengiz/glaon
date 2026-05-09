// apps/api process entry. Boots once, never reloads — orchestrators
// (Docker, EAS deploy, Add-on supervisor) handle restart on crash.

import { serve } from '@hono/node-server';

import { loadConfig } from './config';
import { connect } from './db';
import { createServer } from './server';

async function main(): Promise<void> {
  const config = loadConfig();
  const { client, db } = await connect(config.mongodbUri, config.mongodbDb);
  const app = createServer({ db, config });

  const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
    process.stdout.write(
      `${JSON.stringify({
        level: 'info',
        msg: 'apps-api-listening',
        port: info.port,
        version: config.buildInfo.version,
        commit: config.buildInfo.commit,
      })}\n`,
    );
  });

  // Graceful shutdown — close the HTTP server first so in-flight
  // requests complete, then drop the Mongo connection. The 10s deadline
  // matches Docker's default SIGTERM grace.
  const shutdown = async (signal: string): Promise<void> => {
    process.stdout.write(
      `${JSON.stringify({ level: 'info', msg: 'apps-api-shutdown', signal })}\n`,
    );
    server.close();
    try {
      await Promise.race([
        client.close(),
        new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error('mongo-close-timeout'));
          }, 10_000);
        }),
      ]);
    } catch (err) {
      process.stderr.write(
        `${JSON.stringify({
          level: 'error',
          msg: 'apps-api-shutdown-error',
          err: String(err),
        })}\n`,
      );
    }
    process.exit(0);
  };
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

if (process.env.GLAON_API_BOOT !== '0') {
  void main().catch((err: unknown) => {
    process.stderr.write(
      `${JSON.stringify({
        level: 'error',
        msg: 'apps-api-boot-failed',
        err: String(err),
      })}\n`,
    );
    process.exit(1);
  });
}
