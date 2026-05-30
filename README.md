# Grid.

The platform for creatives — projects, contracts, jobs, academy, shop, and more.

Built with **Next.js 16 (App Router)**, **Better Auth**, and **SQLite via Drizzle ORM + libSQL**.

## Stack

| Layer    | Choice                                              |
| -------- | --------------------------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS v4               |
| Auth     | Better Auth (email + password; social-ready)        |
| ORM      | Drizzle ORM                                         |
| Database | libSQL — local SQLite file in dev, Turso in prod    |

## Getting started

```bash
npm install
cp .env.example .env   # a dev .env is already generated for you
npm run db:push        # create tables in ./local.db
npm run dev
```

Open http://localhost:3000 → **Get started** to create an account, then land on `/dashboard`.

## Project layout

```
src/
  app/
    (auth)/login        Sign-in page
    (auth)/signup       Sign-up page
    api/auth/[...all]   Better Auth request handler
    dashboard/          Server-protected page (reads session server-side)
    page.tsx            Landing
  lib/
    auth.ts             Better Auth server instance (Drizzle adapter)
    auth-client.ts      Client hooks: signIn / signUp / signOut / useSession
    db/
      index.ts          Drizzle + libSQL client
      schema.ts         Auth tables + GRID app tables
drizzle.config.ts       Drizzle Kit config
reference/
  grid-prototype.html   Original mobile UI prototype (design source of truth)
```

## Scripts

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Dev server                                        |
| `npm run build`         | Production build                                  |
| `npm run db:push`       | Push schema to the database (no migration files)  |
| `npm run db:generate`   | Generate SQL migration files                      |
| `npm run db:migrate`    | Apply migrations                                  |
| `npm run db:studio`     | Drizzle Studio (browse data)                      |
| `npm run auth:generate` | Regenerate Better Auth tables in schema           |

## Database hosting

The app talks to libSQL, so the **same code** runs against three targets:

- **Dev** — `DATABASE_URL=file:./local.db` (on-disk SQLite).
- **Prod (recommended) — Turso.** Managed libSQL/SQLite. Set:
  ```
  DATABASE_URL=libsql://<your-db>.turso.io
  DATABASE_AUTH_TOKEN=<token>
  ```
- **Cloudflare D1** — also SQLite; requires deploying on Cloudflare Workers/Pages
  and swapping the client to `drizzle-orm/d1` with a D1 binding.

> **Note:** Cloudflare **R2** is object storage, not a query-able database — it
> can't host a live SQLite DB. Use **Turso** (works on any host) or **D1**
> (Cloudflare-native) instead.
