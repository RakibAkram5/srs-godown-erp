# SRS Godown ERP — Phase 13 (Adjustments, Pending Ledger, Payments & Pro Excel)

A modern, fast and beginner-friendly ERP for a **bike spare parts warehouse**.

**Phase 2** adds a complete, production-ready **Authentication & User Management** system on top of
the Phase 1 foundation, without changing the existing structure, layout, theme or design.

**What's new in Phase 13 — the final build**

- **Live dashboard**: real numbers now — products, total stock, low/out-of-stock, today's & monthly sales, a 7-day sales chart, and (Admin) receivable/payable, month purchases/expenses/salaries, **net profit**, pending-to-collect and recent sales.

- **Manual balance adjustment** (Admin): correct a dealer/vendor outstanding balance up or down with a reason, recorded straight into the ledger (Debit/Credit).
- **Dedicated Pending Ledger** (Admin): all **unpaid & partially-paid** sales and purchases, filter by party, date, bill no and status, with total-to-collect / total-to-pay and Excel export.
- **Payments management** (Admin): a full list of every vendor payment and dealer receipt with **edit and delete** — balances, ledgers and pending update automatically.
- **Dispatch edit**: dispatch records are now add / view / **edit** / delete.
- **Professional Excel** across every report (Sales, Purchases, Dealer/Vendor Ledger, Pending Ledger, Payments, Expenses, Salaries, Financial): company name & **logo**, report title, generated timestamp, applied filters, **bold bordered header**, currency formatting, **auto column width**, **totals row** and a print-ready landscape layout.

**What's new in Phase 12 — Expenses, Salaries & Financial Reports**

- **Godown Expenses** (Admin): warehouse costs (rent, electricity, utilities, maintenance, equipment, etc.) with add/edit/delete, category & date filters, running total and Excel export.
- **Salary Management** (Admin): monthly employee salaries with paid/remaining, status, month filter, payment history and Excel export.
- **Financial Reports** (Admin): a **Profit & Loss** statement for any **Annual / Quarterly / custom** period — Sales, Purchases, Expenses, Salaries, **Net Profit**, plus outstanding balances, pending value and expenses-by-category, with Excel export.
- All expenses and salaries flow into the P&L automatically.

**What's new in Phase 11 — Auth, RBAC & User Management**

- **Demo credentials removed** from the login page.
- **User Management** (Admin only): create/edit/delete Managers & Employees, each with their own username/password, reset passwords, activate/deactivate.
- **Role-Based Access Control**:
  - **Admin** — full access to every module, reports, ledgers, settings and user management.
  - **Manager / Employee** — only the operational modules the Admin grants (Masters, Products, Purchases, Sales, Dispatch, Dealers, Vendors).
- **Admin-only** and hidden from everyone else: Financial Reports, Ledgers, Pending, Outstanding balances, Settings and User Management.
- **Menus are hidden completely** (not just disabled) for unauthorized users, and **direct-URL access is blocked** by route guards.
- **Backend APIs are protected** with role/permission middleware (e.g. payments, ledgers, pending, settings-write and user management are admin-only).
- **Invoice footer** on every invoice (screen + PDF): *Developed by SRS Matrix · Contact: 03014334151*.

**What's new in Phase 10 — Invoices, Ledgers & Reports**

- **Invoice**: separate **Print** and **Save PDF** buttons; every invoice carries its unique **Bill No** (SAL-/PUR-).
- **Purchase**: sales/purchase lists now show total **Qty** (not just line count); **completed purchases can be deleted** (stock removed + vendor balance reversed, blocked if it has returns).
- **Vendor profile**: purchase history now shows **Date, Bill No, Bill Amount and Products**, with **Excel export** of vendor-wise purchases.
- **Dealer**: new **City** field; dealers can be **searched by city** (e.g. Lahore).
- **Ledgers**: proper **Debit / Credit** accounting layout for both vendor and dealer ledgers, each with **Excel export**.
- **Reports**: one-click **Excel export** for **Sales**, **Purchases** and the **Pending ledger**.

**What's new in Phase 9 — Pending & Dispatch**

- **Pending (backorder)**: completing a sale no longer blocks on low stock — it delivers what's in stock and records the shortfall as **pending**.
- **Pending tab** (in Sales): shows each pending item with its current stock; a **Fulfill** button dispatches it (deducts stock) once stock is available. Fulfilment is manual and can be partial.
- **Purchase payment**: purchases now also record **paid vs on-credit**; only the credit portion is owed to the vendor, and the vendor ledger + purchase invoice show paid / remaining / previous balance / grand total.
- **Out-of-stock guard**: a product with **0 stock can't be added to a sale** — the admin is told to purchase stock first (partial stock still allowed as pending).
- **Delete completed sales**: a completed sale can now be deleted — delivered stock is restored and the dealer balance reversed (blocked if it has returns or dispatches).
- **Payment at sale**: record how much the customer **paid now**; only the **remaining** goes to their outstanding. The invoice shows **previous balance + this bill = grand total payable**, and the sales list shows a **Paid / Due** indicator and total **quantity** sold.
- **Dispatch**: a transport log linked to a sale invoice — **bilty number, transporter, destination city, date** — with **Excel export** for your records.

**What's new in Phase 8 — Ledgers**

