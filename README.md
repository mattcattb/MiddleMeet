# matty-stack

Boilerplate monorepo with a Bun + Hono server, Better Auth (Drizzle adapter), and a simple React web app.

## What's Included

- **Server**: Bun + Hono API with Better Auth and Drizzle ORM (Postgres)
- **Web**: React + TanStack Router + Tailwind
- **Devcontainer**: Postgres by default, Redis optional

## Structure

```
packages/
  server/        # Hono API + Better Auth + Drizzle
  web/           # React client
```

## Quick Start

1. Copy envs:

```
cp .env.example .env
cp packages/server/.env.example packages/server/.env
```

2. Install dependencies:

```
bun install
```

3. Start dev servers:

```
bun run dev
```

The server runs on `http://localhost:3000` and the web app on `http://localhost:5173`.

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

## Devcontainer Notes

- Postgres runs on port `5432`.
- Redis is available via the optional compose profile:

```
COMPOSE_PROFILES=redis
```

## Scripts

- `bun run dev` - run all dev servers
- `bun run dev:server` - server only
- `bun run dev:web` - web only
- `bun run db:generate` - Drizzle generate
- `bun run db:migrate` - Drizzle migrate
- `bun run db:studio` - Drizzle studio
