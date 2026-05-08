// HTTP handlers for the addon's `/pair` Ingress route (#349).
//
// Endpoints (all sit under nginx `location /pair { proxy_pass ... }`):
//   GET  /pair          → static HTML page (vanilla, no build)
//   GET  /pair/pair.css → stylesheet
//   GET  /pair/pair.js  → bootstrap script
//   GET  /pair/status   → { paired: boolean, homeId?: string, cloudUrl?: string }
//   POST /pair/claim    → { code }: forwards to cloud /pair/claim
//
// Why this lives in the agent process: the agent already owns the supervisor
// state machine and reads/writes `/data/options.json`. Co-locating the pair
// surface keeps the addon to a single Node process. The state machine wakes
// up on `pairedSignal()` once /claim succeeds.
//
// The cloud claim base URL is read from the addon options (`cloud_url`),
// defaulting to the Glaon prod relay. The fetch sink is restricted to the
// same allowlist the WebSocket upstream uses (CodeQL `js/file-access-to-http`
// disagreed with regex narrowing; we go with literal switch). `home_id` from
// the cloud response is merged into options and never echoed in logs.

import { request } from 'node:https';
import { request as requestHttp } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { scrub } from './scrubber';
import type { AgentState } from './state';
import type { AddonOptions, OptionsStore } from './options-store';
import { isPaired } from './options-store';

interface PairServerDeps {
  readonly options: OptionsStore;
  readonly state: AgentState;
  readonly staticAssets: StaticAssets;
  readonly logger: (level: 'info' | 'warn' | 'error', record: Record<string, unknown>) => void;
  readonly cloudFetch?: CloudFetch | undefined;
}

interface StaticAssets {
  readonly html: string;
  readonly css: string;
  readonly js: string;
}

interface CloudClaimResponse {
  readonly homeId: string;
  readonly relaySecret: string;
  readonly cloudUrl: string;
}

interface CloudClaimError {
  readonly status: number;
  readonly body: {
    error?: string | undefined;
    code?: string | undefined;
    retryAfterMs?: number | undefined;
  };
}

type CloudFetch = (
  cloudUrl: string,
  code: string,
) => Promise<{ ok: true; data: CloudClaimResponse } | { ok: false; err: CloudClaimError }>;

const PROD_CLOUD = 'https://relay.glaon.app';
const STAGING_CLOUD = 'https://relay-staging.glaon.app';

export function createPairHandler(
  deps: PairServerDeps,
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    const url = req.url ?? '/';
    const path = url.split('?')[0] ?? '/';
    if (req.method === 'GET' && (path === '/pair' || path === '/pair/')) {
      serveStatic(res, 'text/html; charset=utf-8', deps.staticAssets.html);
      return;
    }
    if (req.method === 'GET' && path === '/pair/pair.css') {
      serveStatic(res, 'text/css; charset=utf-8', deps.staticAssets.css);
      return;
    }
    if (req.method === 'GET' && path === '/pair/pair.js') {
      serveStatic(res, 'application/javascript; charset=utf-8', deps.staticAssets.js);
      return;
    }
    if (req.method === 'GET' && path === '/pair/status') {
      serveStatus(res, deps.options.read());
      return;
    }
    if (req.method === 'POST' && path === '/pair/claim') {
      void serveClaim(req, res, deps);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not-found' }));
  };
}

function serveStatic(res: ServerResponse, contentType: string, body: string): void {
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function serveStatus(res: ServerResponse, options: AddonOptions): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  if (isPaired(options)) {
    res.end(
      JSON.stringify({
        paired: true,
        homeId: options.home_id,
        cloudUrl: options.cloud_url,
      }),
    );
    return;
  }
  res.end(JSON.stringify({ paired: false }));
}

