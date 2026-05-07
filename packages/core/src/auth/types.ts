// Dual-mode auth contract — see docs/adr/0017-dual-mode-auth.md.
// IdP-agnostic at the type layer; the actual identity provider (currently Clerk)
// is locked separately in ADR 0019.

import type { HaAuthTokens } from '../types';

export interface CloudSession {
  readonly token: string;
  readonly expiresAt: number;
}

export type AuthMode =
  | { readonly kind: 'local'; readonly tokens: HaAuthTokens }
  | {
      readonly kind: 'cloud';
      readonly session: CloudSession;
      readonly homeId: string;
      readonly relayEndpoint: string;
    };
