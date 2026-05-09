// Mongo repository for the `layouts` collection (#420).
//
// Document shape:
//   {
//     _id: string (uuid),       — id surfaced to clients
//     userId: string,           — owner; authorization key
//     homeId: string,           — multi-home scoping
//     name: string,             — user-visible name
//     payload: Record<string,unknown>,
//     createdAt: Date,
//     updatedAt: Date,
//     deletedAt: Date | null,   — soft-delete marker
//   }
//
// Indexes:
//   { userId: 1, deletedAt: 1 } — primary list query.
//   { userId: 1, homeId: 1, deletedAt: 1 } — homeId-filtered list.

import type { Collection, Db } from 'mongodb';

interface LayoutDoc {
  _id: string;
  userId: string;
  homeId: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateLayoutInput {
  readonly id: string;
  readonly userId: string;
  readonly homeId: string;
  readonly name: string;
  readonly payload: Record<string, unknown>;
  readonly now: Date;
}

export interface UpdateLayoutInput {
  readonly name?: string;
  readonly payload?: Record<string, unknown>;
  readonly now: Date;
}

export interface ListLayoutOptions {
  readonly homeId?: string;
}

export interface PublicLayout {
  readonly id: string;
  readonly userId: string;
  readonly homeId: string;
  readonly name: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class LayoutsRepo {
  private readonly collection: Collection<LayoutDoc>;
  private indexEnsured = false;

  constructor(db: Db) {
    this.collection = db.collection<LayoutDoc>('layouts');
  }

  async ensureIndex(): Promise<void> {
    if (this.indexEnsured) return;
    await this.collection.createIndex({ userId: 1, deletedAt: 1 });
    await this.collection.createIndex({ userId: 1, homeId: 1, deletedAt: 1 });
    this.indexEnsured = true;
  }

  async create(input: CreateLayoutInput): Promise<PublicLayout> {
    await this.ensureIndex();
    const doc: LayoutDoc = {
      _id: input.id,
      userId: input.userId,
      homeId: input.homeId,
      name: input.name,
      payload: input.payload,
      createdAt: input.now,
      updatedAt: input.now,
      deletedAt: null,
    };
    await this.collection.insertOne(doc);
    return toPublic(doc);
  }

  async list(userId: string, options: ListLayoutOptions = {}): Promise<PublicLayout[]> {
    await this.ensureIndex();
    const filter: Partial<LayoutDoc> & { deletedAt: null } = {
      userId,
      deletedAt: null,
    };
    if (options.homeId !== undefined) filter.homeId = options.homeId;
    const docs = await this.collection.find(filter).sort({ updatedAt: -1 }).toArray();
    return docs.map(toPublic);
  }

  async getById(id: string, userId: string): Promise<PublicLayout | null> {
    await this.ensureIndex();
    const doc = await this.collection.findOne({ _id: id, userId, deletedAt: null });
    return doc === null ? null : toPublic(doc);
  }

  async update(id: string, userId: string, input: UpdateLayoutInput): Promise<PublicLayout | null> {
    await this.ensureIndex();
    const set: Partial<LayoutDoc> = { updatedAt: input.now };
    if (input.name !== undefined) set.name = input.name;
    if (input.payload !== undefined) set.payload = input.payload;
    const result = await this.collection.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { $set: set },
      { returnDocument: 'after' },
    );
    return result === null ? null : toPublic(result);
  }

  async softDelete(id: string, userId: string, now: Date): Promise<boolean> {
    await this.ensureIndex();
    const result = await this.collection.updateOne(
      { _id: id, userId, deletedAt: null },
      { $set: { deletedAt: now, updatedAt: now } },
    );
    return result.modifiedCount === 1;
  }
}

function toPublic(doc: LayoutDoc): PublicLayout {
  return {
    id: doc._id,
    userId: doc.userId,
    homeId: doc.homeId,
    name: doc.name,
    payload: doc.payload,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
