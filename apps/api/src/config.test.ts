import { describe, expect, it } from 'vitest';

import { loadConfig } from './config';

describe('loadConfig', () => {
  it('parses defaults when only required values are set', () => {
    const config = loadConfig({ MONGODB_URI: 'mongodb://localhost:27017' });
    expect(config.port).toBe(8080);
    expect(config.mongodbUri).toBe('mongodb://localhost:27017');
    expect(config.mongodbDb).toBe('glaon');
    expect(config.logLevel).toBe('info');
    expect(config.buildInfo).toEqual({
      version: '0.0.0',
      commit: 'unknown',
      builtAt: '',
    });
  });

  it('throws when MONGODB_URI is missing', () => {
    expect(() => loadConfig({})).toThrow();
  });

  it('throws when PORT is not a valid TCP port', () => {
    expect(() => loadConfig({ MONGODB_URI: 'm://x', PORT: 'not-a-number' })).toThrow(
      /must be a valid TCP port/i,
    );
    expect(() => loadConfig({ MONGODB_URI: 'm://x', PORT: '99999' })).toThrow(
      /must be a valid TCP port/i,
    );
  });

  it('rejects unknown log levels', () => {
    expect(() => loadConfig({ MONGODB_URI: 'm://x', LOG_LEVEL: 'verbose' })).toThrow();
  });

  it('honors build info env vars', () => {
    const config = loadConfig({
      MONGODB_URI: 'm://x',
      GLAON_API_VERSION: '1.2.3',
      GLAON_API_COMMIT: 'abc1234',
      GLAON_API_BUILT_AT: '2026-05-09T12:00:00Z',
    });
    expect(config.buildInfo).toEqual({
      version: '1.2.3',
      commit: 'abc1234',
      builtAt: '2026-05-09T12:00:00Z',
    });
  });
});
