# AgendaPro — Agent Instructions

SaaS appointment scheduling system for service professionals (barbers, dentists, personal trainers, etc.).

## Architecture

Three separate apps in one repo — not a monorepo (no workspace manager, no shared build):

| App | Tech | Port | Dev command |
|-----|------|------|-------------|
| `backend/` | Node.js + Express (ESM) | 3000 | `cd backend && npm run dev` |
| `frontend/` | React 19 + Vite + TS + Tailwind 4 | 5173 | `cd frontend && npm run dev` |
| `app/` | Static HTML admin panel (legacy) | — | open `index.html` |
| `landing/` | Static HTML sales page | — | open `index.html` |

Frontend dev server proxies `/api` to `localhost:3000` automatically (`frontend/vite.config.js`).

## Backend

- **Entry**: `backend/src/server.js` (imports app from `src/app.js`)
- **ORM**: Supabase client (`@supabase/supabase-js`), not a traditional ORM
- **DB schema**: `backend/src/database/schema.sql` — paste into Supabase SQL Editor
- **Mock mode**: When `SUPABASE_URL` is unset or contains the placeholder `seu-projeto`, the server starts with an in-memory mock database. Mock data is seeded automatically (login: `ze@barbearia.com` / `123456`). Data does not persist across restarts.
- **Auth**: JWT via `middleware/auth.js`. Protected routes call `router.use(authenticate)` at the top. Token payload: `{ userId, businessId }`.
- **Validation**: Zod schemas in route files (e.g. `routes/appointments.js:12`)
- **Dev runner**: `node --watch` (not nodemon), despite nodemon being in devDependencies
- **ESM required**: All backend files use `import/export`. Do not use `require()`.
- **Routes**: auth, business, services, professionals, appointments, clients, public (no auth), webhooks, payments, recurring, reports, subscriptions, pix, admin

## Frontend

- **Entry**: `frontend/src/main.tsx`
- **API client**: `frontend/src/lib/api.ts` — hardcoded `API_BASE` pointing to Vercel. For local development, change this to `http://localhost:3000/api` or rely on the Vite proxy (update `API_BASE` to `/api`).
- **Tailwind 4**: Uses `@tailwindcss/vite` plugin. No `tailwind.config.js` — config is done via CSS `@theme` directives in source files.
- **Auth context**: `frontend/src/contexts/AuthContext.tsx`
- **Routing**: `react-router-dom` with nested routes under a `Layout` wrapper, ErrorBoundary at root, admin route protected by role check

## Commands

```bash
# Backend
cd backend && npm install
cp .env.example .env          # then fill in Supabase credentials
npm run db:setup              # or paste schema.sql into Supabase SQL Editor manually
npm run db:seed               # populate test data
npm run dev                   # starts on :3000
npm run test                  # run all backend tests (45 tests)
npm run test:watch            # run tests in watch mode

# Frontend
cd frontend && npm install
npm run dev                   # starts on :5173, proxies /api to :3000
npm run build                 # production build to dist/
npm run test                  # run all frontend tests (8 tests)
npm run test:watch            # run tests in watch mode
```

## Testing

Both backend and frontend use **Vitest**. Tests run against the in-memory mock database (no real Supabase needed).

- **Backend tests** (`backend/src/__tests__/`): auth routes, services CRUD, appointments CRUD, public routes, mock database query builder (45 tests)
- **Frontend tests** (`frontend/src/__tests__/`): API client token management, App routing/404/ErrorBoundary, SubscriptionContext (8 tests)

## Environment

- `backend/.env.example` lists all required vars. Key ones: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`
- `docker-compose.yml` is for Evolution API (WhatsApp) only — not needed for core app development
- `FRONTEND_URL` in backend `.env` controls CORS origin (default `http://localhost:5173`)

## Gotchas

1. **`app/` is legacy.** The React frontend (`frontend/`) is the active admin panel. `app/index.html` is an older static version.
2. **Mock database is silent.** The server logs "Modo Mock" once at startup but otherwise behaves identically. If you see unexpected missing data, check whether `.env` is configured.
3. **WhatsApp integration** uses Evolution API (self-hosted via docker-compose) or Z-API. The WhatsApp config in `backend/src/config/whatsapp.js` is separate from the main app database.
4. **Backend port** defaults to 3000, configurable via `PORT` env var.
