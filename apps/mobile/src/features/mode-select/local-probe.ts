// Mobile local probe — same shape as the web version
// (`apps/web/src/features/mode-select/local-probe.ts`). Per ADR 0024 we
// hit the user's HA hostname directly (`http://homeassistant.local:8123`)
// rather than a Glaon-specific mDNS name, so RN-side Zeroconf is not
// needed here. iOS resolves `*.local` via Bonjour out of the box; on
// Android it works often but not universally — when the resolver fails
// the user falls back to manual URL entry.

export interface LocalProbeResult {
  readonly reachable: boolean;
  readonly url: string;
  readonly status?: number;
}

interface ProbeOptions {
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 1500;

export async function probeLocal(
  baseUrl: string,
  options: ProbeOptions = {},
): Promise<LocalProbeResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctl = new AbortController();
  const timer = setTimeout(() => {
    ctl.abort();
  }, timeoutMs);
  try {
    const res = await fetchImpl(`${stripTrailingSlash(baseUrl)}/api/discovery_info`, {
      signal: ctl.signal,
      credentials: 'omit',
    });
    return { reachable: res.ok, url: baseUrl, status: res.status };
  } catch {
    return { reachable: false, url: baseUrl };
  } finally {
    clearTimeout(timer);
  }
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
