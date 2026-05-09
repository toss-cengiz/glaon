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
  sessionJwtSecret: z
    .string()
    .min(32, 'SESSION_JWT_SECRET must be at least 32 bytes (use a 256-bit random value)'),
  sessionTtlSeconds: z.number().int().positive().default(3600),
  webOrigins: z.array(z.string().url()).default([]),
  buildInfo: z.object({
    commit: z.string().default('unknown'),
    builtAt: z.string().default(''),
    version: z.string().default('0.0.0'),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const ttlRaw = env.SESSION_TTL_SECONDS;
  const ttl = ttlRaw === undefined ? undefined : Number.parseInt(ttlRaw, 10);
  return ConfigSchema.parse({
    port: env.PORT,
    mongodbUri: env.MONGODB_URI ?? '',
    mongodbDb: env.MONGODB_DB ?? 'glaon',
    logLevel: env.LOG_LEVEL ?? 'info',
    sessionJwtSecret: env.SESSION_JWT_SECRET ?? '',
    sessionTtlSeconds: ttl,
    webOrigins: parseOrigins(env.WEB_ORIGINS),
    buildInfo: {
      commit: env.GLAON_API_COMMIT ?? 'unknown',
      builtAt: env.GLAON_API_BUILT_AT ?? '',
      version: env.GLAON_API_VERSION ?? '0.0.0',
    },
  });
}

function parseOrigins(raw: string | undefined): string[] {
  if (raw === undefined || raw.length === 0) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
