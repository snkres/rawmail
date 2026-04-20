# rawmail

Rawmail is a disposable email platform with a monorepo architecture:

- Next.js web app for inbox UX
- Fastify API with inbox/message/SSE routes
- Haraka SMTP plugins for validation, sanitizing, and queueing
- Drizzle ORM schema package for PostgreSQL
- Shared Zod schemas package
- TypeScript SDK package

## Monorepo

This project uses pnpm workspaces and Turborepo.

### Workspace packages

- apps/api
- apps/mail
- apps/web
- packages/auth
- packages/db
- packages/shared
- packages/sdk

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Generate database migration:

```bash
cd packages/db
pnpm db:generate
```

4. Run API tests:

```bash
cd apps/api
pnpm test
```

5. Run mail tests:

```bash
cd apps/mail
pnpm test
```

6. Build web app:

```bash
cd apps/web
pnpm build
```

## Docker Compose

Base container setup is provided in docker-compose.yml together with:

- Caddy reverse proxy config in Caddyfile
- Dockerfiles for API, web, and mail services

Start infrastructure services first:

```bash
docker compose up -d postgres redis
```

Then bring up full stack:

```bash
docker compose up -d
```

## Implemented in this pass

- Phase 1 core scaffold and API service/routes/tests
- TTL cron wiring
- Haraka sanitize/validate/queue plugins with tests
- Phase 2 web landing and inbox view baseline
- Phase 3 auth/org scaffolding with org dashboard route
- Phase 4 category + custom domain route scaffolding and polling service
- Phase 5 billing route/service scaffolding and teams plan gate plugin
- OpenAPI docs endpoint wiring at /docs
- Phase 6 SDK package and smoke tests
- Deployment files (.env.example, Caddyfile, docker-compose, Dockerfiles)

## Current Validation Snapshot

- API tests: 28 passing
- Mail tests: passing
- API build: passing
- Web production build: passing
- SDK build/test: passing
