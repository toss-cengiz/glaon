// Runtime configuration parsed from process.env at boot. Validation is
// strict — missing required values surface as a fatal startup error so a
// misconfigured deployment crashes loud rather than booting in a degraded
// state. Per ADR 0025 we lean on Zod across the service.

import { z } from 'zod';

const ConfigSchema = z.object({
  port: z
    .string()
    .optional()
    .default('8080')
    .transform((value) => {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`PORT must be a valid TCP port; got "${value}"`);
      }
      return parsed;
    }),
  mongodbUri: z.string().min(1, 'MONGODB_URI is required'),
  mongodbDb: z.string().min(1).default('glaon'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  buildInfo: z.object({
    commit: z.string().default('unknown'),
    builtAt: z.string().default(''),
    version: z.string().default('0.0.0'),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return ConfigSchema.parse({
    port: env.PORT,
    mongodbUri: env.MONGODB_URI ?? '',
    mongodbDb: env.MONGODB_DB ?? 'glaon',
    logLevel: env.LOG_LEVEL ?? 'info',
    buildInfo: {
      commit: env.GLAON_API_COMMIT ?? 'unknown',
      builtAt: env.GLAON_API_BUILT_AT ?? '',
      version: env.GLAON_API_VERSION ?? '0.0.0',
    },
  });
}
