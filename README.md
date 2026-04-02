# Peer-to-Peer Lending Platform

Production-ready marketplace-style P2P lending platform built with:

- Backend: Node.js, Express, Prisma, PostgreSQL, JWT
- Frontend: Next.js (App Router), React, Recharts
- Deployment: Vercel frontend + Render backend ready

## Project Structure

```text
p2p/
  backend/
    prisma/
    src/
  frontend/
    app/
    components/
    lib/
  render.yaml
```

## Features

- JWT authentication with borrower and lender roles
- Loan application workflow with financial details
- Mock credit scoring microservice
- Risk-based pricing and EMI generation
- Marketplace listing with expected return insights
- Lender investing and portfolio analytics
- Repayment tracking with automatic default escalation
- Swagger docs
- Seed data for quick testing

## One-Command Local Dev

Prerequisites:

- Node.js 20+
- Docker Desktop with `docker compose`

Install app dependencies once:

```bash
npm --prefix backend install
npm --prefix frontend install
```

Start the full stack with one command from the repo root:

```bash
npm run dev
```

What it does:

- Creates `backend/.env` from [backend/.env.example](backend/.env.example) if missing
- Creates `frontend/.env.local` from [frontend/.env.example](frontend/.env.example) if missing
- Starts PostgreSQL in Docker on `localhost:5432`
- Applies Prisma migrations
- Seeds demo users and sample marketplace data
- Starts the backend on `http://localhost:5000`
- Starts the frontend on `http://localhost:3000`

Stop the local database container and clean its volume with:

```bash
npm run dev:down
```

## Backend Setup

1. Go to the backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template and update values:

```bash
cp .env.example .env
```

4. Run Prisma migrations and seed:

```bash
npx prisma migrate dev --name init
npm run seed
```

5. Start the API:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

Swagger docs: `http://localhost:5000/api-docs`

## Frontend Setup

1. Go to the frontend:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp .env.example .env.local
```

4. Start the app:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

## API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /loan/apply`
- `GET /loan/marketplace`
- `GET /loan/my-loans`
- `POST /invest`
- `POST /repayment/pay`
- `GET /portfolio`

## GitHub Publish Checklist

Before pushing:

1. Make sure these generated folders are not committed:

- `frontend/.next`
- `backend/node_modules`
- `frontend/node_modules`
- `.env` files

2. Commit the source files, Prisma migration files, and [render.yaml](render.yaml).
3. Push the repo to GitHub.

## Vercel Frontend + Render Backend

### 1. Deploy The Backend On Render

This repo includes a backend-only Render Blueprint file at [render.yaml](render.yaml) with:

- A managed Render Postgres database
- An Express API web service
- Automatic JWT secret generation for the backend
- Health checks and Prisma pre-deploy migrations

1. In Render, choose `New +` -> `Blueprint`.
2. Connect the GitHub repository that contains this project.
3. Render will detect [render.yaml](render.yaml) and create:

- `p2p-lending-db`
- `p2p-lending-api`

4. During the first setup, set `CLIENT_URLS` on the API service to include your frontend public URL.

Example:

```text
https://your-vercel-app.vercel.app,https://*.vercel.app,http://localhost:3000
```

5. Deploy the Blueprint.

After deploy, copy your Render backend public URL, for example:

```text
https://p2p-lending-api.onrender.com
```

### 2. Deploy The Frontend On Vercel

1. In Vercel, import the same GitHub repository.
2. Set the project Root Directory to `frontend`.
3. Add these environment variables in Vercel:

- `NEXT_PUBLIC_API_URL=https://p2p-lending-api.onrender.com`
- `INTERNAL_API_URL=https://p2p-lending-api.onrender.com`

4. Deploy the project.

The frontend proxies API requests through `/api`, and the proxy forwards to the Render backend using those Vercel env vars.

### 3. Final Cross-Origin Check

Once Vercel gives you the final production domain:

1. Add that domain to the Render backend `CLIENT_URLS` env var.
2. Trigger a backend redeploy in Render if needed.

Recommended `CLIENT_URLS` value:

```text
https://your-vercel-app.vercel.app,https://*.vercel.app,http://localhost:3000
```

### Deployment Environment Variables

Render backend:

- `DATABASE_URL` is wired automatically from Render Postgres
- `JWT_SECRET` is generated automatically
- `CLIENT_URLS` must be set manually

If you are using Render's free web service tier, `Pre-Deploy Command` may not be available. This repo's backend `start` script runs `prisma migrate deploy` before booting the API so the database schema is still applied on startup.

Vercel frontend:

- `NEXT_PUBLIC_API_URL` must point to the public Render backend URL
- `INTERNAL_API_URL` must point to the public Render backend URL
- Add payment gateway keys only if you enable live Stripe/Razorpay flows on the backend

## Demo Users After Seed

- Borrower: `borrower@example.com` / `Password123!`
- Lender: `lender@example.com` / `Password123!`
- Admin: `admin@example.com` / `Password123!`

## Notes

- The backend uses PostgreSQL in production and Prisma ORM throughout.
- Default-marking logic is triggered when more than two repayments are overdue.
- Transaction logging is written to the backend console and HTTP logs are captured through Morgan.
- The repo now includes an initial Prisma SQL migration in `backend/prisma/migrations`.
- The frontend proxies API requests through `frontend/app/api/[...path]/route.js`, which makes split deployments simpler because browser code can stay same-origin.
- Notification hooks currently log and persist email/SMS/in-app events; provider credentials can be added later without changing the event flow.
- Wallet and payment gateway foundations are now in place; Stripe and Razorpay intents/orders are created server-side and should be completed with provider keys and frontend checkout widgets.
