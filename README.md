# Consumers-Retailers-E-Commerce

A full-stack, multi-tenant marketplace platform — retailers onboard their business, list products
and fulfil orders; consumers browse, buy and track deliveries. Modeled on Indian e-commerce
marketplaces (GST/PAN onboarding, INR pricing) with an Amazon-style order lifecycle.

## Overview

Two independent React storefronts share one Express/MongoDB API:

- **`retailers/`** — the seller console: business onboarding, product & category management,
  order fulfilment, a team of role-scoped staff accounts, and a dashboard with earnings and
  analytics.
- **`consumers/`** — the shopper-facing storefront: browse, search, cart, checkout, track orders,
  manage saved addresses and profile.
- **`server/`** — the shared REST API (Express + Mongoose) both apps talk to.

## Architecture

```
┌─────────────┐        ┌─────────────┐
│  retailers  │        │  consumers  │      React 18 SPAs (CRA), each with its
│  (port 3000)│        │ (port 3002) │      own router, auth context & API client
└──────┬──────┘        └──────┬──────┘
       │        REST (JSON)          │
       └──────────────┬──────────────┘
                       ▼
              ┌─────────────────┐
              │   server (API)  │   Express + Mongoose, JWT auth,
              │   port 4000     │   role-based access control
              └────────┬────────┘
                       ▼
              ┌─────────────────┐        ┌─────────────┐
              │    MongoDB      │        │  Cloudinary │  image hosting for
              │  (Atlas / local)│        │  (images)   │  product photos & logos
              └─────────────────┘        └─────────────┘
```

## Tech stack

- **Frontend:** React 18, React Router 6, plain CSS (no UI framework), Context API for auth/cart
  state (no Redux — the removed dependency wasn't worth the boilerplate for this app's scope).
- **Backend:** Node.js, Express 4, Mongoose 8 (MongoDB), JSON Web Tokens, bcrypt.
- **Images:** Cloudinary (server-streamed uploads — the API key/secret never reach the browser).
- **Testing:** Jest + Supertest + mongodb-memory-server (backend integration tests, no real DB
  needed to run them).
- **Deployment:** Dockerfiles for all three services + docker-compose for local/all-in-one runs;
  `vercel.json` for static SPA hosting; `render.yaml` blueprint for the API.

## Features

### Retailer console
- Multi-step business onboarding: company details, industry, GSTIN/PAN (format-validated),
  address, payout bank details, logo upload.
- Product catalog: MRP + discount% → computed final price, stock, industry-specific custom
  attributes (e.g. size/material for fashion, prescription-required for pharmacy), image upload.
- Order fulfilment: each order line item (which may belong to a different retailer than its
  siblings — an Amazon-style split shipment) can be **accepted, declined, dispatched, marked out
  for delivery, delivered, cancelled**, with a full status-change timeline. The overall order
  status shown to the consumer is derived (rolled up) from its item statuses.
- Dashboard: product/category/order counts, earnings (from delivered items), a low-stock list, a
  "pending orders needing attention" counter, and a 14-day sales trend.
