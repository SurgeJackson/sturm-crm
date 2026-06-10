# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV DATABASE_URL=postgresql://sturm:sturm_password@localhost:5432/sturm_crm?schema=public
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV APP_URL=http://localhost:3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/generated ./generated
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p public/uploads/proposals \
  && chown -R nextjs:nodejs /app \
  && chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
