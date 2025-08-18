## Quick start

1. Environment variables create a .env file at the project root:

```bash
    cp .env.example .env
```

2. Run Postgres and Redis

```bash
    docker compose up -d
```

3. Install dependecies

```bash
    yarn
```

4. Run migrations

```bash
    yarn migration:generate && yarm migration:run
```

5. Seed players

```bash
    yarn seed:players
```

6. Start the app (development)

```bash
    yarn start:dev
```

## API docs

If Swagger is enabled, the UI is typically available at:
- http://localhost:3000/docs

## Scripts (common)

- start:dev — run in watch mode (development)
- build — compile TypeScript
- test, test:watch, test:cov — run tests

## Troubleshooting

- Verify your .env matches the services you actually use.
- Ensure databases/Redis are running and reachable if those features are enabled.

## Project structure

- src/main.ts — app bootstrap (Nest factory, global setup)
- src/app.module.ts — root module wiring
- src/data-source.ts — TypeORM DataSource config (migrations use this)
- src/api/match — match endpoints, match and participant entities, submit DTOs
- src/api/player — player endpoints, player service/entity
- src/api/rating — leaderboard/rating endpoints, rating service/entity
- src/processors/rating — background processing for ratings (e.g., queues)
- src/common/services/cache — cache module (e.g., Redis-backed helpers)
- src/common/http/request-context.middleware.ts — request-scoped context utilities
- src/config — configuration and env validation
- src/seeds — seeds for databases, currently only for player
- src/tests — unit tests
