// Best-effort probe: is a Home Assistant instance reachable on the LAN at
// the given URL? Used by the mode selector to surface "Local instance
// found at <url>" when the user is at home.
//
// HA's public `GET /api/discovery_info` returns version + location_name
// without auth; we don't need the body — just a 200. False negatives are
// fine (CORS denial, network blip): the user can still pick local
// manually with a URL of their choice.

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
      mode: 'cors',
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
