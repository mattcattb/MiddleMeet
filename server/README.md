# Go server

Small Go backend scaffold for learning maps, places, and travel-time APIs without reusing the old TypeScript server structure.

## Run

```bash
cd server
make dev
```

Optional environment:

```bash
PORT=3000
OPENROUTE_API_KEY=your-key
```

## Make Targets

- `make dev` - run the API with `../.env` and `.env` loaded
- `make run` - run the API without loading env files
- `make build` - build the API binary to `bin/api`
- `make start` - run the built binary
- `make test` - run Go tests
- `make fmt` - format Go code
- `make vet` - run `go vet`
- `make tidy` - tidy module dependencies

## Starting endpoint

- `GET /health` returns a basic JSON response.

Use this as the single HTTP example, then build the real endpoints yourself as you learn the APIs.

## Go clients worth knowing for this app

- Standard library `net/http`: best first choice while learning; this scaffold uses it directly.
- `github.com/googlemaps/google-maps-services-go`: Google Maps Web Services client for Geocoding, Places, Distance Matrix, Directions, and Roads APIs.
- Google Maps Platform APIs to learn: Geocoding API, Places API, Routes API, Distance Matrix API, Maps JavaScript API.
- `github.com/go-chi/chi/v5`: small router if the API grows beyond a few routes.
- `github.com/jackc/pgx/v5`: PostgreSQL driver when you add saved trips, users, or shared plans.
