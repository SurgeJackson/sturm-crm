# STURM CRM

Stage 1: базовый каркас CRM для STURM.

## Стек

- Next.js 16 + App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui style components
- NextAuth credentials auth
- MongoDB
- Prisma 6.19.3 для MongoDB schema/client
- Native MongoDB driver для write-операций на standalone MongoDB

Prisma 7 сейчас является latest, но официальная поддержка MongoDB в Prisma ограничена v6. Поэтому проект использует последнюю совместимую Prisma 6.x.

## Запуск

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Приложение откроется на `http://localhost:3000`.

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
npm run build
```
