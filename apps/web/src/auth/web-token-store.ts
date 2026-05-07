// Web TokenStore implementation — see ADR 0006 (Phase 2 revision via ADR 0017) and issue #9.
//
// Slot semantics on web:
//   - ha-access      : in-memory only. Lives for the current page lifetime; on hard reload the
//                      OAuth refresh flow re-mints it.
//   - ha-refresh     : httpOnly + SameSite=Strict + Secure cookie set by the addon nginx proxy
//                      on /auth/token. JS can never read this cookie. Therefore:
//                        - get('ha-refresh')   → null  (the cookie exists but is invisible)
//                        - set('ha-refresh')   → no-op (the proxy already set Set-Cookie)
//                        - clear('ha-refresh') → POST  to the configured logout endpoint so the
//                                                server clears the cookie via Set-Cookie.
//   - cloud-session  : in-memory only.
//
// localStorage / sessionStorage are forbidden in this file (and across `apps/web/src/auth/**`).
// An ESLint guard blocks them; CI greps for the names as a belt-and-braces check.

import {
  InMemoryTokenStore,
  type CredentialKind,
  type CredentialOf,
  type StoredCredential,
  type TokenStore,
} from '@glaon/core/auth';

interface WebTokenStoreOptions {
  /**
   * URL that, when POSTed to with `credentials: 'include'`, instructs the server to clear the
   * ha-refresh httpOnly cookie. Typically `/auth/logout` proxied by the addon nginx config.
   *
   * If omitted, `clear('ha-refresh')` becomes a documented no-op — useful for tests, never for
   * production.
   */
  readonly logoutEndpoint?: string;

  /**
   * Optional fetch implementation injection point. Tests use this to assert behavior without
   * touching the global; production code passes `globalThis.fetch`.
   */
  readonly fetchImpl?: typeof fetch;
}

export class WebTokenStore implements TokenStore {
  private readonly memory = new InMemoryTokenStore();

  constructor(private readonly options: WebTokenStoreOptions = {}) {}

  async get<K extends CredentialKind>(kind: K): Promise<CredentialOf<K> | null> {
    if (kind === 'ha-refresh') {
      // The refresh token lives in an httpOnly cookie; JS cannot read it. By design.
      return null;
    }
    return this.memory.get(kind);
  }

  async set(credential: StoredCredential): Promise<void> {
    if (credential.kind === 'ha-refresh') {
      // No-op: the addon nginx proxy sets the httpOnly cookie on /auth/token's Set-Cookie
      // response. Calling set('ha-refresh', ...) from OAuth handler code is allowed (and
      // silently ignored) so that the same exchange flow works for both web and mobile.
      return;
    }
    await this.memory.set(credential);
  }

  async clear(kind?: CredentialKind): Promise<void> {
    if (kind === undefined) {
      await this.memory.clear();
      await this.requestServerCookieClear();
      return;
    }
    if (kind === 'ha-refresh') {
      await this.requestServerCookieClear();
      return;
    }
    await this.memory.clear(kind);
  }

  private async requestServerCookieClear(): Promise<void> {
    const endpoint = this.options.logoutEndpoint;
    if (endpoint === undefined) return;
    const fetchImpl = this.options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    await fetchImpl(endpoint, {
      method: 'POST',
      credentials: 'include',
    });
  }
}
