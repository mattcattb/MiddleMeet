# middle-meetup

Small learning app for comparing meet-in-the-middle destinations with a Go REST API and a React frontend.

## What's Included

- **Server**: Go standard library HTTP API
- **Web**: React + TanStack Router + TanStack Query + Tailwind
- **API client**: Small typed `openapi-fetch` client in `web/src/lib/openapi.ts`
- **Local infra**: Docker Compose placeholder for Postgres when persistence is added

## Structure

```txt
server/          # Go HTTP API, meeting logic, map provider clients
web/             # React client with its own Bun dependencies
```

## Quick Start

1. Copy envs:

```bash
cp .env.example .env
```

2. Install web dependencies:

```bash
cd web
bun install
cd ..
```

3. Start the Go API:

```bash
bun run dev:server
```

4. Start the web app:

```bash
bun run dev:web
```

The server runs on `http://localhost:3000` and the web app on `http://localhost:5173`.

## API

- `GET /health` - check that the Go API is running
- `POST /api/meeting/estimate` - matrix-based travel estimates for people to one destination
- `POST /api/meeting/routes` - detailed route geometry for drawing map lines
- `GET /api/locations/search` - location search
- `GET /api/locations/autocomplete` - location autocomplete
- `GET /api/locations/reverse` - reverse geocode a map coordinate

## Scripts

- `bun run dev` - start the web dev command
- `bun run dev:server` - server only
- `bun run dev:web` - web only
- `bun run build` - build the web app
- `bun run infra:up` - start local infrastructure
- `bun run infra:down` - stop local infrastructure
