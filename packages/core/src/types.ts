// Platform-agnostic Home Assistant domain types.
// Keep this file free of DOM / React Native imports.

export interface HaEntityState {
  readonly entity_id: string;
  readonly state: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly last_changed: string;
  readonly last_updated: string;
}

export interface HaAuthTokens {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_in: number;
  readonly issued_at: number;
  readonly token_type: 'Bearer';
}

export interface HaConnectionConfig {
  readonly baseUrl: string;
  readonly clientId: string;
}
