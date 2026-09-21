import pg from "pg";

// BIGINT (slot, giờ) trả về number thay vì string; an toàn vì nhỏ hơn 2^53.
pg.types.setTypeParser(20, Number);

export function createPool(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return new pg.Pool({ connectionString: url, max: 5 });
}

export async function withTransaction<T>(
  pool: pg.Pool,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
