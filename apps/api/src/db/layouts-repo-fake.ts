// In-memory LayoutsRepo for unit tests. Mirrors the public surface of
// the real `LayoutsRepo`. Avoids dragging mongodb-memory-server into
// the unit-test footprint; integration tests against a real Mongo land
// with the P2-H workflow (#422).

import type {
  CreateLayoutInput,
  ListLayoutOptions,
  PublicLayout,
  UpdateLayoutInput,
} from './layouts-repo';

interface InternalLayout extends PublicLayout {
  deletedAt: string | null;
}

export class InMemoryLayoutsRepo {
  private readonly store = new Map<string, InternalLayout>();

  async create(input: CreateLayoutInput): Promise<PublicLayout> {
    const layout: InternalLayout = {
      id: input.id,
      userId: input.userId,
      homeId: input.homeId,
      name: input.name,
      payload: input.payload,
      createdAt: input.now.toISOString(),
      updatedAt: input.now.toISOString(),
      deletedAt: null,
    };
    this.store.set(input.id, layout);
    await Promise.resolve();
    return strip(layout);
  }

  async list(userId: string, options: ListLayoutOptions = {}): Promise<PublicLayout[]> {
    await Promise.resolve();
    return Array.from(this.store.values())
      .filter(
        (layout) =>
          layout.userId === userId &&
          layout.deletedAt === null &&
          (options.homeId === undefined || layout.homeId === options.homeId),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(strip);
  }

  async getById(id: string, userId: string): Promise<PublicLayout | null> {
    await Promise.resolve();
    const layout = this.store.get(id);
    if (layout?.userId !== userId || layout.deletedAt !== null) {
      return null;
    }
    return strip(layout);
  }

  async update(id: string, userId: string, input: UpdateLayoutInput): Promise<PublicLayout | null> {
    await Promise.resolve();
    const existing = this.store.get(id);
    if (existing?.userId !== userId || existing.deletedAt !== null) {
      return null;
    }
    const next: InternalLayout = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.payload !== undefined ? { payload: input.payload } : {}),
      updatedAt: input.now.toISOString(),
    };
    this.store.set(id, next);
    return strip(next);
  }

  async softDelete(id: string, userId: string, now: Date): Promise<boolean> {
    await Promise.resolve();
    const existing = this.store.get(id);
    if (existing?.userId !== userId || existing.deletedAt !== null) {
      return false;
    }
    this.store.set(id, {
      ...existing,
      deletedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    return true;
  }
}

function strip(layout: InternalLayout): PublicLayout {
  return {
    id: layout.id,
    userId: layout.userId,
    homeId: layout.homeId,
    name: layout.name,
    payload: layout.payload,
    createdAt: layout.createdAt,
    updatedAt: layout.updatedAt,
  };
}
