// Mode preference is a UX hint — which auth tree we mount on the next
// reload — NOT a credential. localStorage is allowed here per the
// `no-restricted-globals` ESLint guard's `**/auth/**` scope (this file
// lives outside that scope on purpose). Tokens stay in-memory + httpOnly
// cookies / SecureStore as ADR 0006 requires; this file persists only
// `{ mode, lastLocalUrl? }`.

const STORAGE_KEY = 'glaon.mode-preference';

export type ModeChoice = 'local' | 'cloud';

export interface ModePreference {
  readonly mode: ModeChoice;
  readonly lastLocalUrl?: string;
}

export function readModePreference(storage: Storage = window.localStorage): ModePreference | null {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;
  const candidate = parsed as Record<string, unknown>;
  if (candidate.mode !== 'local' && candidate.mode !== 'cloud') return null;
  const out: { mode: ModeChoice; lastLocalUrl?: string } = { mode: candidate.mode };
  if (typeof candidate.lastLocalUrl === 'string' && candidate.lastLocalUrl.length > 0) {
    out.lastLocalUrl = candidate.lastLocalUrl;
  }
  return out;
}

export function writeModePreference(
  preference: ModePreference,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch {
    /* private mode / quota — non-fatal */
  }
}

export function clearModePreference(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
