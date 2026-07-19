# SRS Godown ERP — Phase 1 (Foundation)

A modern, fast and beginner-friendly ERP foundation for a **bike spare parts warehouse**.
This is **Phase 1**: the complete project shell — authentication, layout, theming, dashboard UI,
settings, routing and a production-ready API foundation. **No business modules** (products, stock,
purchases, sales, dealers, vendors, ledgers, reports) are implemented yet — those pages are
intentional placeholders.

The goal: something a warehouse worker with no computer experience can understand in five minutes.

---

## ✨ What's included

- **Authentication** — JWT login, protected routes, session restore, logout.
- **App shell** — sticky header, collapsible sidebar (with mobile drawer), breadcrumbs, animated page transitions.
- **Dashboard UI** — stat cards, placeholder charts (Recharts), quick actions, recent activity.
- **Settings page** — company profile + preferences, wired to the backend and saved to PostgreSQL.
- **Theme system** — Light / Dark / System, saved to `localStorage`, no flash on load.
- **Reusable components** — button, input, card, badge, dialog, table, pagination, skeleton, empty state, toast, status badge, stat card and more.
- **Error pages** — 404, 500, No Internet, Unauthorized.
- **Backend foundation** — Express + TypeScript, Prisma, Zod validation, error/auth middleware, logger, rate limiting, Helmet, CORS, health check.
- **Fully responsive** — desktop, laptop, tablet, mobile.

---

## 🧰 Tech stack

**Frontend:** React 19 · TypeScript · Vite · Tailwind CSS · shadcn-style UI · React Router · TanStack Query · React Hook Form · Zod · Axios · Lucide · Framer Motion · Recharts

**Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL · JWT · bcrypt · Zod · Helmet

---

## ✅ Requirements

- **Node.js 18+** (Node 20 LTS recommended)
- **npm 9+**
- **PostgreSQL 14+** running locally (or a connection string to a hosted instance)

---

## 📁 Project structure

```
srs-godown-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # users + settings models only
│   │   └── seed.ts              # seeds admin user + default settings
│   └── src/
│       ├── config/              # env + prisma client
│       ├── controllers/         # health, auth, settings
│       ├── middlewares/         # error, auth, validate, rate limit, notFound
│       ├── repositories/        # data-access layer
│       ├── routes/              # /health, /auth, /settings
│       ├── services/            # business logic
│       ├── utils/               # logger, jwt, password, apiError, apiResponse
│       ├── validators/          # zod schemas
│       ├── app.ts               # express app wiring
│       └── index.ts             # bootstrap + graceful shutdown
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/              # shadcn-style primitives
        │   └── common/          # StatCard, PageHeader, EmptyState, …
        ├── contexts/            # Theme + Auth
        ├── hooks/               # useMediaQuery
        ├── layouts/             # Sidebar, Header, AppLayout, Breadcrumb, menus
        ├── lib/                 # navigation, cn()
        ├── pages/               # Dashboard, Settings, Login, module placeholders, errors
        ├── routes/              # AppRoutes + ProtectedRoute
        ├── services/            # axios instance + api services
        ├── styles/              # global CSS + design tokens
        ├── types/               # shared TS types
        └── utils/               # formatters, validation, toast
```

---

## 🚀 Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL + JWT_SECRET
npm install
npm run prisma:generate       # generate the Prisma client
npm run prisma:migrate        # create the initial migration (users + settings)
npm run db:seed               # create the admin user + default settings
npm run dev                   # starts http://localhost:5000
```

Health check: **GET** `http://localhost:5000/api/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev                   # starts http://localhost:5173
```

Open **http://localhost:5173** and sign in.

### 🔑 Demo credentials

```
Email:    admin@srsgodown.com
Password: Admin@123
```

(These come from the backend `.env` — change `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding to use your own.)

---

## 🔐 Environment variables

### Backend (`backend/.env`)

| Variable              | Description                          | Example                                             |
| --------------------- | ------------------------------------ | --------------------------------------------------- |
| `PORT`                | API port                             | `5000`                                              |
| `NODE_ENV`            | Environment                          | `development`                                        |
| `CORS_ORIGIN`         | Allowed frontend origin              | `http://localhost:5173`                             |
| `DATABASE_URL`        | PostgreSQL connection string         | `postgresql://user:pass@localhost:5432/srs_godown`  |
| `JWT_SECRET`          | Secret used to sign tokens           | `change-me-to-a-long-random-string`                 |
| `JWT_EXPIRES_IN`      | Token lifetime                       | `7d`                                                |
| `SEED_ADMIN_EMAIL`    | Admin email created by the seed      | `admin@srsgodown.com`                               |
| `SEED_ADMIN_PASSWORD` | Admin password created by the seed   | `Admin@123`                                         |

### Frontend (`frontend/.env`)

| Variable       | Description        | Example                     |
| -------------- | ------------------ | --------------------------- |
| `VITE_API_URL` | Base URL of the API | `http://localhost:5000/api` |

---

## 🗄️ Database

Phase 1 defines **only two tables**:

- **`users`** — id, name, email, password (bcrypt), role, isActive, lastLogin, timestamps
- **`settings`** — company name, logo, phone, address, currency, language, theme, timestamps

No inventory/business tables exist yet — that's by design for this phase.

Useful commands (run inside `backend/`):

```bash
npm run prisma:generate   # regenerate client after schema changes
npm run prisma:migrate    # create/apply migrations
npm run prisma:studio     # open Prisma Studio to browse data
npm run db:seed           # (re)seed admin + settings
```

---

## 📡 API endpoints (Phase 1)

| Method | Endpoint             | Auth | Description                     |
| ------ | -------------------- | ---- | ------------------------------- |
| GET    | `/api/health`        | –    | Service + database health check |
| POST   | `/api/auth/login`    | –    | Sign in, returns JWT + user     |
| GET    | `/api/auth/me`       | ✅   | Current authenticated user      |
| GET    | `/api/settings`      | ✅   | Fetch workspace settings        |
| PUT    | `/api/settings`      | ✅   | Update workspace settings       |

All responses use a consistent envelope: `{ success, message, data }`.

---

## 🧱 Scripts reference

**Backend**

| Script                    | Does                                    |
| ------------------------- | --------------------------------------- |
| `npm run dev`             | Start API with hot reload               |
| `npm run build`           | Compile TypeScript to `dist/`           |
| `npm start`               | Run the compiled server                 |
| `npm run prisma:migrate`  | Create/apply a migration                |
| `npm run db:seed`         | Seed admin user + settings              |
| `npm run lint`            | Lint the backend                        |

**Frontend**

| Script            | Does                          |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start Vite dev server         |
| `npm run build`   | Type-check + production build |
| `npm run preview` | Preview the production build  |
| `npm run lint`    | Lint the frontend             |

---

## 🛣️ Roadmap (later phases)

Products · Stock · Purchases · Sales · Dealers · Vendors · Ledgers · Reports (Excel/PDF export).
The sidebar already lists these with a **"Soon"** badge, and each opens a placeholder screen — so
adding them later slots straight into the existing foundation.

---

_Phase 1 delivered: complete frontend, backend foundation, database connected, theme system, responsive
layout, sidebar, header, dashboard UI, routing, settings page, reusable components, API foundation,
Prisma setup, and this README._
