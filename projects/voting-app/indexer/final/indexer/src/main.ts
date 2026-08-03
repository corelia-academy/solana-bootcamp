import { web3 } from "@anchor-lang/core";
import { createApi } from "./api.ts";
import { createPool } from "./db.ts";
import { backfill, subscribe } from "./ingest.ts";
import { migrate } from "./migrate.ts";

const pool = createPool();
await migrate(pool);
const connection = new web3.Connection(process.env.RPC_URL ?? "http://127.0.0.1:8899", "confirmed");

subscribe(connection, pool);
const port = Number(process.env.PORT ?? "3000");
createApi(pool).listen(port, () => console.log(`API: http://localhost:${port}`));

for (;;) {
  try {
    const inserted = await backfill(connection, pool);
    if (inserted > 0) console.log(`backfill +${inserted}`);
  } catch (error) {
    console.error("backfill lỗi, thử lại sau 10 giây", error);
  }
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}
