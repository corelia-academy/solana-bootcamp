import { createPool } from "../src/db.ts";
import { migrate } from "../src/migrate.ts";

const pool = createPool();
await migrate(pool);
await pool.end();
console.log("Migration xong");
