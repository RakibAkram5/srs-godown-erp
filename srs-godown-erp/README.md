# SRS Godown ERP — Phase 6 (Sales & Stock Outward)

A modern, fast and beginner-friendly ERP for a **bike spare parts warehouse**.

**Phase 2** adds a complete, production-ready **Authentication & User Management** system on top of
the Phase 1 foundation, without changing the existing structure, layout, theme or design.

**What's new in Phase 6 — Sales & Stock Outward**

- **Sales**: multi-product sale invoices with per-line discount, overall discount and **tax (percentage or fixed)**, auto sale number, **Draft** vs **Completed** status.
- **Walk-in customer**: optional customer name / phone recorded on each sale (full Dealer module comes later).
- **Automatic stock outward**: completing a sale reduces product stock and logs the movement. Sales are **blocked if stock is insufficient**.
- **Sale returns**: return items from a completed sale — stock comes back in automatically.
- **Print invoice, export PDF & Excel**, search / filter (status, date), sorting and pagination.
- Stock changes from sales appear in the **Stock History** tab (Purchases module) alongside purchases.

**What's new in Phase 5 — Purchase & Stock Inward**

- **Vendors**: full CRUD with phone / email / address, opening balance and auto-updated **outstanding balance** + purchase history.
- **Purchases**: multi-product purchase invoices with per-line discount, overall discount and **tax (percentage or fixed)**, auto purchase number, **Draft** vs **Completed** status.
- **Automatic stock inward**: completing a purchase increases product stock, updates warehouse / rack / shelf, and records the change.
- **Purchase returns**: return items from a completed purchase — stock decreases and vendor balance adjusts automatically.
- **Stock movement history**: every inward/outward change is logged with running balance.
- **Print invoice, export PDF & Excel**, search / filter (vendor, status, date), sorting and pagination.

**What's new in Phase 4 — Product Management**

- Full **product CRUD** with image, description, category / brand / unit, warehouse / rack / shelf, pricing and stock.
- **Auto-generated** product code, SKU and barcode; **barcode + QR code** shown on a printable label.
- **Bike compatibility** (Honda, Sohrab, MCR, Deluxe, Leader, Qingqi) as a multi-select.
- **Search, filters (category / brand / bike / status), sorting and pagination** (server-side).
- **Excel import & export** (with a downloadable template) and **print** for lists and labels.
- **Duplicate product**, **soft delete**, low-stock highlighting, active/inactive status.

**What's new in Phase 3 — Masters**

- **Categories, Brands and Units** management with full create / edit / delete.
- **Active / Inactive** status toggle on every record (disable without deleting).
- Search, status filter and pagination on each list.
- Clean tabbed UI under the **Masters** menu, built on the existing design system.

**What's new in Phase 2**