- Team accounts: invite **admin / manager / sales** staff with a server-enforced permission
  matrix (e.g. `sales` can update order status but can't manage staff or see earnings).

### Consumer storefront
- Registration/login, home page with an offer carousel, category shortcuts and discounted/featured
  product rails.
- Product listing with search, category filter, discount filter and sort; product detail page
  with an attributes table and a "you may also like" related-products rail.
- Cart persisted in `localStorage`; checkout with saved/new addresses and a mock payment step
  (Cash on Delivery or simulated online payment — see [Known limitations](#known-limitations)).
- Order history, per-order detail with a delivery tracking stepper, item cancel (before dispatch)
  and return requests (after delivery).
- Address book and profile management.

### Cross-cutting
- **Atomic stock reservation** — checkout uses a conditional `findOneAndUpdate` per line item
  (`inventory: {$gte: qty}`) rather than a read-then-write, so two concurrent checkouts against
  the last unit of stock can never both succeed. See `server/tests/stock-race.test.js` for a test
  that proves it under real concurrency.
- Every retailer-scoped query is keyed off `req.user.retailerId`, not the caller's own id — this
  is what lets both the owner and any of their staff act on the same store's data while
  `require-permission.js` gates *what* each role can do.

## Local setup

Prerequisites: Node.js 18+, npm, and either a local MongoDB or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
git clone <this repo>
cd Consumers-Retailers-E-Commerce
cp .env.example .env                       # fill in MONGODB_URI, tokenSecretKey, Cloudinary keys
cp retailers/.env.example retailers/.env
cp consumers/.env.example consumers/.env

npm install                                 # server deps (root)
npm install --prefix retailers
npm install --prefix consumers

npm run seed                                # populates demo retailers, staff, products, orders
npm run dev                                 # runs server (4000), retailers (3000), consumers (3002)
```

After seeding, `npm run seed`'s console output prints every demo login. All seeded accounts share
the password `Password123`. A few to try:

| Role | Email |
|---|---|
| Retailer owner | `owner@techbazaar.in` |
| Retailer manager | `priya-nair@techbazaar.in` (use "Team Login" on the sign-in page) |
| Retailer sales staff | `karan-shah@techbazaar.in` (Team Login) |
| Consumer | `aditi.sharma@example.com` |

## Environment variables

**Root `.env`** (server):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `tokenSecretKey` | JWT signing secret |
| `saltRounds` | bcrypt cost factor |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins (enforced only when `NODE_ENV=production`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads — free tier at cloudinary.com |

**`retailers/.env` and `consumers/.env`:**

| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL` | Base URL of the API (e.g. `http://localhost:4000`, or your deployed API's URL) |

## Docker quickstart

```bash
docker compose up --build
```

Starts MongoDB, the API (port 4000), the retailer console (port 3000) and the consumer storefront
(port 3002). Set real values in `.env` first (the API container reads it via `env_file`).

## Deploying

You can deploy the pieces independently — API and both frontends do not need to share a host.

**Option A — Render (API) + Vercel (both frontends), recommended for a free, no-ops setup:**
1. Push this repo to GitHub.
2. On Render: New → Blueprint, point it at this repo (`render.yaml` is already set up) or create
   a Web Service manually with build command `npm install`, start command `node server/server.js`,
   and the env vars listed above. Note the free plan sleeps after inactivity (first request after
   idle takes ~30-50s).
3. On Vercel: import the repo twice — once with root directory `retailers`, once with
   `consumers`. Framework preset: Create React App. Set `REACT_APP_API_URL` to your Render API URL
   in each project's environment variables, and redeploy.

**Option B — Docker / VPS:** build and run the three Dockerfiles (`server/Dockerfile`,
`retailers/Dockerfile`, `consumers/Dockerfile`) behind your own reverse proxy, or run
`docker compose up --build` directly on the VPS. Point `REACT_APP_API_URL` (a build arg) at
wherever the API container is reachable before building the two frontend images.

Either way, remember to set `NODE_ENV=production` and a real `ALLOWED_ORIGINS` on the API once
your frontends have real URLs — CORS is wide open in development but locked down in production.

## Testing

```bash
npm test
```

Runs the backend Jest + Supertest suite against an in-memory MongoDB
(`mongodb-memory-server` — no setup required). Covers: auth (retailer + consumer), the retailer
staff RBAC permission matrix, the full order status lifecycle and its rollup logic, and the
stock-reservation race condition fix. Frontend test coverage is limited to CRA's default smoke
test — see [Known limitations](#known-limitations).

## API reference (summary)

All responses are JSON: `{ success, data | message }`. Authenticated routes expect
`Authorization: Bearer <token>`.

| Area | Base path | Notes |
|---|---|---|
| Retailer auth & staff | `/api/retailers/auth/*`, `/api/retailers/staff/*` | Owner and staff both log in here; JWT carries `retailerId` + `staffRole` |
| Retailer catalog | `/api/retailers/categories`, `/api/retailers/products` | Scoped to `req.user.retailerId` |
| Retailer orders | `/api/retailers/orders`, `.../items/:itemId/status` | Only this retailer's line items are visible/actionable |
| Retailer dashboard | `/api/retailers/dashboard` | Earnings hidden from `sales`-role staff |
| Consumer auth & profile | `/api/consumers/auth/*`, `/api/consumers/addresses` | |
| Storefront (public) | `/api/store/categories`, `/api/store/products`, `.../:id/suggestions` | No auth required |
| Orders (consumer) | `/api/orders`, `/api/orders/:id`, `.../items/:itemId/cancel|return` | |
| Uploads | `POST /api/uploads/image` | multipart `image` field, streams to Cloudinary |
| Health | `GET /api/health` | For uptime monitors / Render health checks |

## Known limitations

- **Payments are mocked.** Checkout supports Cash on Delivery or a simulated "paid online" flag —
  there's no real payment gateway (Razorpay/Stripe) integration.
- **Stock reservation is per-document atomic, not a multi-document transaction.** This avoids
  requiring a replica-set-configured MongoDB for local dev, and is sufficient to prevent overselling
  (see `server/tests/stock-race.test.js`), but a true saga/transaction would be needed if a single
  checkout had to guarantee all-or-nothing across unrelated collections.
- **Bank account details are stored in plaintext** (masked only in API responses) — fine for a
  portfolio demo, not for a real payout system, which would need encryption-at-rest or tokenization
  via a payment processor.
- **CRA (react-scripts 5) is end-of-life** and its transitive dependencies carry known
  vulnerabilities (dev-tooling only — webpack-dev-server, svgo, etc. — not shipped to production
  users). A production hardening pass would migrate both frontends to Vite.
- **No rate limiting, no refresh tokens** (JWTs are 24h, non-revocable until expiry), **no email
  delivery** (order confirmations, staff invites, etc. are visible in-app only, not emailed).
- **No automated frontend tests.**

## Roadmap / how this could be extended

- Real payment gateway (Razorpay, India-market fit) with signed webhook verification.
- Full-text/faceted product search (Elasticsearch or MongoDB Atlas Search) beyond regex matching.
- Redis-backed caching for the public storefront endpoints and rate limiting on auth routes.
- Transactional email (SendGrid/SES) for order status changes and staff invites.
- Refresh-token rotation + revocable sessions instead of long-lived stateless JWTs.
- A recommendation engine for "suggested products" beyond same-category heuristics.
- CI (GitHub Actions) running the Jest suite and both CRA builds on every PR.