- **Payments & receipts**: record money **paid to a vendor** or **received from a dealer**; balances update automatically.
- **Vendor ledger**: opening balance + purchases (+), purchase returns (−) and payments (−) with a running balance.
- **Dealer ledger**: opening balance + sales (+), sale returns (−) and receipts (−) with a running balance.
- **Ledgers page**: separate **Vendor Ledger** and **Dealer Ledger** tabs, each with a **total payable / receivable** summary and a party selector.
- Every payment/receipt gets an auto voucher number (PAY-… / RCV-…) and can be reversed by deleting it.

**What's new in Phase 7 — Dealers & Ledger**

- **Dealers**: full CRUD (name / phone / email / address, opening balance) with auto-updated **outstanding balance**.
- **Dealer ledger**: running balance view combining completed sales and returns, oldest-to-newest.
- **Sales ↔ Dealers**: a sale can be linked to a dealer (dropdown) or left as a walk-in / cash customer. Completing a dealer sale increases the dealer's balance; a return decreases it.
- **Invoice upgrade**: sale & purchase invoices now show the **company logo** and **company name**, with **Urdu terms & conditions** printed at the bottom.
- **Print / Save PDF**: invoices print on A4 with repeating headers and clean pagination for long bills (100+ items); use the browser's "Save as PDF" for a PDF copy.
- **Fix**: number fields (qty / price / discount) now select on focus, so the leading `0` is replaced as you type.

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

> **Adding Phase 7 (Dealers)?** It adds the `dealers` table and an optional `dealer_id` on sales — no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Dealers** menu is now active. Set your shop name in **Settings → Company Name**
> (e.g. *SRS Traders*) and a **Company Logo URL** so they appear on printed invoices.

> **Adding Phase 8 (Ledgers)?** It adds the `payments` table and relations — no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Ledgers** menu is now active. Open a vendor/dealer ledger, then use **Record Payment**
> or **Record Receipt** to reduce their balance.

> **Adding Phase 9 (Pending & Dispatch)?** It adds `dispatches` + a `pending_quantity` column — no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> **Note:** completing a sale now delivers available stock and puts the shortfall in the **Sales → Pending**
> tab; fulfil it later once stock arrives. The **Dispatch** menu keeps your bilty/transport log.

> **Adding Phase 10?** It only adds a `city` column to dealers — no reset needed:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Reports** menu is now active (Sales / Purchase / Pending Excel export). Ledgers show a
> Debit/Credit layout with Excel export, and invoices have separate **Print** and **Save PDF** buttons.

> **Adding Phase 11 (Auth & RBAC)?** It adds a `permissions` column and an `EMPLOYEE` role — no reset:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> The **Users** menu (Admin only) lets you create Managers/Employees and tick which modules they can use.
> Financial data (ledgers, reports, pending, outstanding, settings) stays admin-only and is hidden from others.

> **Adding Phase 12 (Expenses/Salaries/Financial)?** It adds `expenses` and `salaries` tables — no reset:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> New Admin-only menus: **Expenses**, **Salaries** and **Financial** (Profit & Loss, annual/quarterly).

> **Adding Phase 13 (final)?** It adds the `adjustments` table — no reset:
>
> ```bash
> npm run prisma:generate
> npm run prisma:push
> ```
>
> New Admin-only menus: **Payments** (edit/delete) and **Pending Ledger** (unpaid invoices).
> Ledgers now have an **Adjust** button, and every report exports as a **professionally formatted Excel** file.

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
- **`dealers`** — customers you sell to, with opening & outstanding balance (sales carry an optional `dealer_id`)
- **`payments`** — money paid to vendors and received from dealers (feeds the ledgers)
- **`sale_items.pending_quantity`** — how much of a sold line is still undelivered (backorder)
- **`dispatches`** — transport records (bilty, transporter, city) linked to sale invoices
- **`dealers.city`** — dealer's city, used for search/filter
- **`users.role`** (Admin/Manager/Employee) & **`users.permissions`** — module access control
- **`expenses`** — warehouse/godown expenses (feeds the P&L)
- **`salaries`** — monthly employee salary records with payment status
- **`adjustments`** — manual dealer/vendor balance corrections (feed the ledgers)
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
| GET/POST | `/api/dealers`                   | ✅ | List / create dealers        |
| GET/PUT/DELETE | `/api/dealers/:id`         | ✅ | View / update / delete dealer |
| GET    | `/api/dealers/:id/ledger`          | ✅ | Dealer ledger (running balance) |
| PATCH  | `/api/dealers/:id/status`          | ✅ | Toggle dealer status         |
| GET    | `/api/vendors/:id/ledger`          | ✅ | Vendor ledger (running balance) |
| GET/POST | `/api/payments`                  | ✅ | List / record payment or receipt |
| DELETE | `/api/payments/:id`                | ✅ | Delete & reverse a payment/receipt |
| GET    | `/api/sales/pending`               | ✅ | Pending (backorder) items    |
| POST   | `/api/sales/items/:itemId/fulfill` | ✅ | Fulfill a pending item (deduct stock) |
| GET/POST | `/api/dispatches`                | ✅ | List / create dispatch records |
| DELETE | `/api/dispatches/:id`              | ✅ | Delete a dispatch            |
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
