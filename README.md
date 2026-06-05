# STURM CRM

CRM для STURM: авторизация, роли, dashboard, клиенты, дизайнеры и воронка дизайнеров.

## Стек

- Next.js 16 + App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui style components
- NextAuth credentials auth
- PostgreSQL 18 через `postgres:latest`
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
