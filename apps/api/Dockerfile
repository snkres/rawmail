FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @rawmail/config build
RUN pnpm --filter @rawmail/db build
RUN pnpm --filter @rawmail/shared build
RUN pnpm --filter @rawmail/auth build
RUN pnpm --filter @rawmail/api build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
