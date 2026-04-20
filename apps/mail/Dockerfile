FROM node:20-alpine
RUN corepack enable pnpm
WORKDIR /app
COPY apps/mail/package.json ./
COPY apps/mail/plugins/ ./plugins/
COPY apps/mail/config.yaml ./
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "start"]
