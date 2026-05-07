// Cross-platform secure token storage contract — see ADR 0006 (Phase 2 revision via ADR 0017).
//
// Three slot kinds, each with its own lifecycle and platform-specific backing:
//   - ha-access      : HA OAuth2 access token (short-lived, 30 min by default).
//                      Web: in-memory only (React context). Mobile: expo-secure-store.
//   - ha-refresh     : HA OAuth2 refresh token (long-lived).
//                      Web: httpOnly + SameSite=Strict cookie set by the addon nginx proxy on
//                      /auth/token. JS never reads this slot — get('ha-refresh') resolves null on
//                      web because the cookie is server-side only. Mobile: expo-secure-store.
//   - cloud-session  : Cloud-mode IdP session JWT (Clerk per ADR 0019).
//                      Web: in-memory only. Mobile: expo-secure-store.
//
// Cross-slot leak invariant: a credential written under one kind must NEVER come back from get()
// under a different kind. Enforced at the type layer (typed get<K>) and at runtime (slot tag
// assertion in implementations).
//
// localStorage / sessionStorage / AsyncStorage are forbidden in token paths — see ESLint guard.

export interface HaAccessCredential {
  readonly kind: 'ha-access';
  readonly token: string;
  /** ms since epoch when the access token expires. */
  readonly expiresAt: number;
}

export interface HaRefreshCredential {
  readonly kind: 'ha-refresh';
  readonly token: string;
}

export interface CloudSessionCredential {
  readonly kind: 'cloud-session';
  readonly token: string;
  /** ms since epoch when the session JWT expires. */
  readonly expiresAt: number;
}

export type StoredCredential = HaAccessCredential | HaRefreshCredential | CloudSessionCredential;

export type CredentialKind = StoredCredential['kind'];

export type CredentialOf<K extends CredentialKind> = Extract<StoredCredential, { kind: K }>;

export interface TokenStore {
  /**
   * Fetch the credential currently held in the given slot.
   *
   * Returns null when the slot is empty, or when the platform implementation cannot read this
   * slot (e.g. ha-refresh on web — the httpOnly cookie is server-side only).
   *
   * Implementations MUST verify the stored credential's `kind` matches the requested slot before
   * returning it (cross-slot leak guard); on mismatch they throw.
   */
  get<K extends CredentialKind>(kind: K): Promise<CredentialOf<K> | null>;

  /**
   * Persist the credential into the slot identified by `credential.kind`.
   *
   * On platforms where a slot is not directly writable from JS (e.g. ha-refresh on web — the
   * cookie is set by the nginx proxy via Set-Cookie on /auth/token), this method is a no-op.
   * The caller is expected to perform a network round-trip that produces the side effect.
   */
  set(credential: StoredCredential): Promise<void>;

  /**
   * Clear the given slot, or all slots when `kind` is omitted.
   *
   * On web, clearing `ha-refresh` MUST trigger a server-side action (e.g. POST /auth/logout) so
   * the httpOnly cookie is unset; the in-process call alone cannot drop a cookie the browser
   * stores under the server's authority.
   */
  clear(kind?: CredentialKind): Promise<void>;
}

/**
 * Reference implementation that holds every slot in a Map. Used as a test fixture in
 * @glaon/core and as the in-memory base for the web `ha-access` + `cloud-session` slots.
 *
 * MUST NOT be used as the storage for `ha-refresh` on web (refresh tokens require an httpOnly
 * cookie boundary; in-memory exposes them to XSS by definition).
 */
// All methods are `async` (despite some bodies being synchronous) so that an `assertSlotTag`
// throw surfaces as a Promise rejection rather than a synchronous exception. This keeps the
// TokenStore contract uniform — callers always `await store.get(...)` and `try/catch` once.
/* eslint-disable @typescript-eslint/require-await */
export class InMemoryTokenStore implements TokenStore {
  private readonly slots = new Map<CredentialKind, StoredCredential>();

  async get<K extends CredentialKind>(kind: K): Promise<CredentialOf<K> | null> {
    const stored = this.slots.get(kind);
    if (!stored) return null;
    assertSlotTag(stored, kind);
    return stored;
  }

  async set(credential: StoredCredential): Promise<void> {
    this.slots.set(credential.kind, credential);
  }

  async clear(kind?: CredentialKind): Promise<void> {
    if (kind === undefined) {
      this.slots.clear();
    } else {
      this.slots.delete(kind);
    }
  }
}
/* eslint-enable @typescript-eslint/require-await */

/**
 * Throws if the stored credential's tag does not match the requested slot.
 * Cross-slot leak guard — typed get<K> already prevents the call shape, this catches storage
 * corruption (e.g. a malicious tampered SecureStore entry).
 */
export function assertSlotTag<K extends CredentialKind>(
  credential: StoredCredential,
  expected: K,
): asserts credential is CredentialOf<K> {
  if (credential.kind !== expected) {
    throw new Error(
      `TokenStore cross-slot leak: requested ${expected} but stored credential has kind ${credential.kind}`,
    );
  }
}

/**
 * Persistence boundary for `KeyValueTokenStore`. Implementations live in `apps/*` and bind
 * to the platform's secure key-value primitive (e.g. expo-secure-store on mobile).
 */
export interface KeyValueBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const SLOT_KEYS: Record<CredentialKind, string> = {
  'ha-access': 'glaon.token.ha-access',
  'ha-refresh': 'glaon.token.ha-refresh',
  'cloud-session': 'glaon.token.cloud-session',
};

/**
 * TokenStore backed by a key-value store that serializes credentials as JSON.
 *
 * Designed for platforms where every slot has the same backing primitive — primarily
 * `apps/mobile` paired with `expo-secure-store`. Web does NOT use this directly because
 * `ha-refresh` requires a different boundary (httpOnly cookie); `WebTokenStore` composes
 * around an in-memory map and a server-side endpoint instead.
 */
export class KeyValueTokenStore implements TokenStore {
  constructor(private readonly backend: KeyValueBackend) {}

  async get<K extends CredentialKind>(kind: K): Promise<CredentialOf<K> | null> {
    const raw = await this.backend.get(SLOT_KEYS[kind]);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as StoredCredential;
    assertSlotTag(parsed, kind);
    return parsed;
  }

  async set(credential: StoredCredential): Promise<void> {
    await this.backend.set(SLOT_KEYS[credential.kind], JSON.stringify(credential));
  }

  async clear(kind?: CredentialKind): Promise<void> {
    if (kind !== undefined) {
      await this.backend.delete(SLOT_KEYS[kind]);
      return;
    }
    await Promise.all(
      (Object.values(SLOT_KEYS) as readonly string[]).map((key) => this.backend.delete(key)),
    );
  }
}
