import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { schema } from "./schema";

/**
 * libSQL works against three targets with identical code:
 *   - dev:  DATABASE_URL=file:./local.db
 *   - prod: DATABASE_URL=libsql://<db>.turso.io  (+ DATABASE_AUTH_TOKEN)
 *   - edge: a Cloudflare D1 binding (swap to drizzle-orm/d1 there)
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
