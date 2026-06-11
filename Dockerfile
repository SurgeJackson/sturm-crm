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
RUN mkdir -p public/uploads/proposals
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

COPY --chown=nextjs:nodejs --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=builder /app/tsconfig.json ./tsconfig.json
COPY --chown=nextjs:nodejs --from=builder /app/generated ./generated
COPY --chown=nextjs:nodejs --from=builder /app/lib/audit-log.ts ./lib/audit-log.ts
COPY --chown=nextjs:nodejs --from=builder /app/lib/prisma.ts ./lib/prisma.ts
COPY --chown=nextjs:nodejs --from=builder /app/modules/admin/permissions.ts ./modules/admin/permissions.ts
COPY --chown=nextjs:nodejs --from=builder /app/modules/crm/domain-constants.ts ./modules/crm/domain-constants.ts
COPY --chown=nextjs:nodejs --from=builder /app/modules/crm/form-utils.ts ./modules/crm/form-utils.ts
COPY --chown=nextjs:nodejs --from=builder /app/modules/crm-discipline ./modules/crm-discipline
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p public/uploads/proposals \
  && chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
