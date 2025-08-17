## Getting Started

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
