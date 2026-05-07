// Glaon addon relay agent — process entry point. Reads addon options
// (`/data/options.json` is HA Supervisor's standard path), opens the cloud
// upstream + local HA WS, wires the FrameBridge between them, and surfaces a
// /agent/healthz HTTP endpoint that nginx proxies under Ingress.
//
// Real WebSocket transport is the standard `ws` module; the bridge logic
// lives in `bridge.ts` and is exercised by unit tests with FakeSockets — the
// entry below is the small glue that wires Real Things™ together. CI does not
// run this entry; it lights up only inside the addon image.

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import WebSocket from 'ws';

import { FrameBridge } from './bridge';
import { FatalRelayAuthError, nextDelay } from './backoff';
import { scrub } from './scrubber';

interface AddonOptions {
  readonly cloud_url?: string;
  readonly home_id?: string;
  readonly relay_secret?: string;
}

const OPTIONS_PATH = process.env.GLAON_OPTIONS_PATH ?? '/data/options.json';
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;

function log(level: 'info' | 'warn' | 'error', record: Record<string, unknown>): void {
  const safe = scrub(record);
  // eslint-disable-next-line no-console -- agent logs ship via stdout to the addon supervisor
  console[level === 'error' ? 'error' : 'warn'](
    JSON.stringify({ level, time: new Date().toISOString(), ...(safe as Record<string, unknown>) }),
  );
}

function readOptions(): AddonOptions {
  try {
    const raw = readFileSync(OPTIONS_PATH, 'utf-8');
    return JSON.parse(raw) as AddonOptions;
  } catch (err) {
    log('warn', { msg: 'options-read-failed', err: String(err) });
    return {};
  }
}

function startHealthzServer(): void {
  const port = Number(process.env.AGENT_HEALTHZ_PORT ?? '8001');
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
  server.listen(port, () => {
    log('info', { msg: 'healthz-listening', port });
  });
}

async function runAgentLoop(options: AddonOptions): Promise<void> {
  const cloudUrl = options.cloud_url;
  const homeId = options.home_id;
  const relaySecret = options.relay_secret;
  if (
    cloudUrl === undefined ||
    homeId === undefined ||
    relaySecret === undefined ||
    SUPERVISOR_TOKEN === undefined
  ) {
    log('warn', { msg: 'agent-config-missing', has_cloud: cloudUrl !== undefined });
    return;
  }

  let attempt = 0;
  for (;;) {
    try {
      await runOnce(cloudUrl, homeId, relaySecret);
      attempt = 0;
    } catch (err) {
      if (err instanceof FatalRelayAuthError) {
        log('error', { msg: 'fatal-auth', detail: err.message });
        return; // do not retry-storm on bad relay_secret
      }
      attempt += 1;
      const delay = nextDelay(attempt);
      log('warn', { msg: 'reconnect', attempt, delayMs: delay, err: String(err) });
      await new Promise<void>((r) => setTimeout(r, delay));
    }
  }
}

// `cloud_url` arrives via /data/options.json which the addon operator controls.
// CodeQL `js/file-access-to-http` flags this file → network sink. We sanitize
// the input by:
//   1. Validating it parses as a URL.
//   2. Rejecting anything but wss:// or https:// schemes.
//   3. Matching the host against an explicit allowlist (Glaon production /
//      staging plus localhost for dev fixtures).
//   4. Rebuilding the upstream URL from scratch — only `host` flows through,
//      and only after the regex check has narrowed it.
const ALLOWED_CLOUD_HOSTS = /^(?:relay(?:-staging)?\.glaon\.app|localhost(?::\d+)?)$/;

function buildUpstreamUrl(cloudUrl: string, homeId: string): string {
  let parsed: URL;
  try {
    parsed = new URL(cloudUrl);
  } catch {
    throw new FatalRelayAuthError(`cloud_url is not a valid URL`);
  }
  if (parsed.protocol !== 'wss:' && parsed.protocol !== 'https:') {
    throw new FatalRelayAuthError(`cloud_url must use wss:// or https://`);
  }
  if (!ALLOWED_CLOUD_HOSTS.test(parsed.host)) {
    throw new FatalRelayAuthError(`cloud_url host not in allowlist`);
  }
  return `wss://${parsed.host}/relay/agent?home=${encodeURIComponent(homeId)}`;
}

async function runOnce(cloudUrl: string, homeId: string, relaySecret: string): Promise<void> {
  const upstreamUrl = buildUpstreamUrl(cloudUrl, homeId);
  const cloud = new WebSocket(upstreamUrl, {
    headers: { Authorization: `Bearer ${relaySecret}` },
  });
  const home = new WebSocket('ws://supervisor/core/websocket', {
    headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN ?? ''}` },
  });

  await Promise.all([waitOpen(cloud, 'cloud'), waitOpen(home, 'home')]);
  log('info', { msg: 'agent-connected', homeId });

  const bridge = new FrameBridge(
    {
      send: (d) => {
        cloud.send(d);
      },
    },
    {
      send: (d) => {
        home.send(d);
      },
    },
    { homeId, pinnedSessionId: null },
  );

  cloud.on('message', (data: WebSocket.RawData) => {
    bridge.onCloudMessage(rawToString(data));
  });
  home.on('message', (data: WebSocket.RawData) => {
    bridge.onHomeMessage(rawToString(data));
  });

  await new Promise<void>((_resolve, reject) => {
    cloud.on('close', (code: number) => {
      reject(new Error(`cloud-closed:${String(code)}`));
    });
    home.on('close', (code: number) => {
      reject(new Error(`home-closed:${String(code)}`));
    });
    cloud.on('unexpected-response', (_req, res) => {
      if (res.statusCode === 401) {
        reject(new FatalRelayAuthError('relay rejected agent secret'));
      } else {
        reject(new Error(`cloud-unexpected:${String(res.statusCode)}`));
      }
    });
    cloud.on('error', (err: Error) => {
      reject(err);
    });
    home.on('error', (err: Error) => {
      reject(err);
    });
  });
}

function rawToString(data: WebSocket.RawData): string {
  if (typeof data === 'string') return data;
  if (data instanceof Buffer) return data.toString('utf-8');
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf-8');
  return Buffer.from(data).toString('utf-8');
}

function waitOpen(ws: WebSocket, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => {
      resolve();
    });
    ws.once('error', (err: Error) => {
      reject(new Error(`${label}-open-failed:${err.message}`));
    });
  });
}

if (process.env.GLAON_AGENT_BOOT !== '0') {
  startHealthzServer();
  void runAgentLoop(readOptions());
}
