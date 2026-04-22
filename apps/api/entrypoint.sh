#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node /app/apps/api/dist/migrate.js

echo "[entrypoint] Starting API server..."
exec node /app/apps/api/dist/index.js
