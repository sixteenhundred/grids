import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Supabase Postgres. DATABASE_URL is the connection string (direct for
// migrations, pooler for the serverless app). SSL is required.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
