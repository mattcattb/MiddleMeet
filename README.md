# Middle-Where?

Middle-Where? helps a group compare meeting locations by travel time instead of raw distance. The app takes participant locations, estimates routes through a Go API, and renders candidate destinations and route context in a React map interface.

This repository is intentionally small, but it is structured like a real full-stack app: a typed frontend client, a standalone backend, external map provider boundaries, local development scripts, and CI checks for backend tests.

## Stack

- **Backend**: Go, standard library `net/http`, package-level domain logic, OpenRouteService client integration, Redis-backed map response caching.
- **Frontend**: React, TypeScript, Vite, TanStack Router, TanStack Query, Leaflet, Tailwind CSS.
- **API contract**: `openapi.yaml` generates TypeScript API types used by the web client through `openapi-fetch`.
- **Tooling**: Bun scripts for local development, Make targets for the Go server, Docker Compose for local infrastructure.
- **CI**: GitHub Actions runs Go tests, `go vet`, and a backend build on pull requests that touch server code.

## Repository Layout

```txt
server/                     Go API, meeting logic, map provider clients
server/internal/httpapi/     HTTP handlers and request/response boundary
server/internal/meeting/     Core travel-time and midpoint planning logic
server/internal/maps/        Cached map-provider adapters
web/                        React client and generated OpenAPI types
openapi.yaml                Shared API contract for the frontend client
.github/workflows/          Pull request CI
```

## Backend Testing

The backend tests focus on stable behavior instead of testing every implementation detail:

- HTTP handler tests use `httptest` against the real router with fake map dependencies.
- Meeting logic tests cover route-matrix aggregation and midpoint behavior.
- OpenRoute helper tests cover provider response parsing utilities.

Run the same backend checks used by CI:

```bash
cd server
go test ./...
go vet ./...
go build ./...
```

## Local Setup

Copy environment variables:

```bash
cp .env.example .env
```

Install frontend dependencies:

```bash
cd web
bun install
cd ..
```

Start the Go API:

```bash
bun run dev:server
```

Start the web app:

```bash
bun run dev:web
```

The API runs on `http://localhost:3000` and the web app runs on `http://localhost:5173`.

## Useful Commands

```bash
bun run dev:server     # start the Go API
bun run dev:web        # start the Vite frontend
bun run build          # build and type-check the frontend
bun run openapi:gen    # regenerate web/src/gen/openapi.ts
bun run infra:up       # start local infrastructure
bun run infra:down     # stop local infrastructure
```

Server-specific commands are also available from `server/Makefile`:

```bash
cd server
make test
make vet
make build
```

## API Surface

- `GET /health` checks that the API is running.
- `POST /api/meeting/estimate` returns travel-time estimates from participants to a destination.
- `POST /api/meeting/routes` returns route geometry for drawing map lines.
- `POST /api/meeting/area` builds participant travel areas for a duration constraint.
- `POST /api/meeting/midpoint` finds a fair midpoint candidate.
- `POST /api/meeting/destinations/search` searches destination candidates and ranks them by travel estimate.
- `GET /api/locations/search` searches locations near a coordinate.
- `GET /api/locations/autocomplete` returns location autocomplete suggestions.
- `GET /api/locations/reverse` reverse-geocodes a map coordinate.
