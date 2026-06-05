import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

/**
 * Supabase Postgres via postgres-js.
 *   - DATABASE_URL = the Supabase connection string (pooler in prod/serverless,
 *     direct for migrations). SSL is required by Supabase.
 *   - `prepare: false` keeps us compatible with the transaction-mode pooler
 *     (PgBouncer), which doesn't support prepared statements.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Fail LOUD with a clear message rather than connecting to a broken default.
  throw new Error(
    "Missing required environment variable DATABASE_URL (the Supabase connection " +
      "string). Set it in .env.local for local dev, or in your host's env for prod.",
  );
}

const client = postgres(connectionString, {
  ssl: "require",
  prepare: false,
  max: 5,
});

export const db = drizzle(client, { schema });
