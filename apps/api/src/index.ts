// apps/api process entry. Boots once, never reloads — orchestrators
// (Docker, EAS deploy, Add-on supervisor) handle restart on crash.

import { serve } from '@hono/node-server';
import { ZodError } from 'zod';

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
    // ZodError = misconfigured env. The default `String(err)` dumps
    // stringified JSON that's actionable for log aggregators but
    // hostile to a developer on a fresh checkout. Print a friendly
    // banner to stderr first, then the structured log line for
    // machines (#521).
    if (err instanceof ZodError) {
      const missing = err.issues.map((issue) => `  • ${issue.message}`).join('\n');
      process.stderr.write(
        '\n' +
          '═══════════════════════════════════════════════════════════════════\n' +
          '✖ apps/api boot failed — missing required configuration:\n\n' +
          missing +
          '\n\n' +
          'On a fresh checkout, run:\n\n' +
          '  pnpm dev:bootstrap     # creates apps/api/.env + generates SESSION_JWT_SECRET\n' +
          '  pnpm dev:mongo:up      # starts the local Mongo container\n' +
          '  pnpm dev               # re-run the dev orchestrator\n\n' +
          'Production deployments inject these via the deploy pipeline.\n' +
          '═══════════════════════════════════════════════════════════════════\n\n',
      );
    }
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
