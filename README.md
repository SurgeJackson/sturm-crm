# STURM CRM

CRM для STURM: авторизация, роли, dashboard, клиенты, дизайнеры и воронка дизайнеров.

## Стек

- Next.js 16 + App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui style components
- NextAuth credentials auth
- PostgreSQL 18 через `postgres:18-bookworm`
- Prisma ORM
- Docker Compose для локальной базы

## Запуск

```bash
npm install
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Приложение откроется на `http://localhost:3000`. PostgreSQL доступен на `localhost:55432`.

## Демо-доступ

Пароль для всех seed-пользователей: `Sturm12345`.

- `owner@sturm.local` — Руководитель
- `sales-lead@sturm.local` — Старший менеджер
- `store-manager@sturm.local` — Менеджер магазина
- `project-manager@sturm.local` — Проектный менеджер
- `administrator@sturm.local` — Администратор

## Проверки

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Docker Deploy

Production-сборка состоит из Next.js app container и PostgreSQL container.

```bash
cp .env.production.example .env.production
# Заполните POSTGRES_PASSWORD, NEXTAUTH_URL, APP_URL и NEXTAUTH_SECRET.
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Контейнер приложения при старте выполняет `prisma migrate deploy`. Для первичного demo/staging заполнения можно один раз поставить `RUN_SEED=true` в `.env.production`, запустить compose, затем вернуть `RUN_SEED=false`.

Постоянные данные:

- PostgreSQL: volume `sturm_postgres_data`
- Загруженные файлы: volume `sturm_uploads`
