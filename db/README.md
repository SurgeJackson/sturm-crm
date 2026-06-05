# STURM CRM DB

PostgreSQL используется через Prisma. Локально поднимается официальный образ `postgres:latest`; на момент проверки это PostgreSQL 18.4.

- Docker: `docker-compose.yml`
- Схема: `prisma/schema.prisma`
- Seed: `prisma/seed.ts`
- Подключение: `DATABASE_URL` в `.env`

Для локального запуска:

```bash
docker compose up -d postgres
npm run prisma:migrate
npm run seed
```

Локальный порт: `55432`.
