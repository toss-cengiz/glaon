// Lightweight D1 abstractions. Production binding is `c.env.DB: D1Database` from
// `@cloudflare/workers-types`; tests pass a fake matching the same surface.

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first(): Promise<unknown>;
  all(): Promise<{ results: unknown[] }>;
  run(): Promise<{ success: boolean; meta?: Record<string, unknown> }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(stmts: D1PreparedStatement[]): Promise<unknown[]>;
}