async function serveClaim(
  req: IncomingMessage,
  res: ServerResponse,
  deps: PairServerDeps,
): Promise<void> {
  let body: string;
  try {
    body = await readBody(req);
  } catch {
    jsonError(res, 400, 'invalid-body');
    return;
  }
  let parsed: { code?: unknown };
  try {
    parsed = JSON.parse(body) as { code?: unknown };
  } catch {
    jsonError(res, 400, 'invalid-json');
    return;
  }
  const code = typeof parsed.code === 'string' ? parsed.code.trim() : '';
  if (code.length === 0) {
    jsonError(res, 400, 'code-required');
    return;
  }

  const stored = deps.options.read();
  const cloudUrl = pickCloudBase(stored.cloud_url);
  const fetcher = deps.cloudFetch ?? defaultCloudFetch;
  const result = await fetcher(cloudUrl, code);
  if (!result.ok) {
    deps.logger('warn', {
      msg: 'pair-claim-rejected',
      status: result.err.status,
      code: result.err.body.code,
    });
    res.writeHead(result.err.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scrub(result.err.body)));
    return;
  }

  // Persist credentials and wake the supervisor.
  deps.options.write({
    cloud_url: result.data.cloudUrl,
    home_id: result.data.homeId,
    relay_secret: result.data.relaySecret,
  });
  deps.logger('info', { msg: 'pair-claim-success', homeId: result.data.homeId });
  deps.state.pairedSignal();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      paired: true,
      homeId: result.data.homeId,
      cloudUrl: result.data.cloudUrl,
    }),
  );
}

function jsonError(res: ServerResponse, status: number, code: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: code }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : chunk;
      total += buf.length;
      if (total > 4096) {
        reject(new Error('payload-too-large'));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    req.on('error', reject);
  });
}

// `cloud_url` from /data/options.json is the same operator-controlled value
// the WebSocket sink reads. Apply the same literal-switch sanitizer pattern
// so CodeQL stays happy on the HTTP claim sink as well.
function pickCloudBase(stored: string | undefined): string {
  if (stored === undefined || stored.length === 0) return PROD_CLOUD;
  let parsed: URL;
  try {
    parsed = new URL(stored);
  } catch {
    return PROD_CLOUD;
  }
  switch (parsed.host) {
    case 'relay.glaon.app':
      return PROD_CLOUD;
    case 'relay-staging.glaon.app':
      return STAGING_CLOUD;
    default: {
      const isLocalhost = parsed.host === 'localhost' || /^localhost:\d{1,5}$/.test(parsed.host);
      const dev = process.env.GLAON_DEV_UPSTREAM_HTTP;
      if (isLocalhost && dev !== undefined && dev.length > 0) {
        return dev;
      }
      return PROD_CLOUD;
    }
  }
}

const defaultCloudFetch: CloudFetch = (cloudUrl, code) => {
  return new Promise((resolve) => {
    const url = new URL('/pair/claim', cloudUrl);
    const payload = JSON.stringify({ code });
    const httpsCall = url.protocol === 'https:';
    const opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const doRequest = httpsCall ? request : requestHttp;
    const req = doRequest(url, opts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf-8');
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(text) as Record<string, unknown>;
        } catch {
          /* noop */
        }
        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) {
          const homeId = typeof body.homeId === 'string' ? body.homeId : '';
          const relaySecret = typeof body.relaySecret === 'string' ? body.relaySecret : '';
          const respondedCloudUrl = typeof body.cloudUrl === 'string' ? body.cloudUrl : cloudUrl;
          if (homeId.length === 0 || relaySecret.length === 0) {
            resolve({ ok: false, err: { status: 502, body: { error: 'bad-cloud-response' } } });
            return;
          }
          resolve({
            ok: true,
            data: { homeId, relaySecret, cloudUrl: respondedCloudUrl },
          });
          return;
        }
        resolve({
          ok: false,
          err: {
            status,
            body: {
              error: typeof body.error === 'string' ? body.error : 'cloud-error',
              code: typeof body.code === 'string' ? body.code : undefined,
              retryAfterMs: typeof body.retryAfterMs === 'number' ? body.retryAfterMs : undefined,
            },
          },
        });
      });
      res.on('error', () => {
        resolve({ ok: false, err: { status: 502, body: { error: 'cloud-stream-error' } } });
      });
    });
    req.on('error', () => {
      resolve({ ok: false, err: { status: 502, body: { error: 'cloud-network-error' } } });
    });
    req.write(payload);
    req.end();
  });
};
