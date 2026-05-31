import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Local dev uses a SQLite file; production uses Turso (libSQL) — set
// DATABASE_URL=libsql://<db>.turso.io and DATABASE_AUTH_TOKEN=<token>.
const url = process.env.DATABASE_URL ?? "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export default defineConfig({
  dialect: url.startsWith("libsql") || url.startsWith("https") ? "turso" : "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: authToken ? { url, authToken } : { url },
});