- Secure username + password **login** with a professional, responsive login page (logo, welcome message, remember me, show/hide password, forgot-password link).
- **JWT access + refresh tokens** — access tokens are short-lived and refreshed automatically in the background.
- **Remember me** — keeps you signed in across browser restarts (otherwise you're logged out when the browser closes).
- **Protected routes** + **auth middleware** — unauthenticated or disabled users are redirected to login.
- **Profile menu** with full details, **edit profile** (name, phone, email, profile picture with preview), and **change password** (min 8 chars).
- **Login history** (IP, browser, device, OS, status) and an **audit log** (login, logout, password change, profile update).
- Security: bcrypt password hashing, Helmet, CORS, rate limiting, and revocable refresh tokens.

Business modules (products, stock, purchases, sales, dealers, vendors, ledgers, reports) remain
intentional placeholders for future phases.

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
cp .env.example .env          # then edit DATABASE_URL (and JWT secrets)
npm install
npm run prisma:generate       # generate the Prisma client
npm run prisma:migrate        # create/apply the migration (users, refresh_tokens, login_history, audit_logs, settings)
npm run db:seed               # create the default admin + settings
npm run dev                   # starts http://localhost:5000
```

> **Upgrading from Phase 1?** The `users` table changed (new `username`, `phone`, `profileImage`
> columns) and new tables were added. Since a dev database only holds seed data, the simplest way
> to apply everything cleanly is a reset — it drops, re-migrates and re-seeds automatically:
>
> ```bash
> npx prisma migrate reset
> ```
>
> After reset, sign in with the new default admin: **admin / admin123**.

> **Adding Phase 3 (Masters) to an existing Phase 2 setup?** Phase 3 only *adds* new tables
> (`categories`, `brands`, `units`) and changes nothing existing — so **no reset is needed** and
> your data stays intact. Just run:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push        # creates the 3 new tables, keeps existing data
> ```
>
> Then start the app as usual. The **Masters** menu is now active in the sidebar.

> **Adding Phase 4 (Products)?** Same story — it only adds the `products` table, no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Products** menu is now active. Tip: add a few Categories / Brands / Units first so the
> product form's dropdowns are populated.

> **Adding Phase 5 (Vendors + Purchases)?** It only adds new tables — no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Vendors** and **Purchases** menus are now active. Add a vendor and a few products first,
> then create a purchase and mark it **Complete** to see stock increase automatically.

> **Adding Phase 6 (Sales)?** It only adds new tables + two stock-movement types — no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Sales** menu is now active. Make sure products have stock (via a completed purchase),
> then create a sale and mark it **Complete** to see stock decrease automatically.

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
Username: admin
Password: admin123
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
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime            | `15m`                                               |
| `JWT_REFRESH_SECRET`     | Secret for refresh tokens        | `another-long-random-string`                        |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime           | `30d`                                               |
| `SEED_ADMIN_USERNAME` | Admin username created by the seed   | `admin`                                             |
| `SEED_ADMIN_PASSWORD` | Admin password created by the seed   | `admin123`                                          |
| `SEED_ADMIN_EMAIL`    | Admin email created by the seed      | `admin@srsgodown.com`                               |

### Frontend (`frontend/.env`)

| Variable       | Description        | Example                     |
| -------------- | ------------------ | --------------------------- |
| `VITE_API_URL` | Base URL of the API | `http://localhost:5000/api` |

---

## 🗄️ Database

Phase 2 defines these tables:

- **`users`** — id, name, username, email, phone, password (bcrypt), role, profileImage, isActive, lastLogin, timestamps
- **`refresh_tokens`** — hashed refresh tokens (revocable on logout / password change)
- **`login_history`** — one row per login session (IP, browser, device, OS, status, login/logout time)
- **`audit_logs`** — security events (LOGIN, LOGOUT, PASSWORD_CHANGE, PROFILE_UPDATE)
- **`categories`**, **`brands`**, **`units`** — master lookup tables (name, description/short name, isActive)
- **`products`** — product catalogue (auto code/SKU/barcode, image, pricing, stock, bike compatibility, soft-delete)
- **`vendors`** — suppliers with opening & outstanding balance
- **`purchases`** / **`purchase_items`** — purchase invoices and their line items
- **`purchase_returns`** / **`purchase_return_items`** — returns against completed purchases
- **`stock_movements`** — running log of every stock change (purchase in/out, sale in/out)
- **`sales`** / **`sale_items`** — sale invoices and their line items
- **`sale_returns`** / **`sale_return_items`** — returns against completed sales
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

## 📡 API endpoints

| Method | Endpoint             | Auth | Description                     |
| ------ | -------------------- | ---- | ------------------------------- |
| GET    | `/api/health`        | –    | Service + database health check |
| POST   | `/api/auth/login`         | –    | Sign in (username + password), returns access + refresh tokens |
| POST   | `/api/auth/refresh`       | –    | Exchange a refresh token for a new access token |
| POST   | `/api/auth/logout`        | ✅   | Revoke refresh token + end session |
| GET    | `/api/auth/profile`       | ✅   | Current authenticated user      |
| PUT    | `/api/auth/profile`       | ✅   | Update name / email / phone / photo |
| PUT    | `/api/auth/change-password` | ✅ | Change password (min 8 chars)   |
| GET    | `/api/auth/login-history` | ✅   | Recent login sessions           |
| GET    | `/api/auth/audit-log`     | ✅   | Recent security events          |
| GET/POST | `/api/masters/categories`        | ✅ | List / create categories    |
| PUT/PATCH/DELETE | `/api/masters/categories/:id` | ✅ | Update / toggle status / delete |
| GET/POST | `/api/masters/brands`            | ✅ | List / create brands        |
| PUT/PATCH/DELETE | `/api/masters/brands/:id`     | ✅ | Update / toggle status / delete |
| GET/POST | `/api/masters/units`             | ✅ | List / create units         |
| PUT/PATCH/DELETE | `/api/masters/units/:id`      | ✅ | Update / toggle status / delete |
| GET/POST | `/api/products`                  | ✅ | List (filter/sort/paginate) / create |
| GET/PUT/DELETE | `/api/products/:id`        | ✅ | View / update / soft-delete |
| PATCH  | `/api/products/:id/status`         | ✅ | Toggle active status        |
| POST   | `/api/products/:id/duplicate`      | ✅ | Duplicate a product         |
| POST   | `/api/products/import`             | ✅ | Bulk import from Excel rows  |
| GET/POST | `/api/vendors`                   | ✅ | List / create vendors        |
| GET/PUT/DELETE | `/api/vendors/:id`         | ✅ | View / update / delete vendor |
| GET    | `/api/vendors/:id/history`         | ✅ | Vendor purchase history      |
| PATCH  | `/api/vendors/:id/status`          | ✅ | Toggle vendor status         |
| GET/POST | `/api/purchases`                 | ✅ | List / create purchases      |
| GET/PUT/DELETE | `/api/purchases/:id`       | ✅ | View / edit / delete (draft) |
| POST   | `/api/purchases/:id/complete`      | ✅ | Complete → stock inward      |
| GET/POST | `/api/purchases/returns`         | ✅ | List / create returns        |
| GET    | `/api/purchases/stock-movements`   | ✅ | Stock movement history       |
| GET/POST | `/api/sales`                     | ✅ | List / create sales          |
| GET/PUT/DELETE | `/api/sales/:id`           | ✅ | View / edit / delete (draft) |
| POST   | `/api/sales/:id/complete`          | ✅ | Complete → stock outward     |
| GET/POST | `/api/sales/returns`             | ✅ | List / create sale returns   |
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
