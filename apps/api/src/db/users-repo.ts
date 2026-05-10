// Mongo repository for the `users` collection (#425).
//
// Today the users document only carries `preferences.locale`. We keep
// the document shape forward-extensible: every preference Glaon adds
// later (theme, density, default-home, etc.) lands as another field
// under `preferences`, and the partial-update endpoint stays compatible.
//
// Document shape:
//   {
//     _id: string,             — apps/api session `sub` (HA user id or
//                                hashed LLAT — see auth/ha-bridge.ts)
//     preferences: {
//       locale: 'en' | 'tr' | null,
//     },
//     createdAt: Date,
//     updatedAt: Date,
//   }
//
// Indexes: the `_id` is the lookup key for every operation; no extra
// indexes today.

import type { Collection, Db } from 'mongodb';

import type { UserPreferences, UserPreferencesUpdate } from '@glaon/core/api-client';

interface UserDoc {
  _id: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_PREFERENCES: UserPreferences = { locale: null };

export class UsersRepo {
  private readonly collection: Collection<UserDoc>;

  constructor(db: Db) {
    this.collection = db.collection<UserDoc>('users');
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const doc = await this.collection.findOne({ _id: userId });
    return doc === null
      ? { ...DEFAULT_PREFERENCES }
      : { ...DEFAULT_PREFERENCES, ...doc.preferences };
  }

  async updatePreferences(
    userId: string,
    patch: UserPreferencesUpdate,
    now: Date,
  ): Promise<UserPreferences> {
    const set: Record<string, unknown> = { updatedAt: now };
    for (const [key, value] of Object.entries(patch)) {
      set[`preferences.${key}`] = value;
    }
    await this.collection.updateOne(
      { _id: userId },
      {
        $set: set,
        $setOnInsert: { _id: userId, createdAt: now },
      },
      { upsert: true },
    );
    return this.getPreferences(userId);
  }
}
