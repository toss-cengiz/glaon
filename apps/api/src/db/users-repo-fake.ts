// In-memory UsersRepo for unit tests. Mirrors UsersRepo's public
// surface and applies the same partial-update semantics: a missing
// field leaves the existing value alone; `null` clears it.

import type { UserPreferences, UserPreferencesUpdate } from '@glaon/core/api-client';

const DEFAULT_PREFERENCES: UserPreferences = { locale: null };

interface UserRecord {
  preferences: UserPreferences;
}

export class InMemoryUsersRepo {
  private readonly store = new Map<string, UserRecord>();

  async getPreferences(userId: string): Promise<UserPreferences> {
    await Promise.resolve();
    const record = this.store.get(userId);
    return record === undefined ? { ...DEFAULT_PREFERENCES } : { ...record.preferences };
  }

  async updatePreferences(
    userId: string,
    patch: UserPreferencesUpdate,
    _now: Date,
  ): Promise<UserPreferences> {
    await Promise.resolve();
    const existing = this.store.get(userId)?.preferences ?? { ...DEFAULT_PREFERENCES };
    const next: UserPreferences = { ...existing };
    if (patch.locale !== undefined) next.locale = patch.locale;
    this.store.set(userId, { preferences: next });
    return { ...next };
  }
}
