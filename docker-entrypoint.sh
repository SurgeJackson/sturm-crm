#!/bin/sh
set -eu

if [ "${RESET_DATABASE:-false}" = "true" ]; then
  echo "RESET_DATABASE=true: resetting database and applying migrations. Existing data will be deleted."
  ./node_modules/.bin/prisma migrate reset --force
elif [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  ./node_modules/.bin/prisma migrate deploy
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  ./node_modules/.bin/tsx prisma/seed-production.ts
fi

exec "$@"
