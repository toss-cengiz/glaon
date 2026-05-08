// Glaon addon relay agent — process entry point. Reads addon options
// (`/data/options.json` is HA Supervisor's standard path), opens the cloud
// upstream + local HA WS, wires the FrameBridge between them, and surfaces a
// /agent/healthz HTTP endpoint plus the /pair Ingress UI (#349) that nginx
// proxies under Ingress.
//
// The agent process is always running — even before the user has paired the
// addon — because the /pair surface lives in this same Node process. The
// supervisor loop (`runAgentLoop`) sits in IDLE state until /pair/claim
// writes credentials and signals it to wake up.
//
// Real WebSocket transport is the standard `ws` module; the bridge logic
// lives in `bridge.ts` and is exercised by unit tests with FakeSockets — the
// entry below is the small glue that wires Real Things™ together. CI does not
// run this entry; it lights up only inside the addon image.

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import WebSocket from 'ws';

import { FrameBridge } from './bridge';
import { FatalRelayAuthError, nextDelay } from './backoff';
import { createPairHandler } from './pair-server';
import { scrub } from './scrubber';
import { AgentState } from './state';
import {
  FileOptionsStore,
  inspectOptionsPerms,
  isPaired,
  type AddonOptions,
} from './options-store';

const OPTIONS_PATH = process.env.GLAON_OPTIONS_PATH ?? '/data/options.json';
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;

function log(level: 'info' | 'warn' | 'error', record: Record<string, unknown>): void {
  const safe = scrub(record);
  // eslint-disable-next-line no-console -- agent logs ship via stdout to the addon supervisor
  console[level === 'error' ? 'error' : 'warn'](
    JSON.stringify({
      level,
      time: new Date().toISOString(),
      ...(safe as Record<string, unknown>),
    }),
  );
}

function loadStaticAssets(): { html: string; css: string; js: string } {
  const dir = join(__dirname, 'static');
  return {
    html: readFileSync(join(dir, 'pair.html'), 'utf-8'),
    css: readFileSync(join(dir, 'pair.css'), 'utf-8'),
    js: readFileSync(join(dir, 'pair.js'), 'utf-8'),
  };
}

function startHttpServer(state: AgentState, store: FileOptionsStore): void {
  const port = Number(process.env.AGENT_HEALTHZ_PORT ?? '8001');
  const pairHandler = createPairHandler({
    options: store,
    state,
    staticAssets: loadStaticAssets(),
    logger: log,
  });
  const server = createServer((req, res) => {
    const url = req.url ?? '/';
    if (url === '/agent/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', state: state.view().name }));
      return;
    }
    if (url === '/pair' || url.startsWith('/pair/') || url.startsWith('/pair?')) {
      pairHandler(req, res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not-found' }));
  });
  server.listen(port, () => {
    log('info', { msg: 'agent-http-listening', port });
  });
}

async function runAgentLoop(state: AgentState, store: FileOptionsStore): Promise<void> {
  let attempt = 0;
  for (;;) {
    // Refuse to read credentials from a world-readable options file (#351).
    // chmod 0o600 is attempted once; if that fails the loop sits in IDLE
    // until /pair/claim writes a fresh 0o600 file via FileOptionsStore.
    const perms = inspectOptionsPerms(OPTIONS_PATH);
    if (perms.state === 'unsafe') {
      state.set({ name: 'idle', homeId: null, attempt: 0, lastError: 'options-perms-unsafe' });
      log('error', {
        msg: 'options-perms-unsafe',
        modeOctal: perms.mode.toString(8),
        reason: perms.reason,
      });
      await state.waitForWake();
      continue;
    }
    if (perms.state === 'fixed') {
      log('warn', {
        msg: 'options-perms-fixed',
        previousModeOctal: perms.previousMode.toString(8),
      });
    }
    const options = store.read();
    if (!isPaired(options) || SUPERVISOR_TOKEN === undefined) {
      state.set({ name: 'idle', homeId: null, attempt: 0 });
      log('info', {
        msg: 'agent-idle',
        reason: SUPERVISOR_TOKEN === undefined ? 'no-supervisor-token' : 'unpaired',
      });
      await state.waitForWake();
      continue;
    }
    state.set({ name: 'connecting', homeId: options.home_id ?? null, attempt });
    try {
      await runOnce(options as Required<AddonOptions>, state);
      attempt = 0;
    } catch (err) {
      if (err instanceof FatalRelayAuthError) {
        state.set({ name: 'fatal', lastError: err.message });
        log('error', { msg: 'fatal-auth', detail: err.message });
        // Wait for re-pair instead of retry-storming.
        await state.waitForWake();
        attempt = 0;
        continue;
      }
      attempt += 1;
      const delay = nextDelay(attempt);
      state.set({ name: 'backoff', attempt, lastError: String(err) });
      log('warn', { msg: 'reconnect', attempt, delayMs: delay, err: String(err) });
      await new Promise<void>((r) => setTimeout(r, delay));
    }
  }
}

// `cloud_url` arrives via /data/options.json which the addon operator controls.
// CodeQL `js/file-access-to-http` flags any flow from file data to the
// outbound WebSocket URL. We defuse it completely: the URL handed to
// `new WebSocket(...)` is selected from a closed set of string literals — no
// substring of `cloud_url` (or any other file-derived value) is interpolated
// into it. The `cloud_url` field acts as a *mode selector*; once the host is
// recognized, we return the matching literal endpoint. `home_id` rides in the
// `X-Glaon-Home` request header instead of a query string for the same reason.
//
// Localhost dev fixtures can override the literal via `GLAON_DEV_UPSTREAM`
// (process env, operator-controlled at container start, not file-data).
const PROD_UPSTREAM = 'wss://relay.glaon.app/relay/agent';
const STAGING_UPSTREAM = 'wss://relay-staging.glaon.app/relay/agent';

function selectUpstream(cloudUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(cloudUrl);
  } catch {
    throw new FatalRelayAuthError(`cloud_url is not a valid URL`);
  }
  if (parsed.protocol !== 'wss:' && parsed.protocol !== 'https:') {
    throw new FatalRelayAuthError(`cloud_url must use wss:// or https://`);
  }
  switch (parsed.host) {
    case 'relay.glaon.app':
      return PROD_UPSTREAM;
    case 'relay-staging.glaon.app':
      return STAGING_UPSTREAM;
    default: {
      const isLocalhost = parsed.host === 'localhost' || /^localhost:\d{1,5}$/.test(parsed.host);
      const dev = process.env.GLAON_DEV_UPSTREAM;
      if (isLocalhost && dev !== undefined && dev.length > 0) {
        return dev;
      }
      throw new FatalRelayAuthError(`cloud_url host not in allowlist`);
    }
  }
}

async function runOnce(options: Required<AddonOptions>, state: AgentState): Promise<void> {
  const upstreamUrl = selectUpstream(options.cloud_url);
  const cloud = new WebSocket(upstreamUrl, {
    headers: {
      Authorization: `Bearer ${options.relay_secret}`,
      'X-Glaon-Home': options.home_id,
    },
  });
  const home = new WebSocket('ws://supervisor/core/websocket', {
    headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN ?? ''}` },
  });

  await Promise.all([waitOpen(cloud, 'cloud'), waitOpen(home, 'home')]);
  state.set({ name: 'running', homeId: options.home_id, lastError: null });
  log('info', { msg: 'agent-connected', homeId: options.home_id });

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
    { homeId: options.home_id, pinnedSessionId: null },
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
  const state = new AgentState();
  const store = new FileOptionsStore(OPTIONS_PATH);
  startHttpServer(state, store);
  void runAgentLoop(state, store);
}
