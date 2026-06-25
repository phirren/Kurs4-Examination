import { Pool, PoolConfig } from "pg";

let pool: Pool | null = null;

export function getPool(
  config?: PoolConfig | string
): Pool {
  if (pool) return pool;

  const connectionString =
    typeof config === "string"
      ? config
      : config?.connectionString || process.env.DATABASE_URL;

  pool = new Pool(
    typeof config === "object" ? config : { connectionString }
  );

  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const p = getPool();
  return p.query(text, params);
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
