# matty-stack

Boilerplate monorepo with a Bun + Hono server, Better Auth (Drizzle adapter), and a simple React web app.

## What's Included

- **Server**: Bun + Hono API with Better Auth and Drizzle ORM (Postgres)
- **Web**: React + TanStack Router + Tailwind
- **Local infra**: one Postgres container via Docker Compose

## Structure

```
packages/
  server/        # Hono API + Better Auth + Drizzle
  web/           # React client
```

## Quick Start

1. Copy envs:

```bash
cp .env.example .env
```

2. Start Postgres:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
bun install
```

4. Run Drizzle migrations:

```bash
bun run db:migrate
```

5. Start dev servers:

```bash
bun run dev
```

The server runs on `http://localhost:3000` and the web app on `http://localhost:5173`.

`bun run dev` reads the shared root [`.env`](/Users/matthewboughton/Desktop/matty-stack/.env), and Vite is configured to load the same file for the web app.

## Auth Routes

Better Auth is mounted at `/api/auth` and supports:

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`

## Example API (Projects)

Authenticated routes (require session cookie):

- `GET /api/projects` - list projects
- `POST /api/projects` - create project `{ "name": "My Project" }`

## Scripts

- `bun run dev` - run all dev servers
- `bun run dev:server` - server only
- `bun run dev:web` - web only
- `bun run infra:up` - start local Postgres
- `bun run infra:down` - stop local Postgres
- `bun run db:generate` - Drizzle generate
- `bun run db:migrate` - Drizzle migrate
- `bun run db:studio` - Drizzle studio
