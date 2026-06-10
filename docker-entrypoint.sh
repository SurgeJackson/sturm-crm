#!/bin/sh
set -eu

if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  ./node_modules/.bin/prisma migrate deploy
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  ./node_modules/.bin/tsx prisma/seed.ts
fi

exec "$@"
