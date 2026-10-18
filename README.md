# Rental Manager PH

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791)

A full-stack property management system built for Philippine landlords and property managers. Manage properties, tenants, leases, income and expenses, maintenance requests, utilities, contracts, and generate statements of account — all in one platform.

## Overview

Rental Manager PH is a Next.js application with role-based access. Admins and managers handle the full lifecycle of rental operations: from onboarding tenants and drafting lease agreements, to tracking monthly income, logging maintenance issues, and generating financial reports.

## Features

- **Properties** — Manage rental units with detailed profiles and reminders
- **Tenants** — Tenant directory with contact info and lease history
- **Leases** — Create and manage lease agreements with penalty calculation
- **Income & Expenses** — Log rental income and expenses per property
- **Maintenance** — Track and resolve maintenance requests
- **Utilities** — Monitor utility billing per unit
- **Contracts** — Generate rental contracts (DOCX export)
- **Statement of Account (SOA)** — Generate SOAs for tenants
- **Reports** — Financial summaries and property reports (PDF export)
- **Dashboard** — Overview of active leases, reminders, and financials
- **Organization** — Multi-user organization with role-based access
- **File Uploads** — Cloudflare R2 for document storage

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | Iron Session (JWT cookies) + bcrypt |
| Styling | Tailwind CSS |
| State | Zustand |
| Data Fetching | TanStack Query |
| PDF Export | jsPDF, jsPDF-AutoTable |
| Word Export | docx |
| File Storage | Cloudflare R2 |
| Testing | Playwright (E2E) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment

Create `.env.local` with `DATABASE_URL`, `SESSION_SECRET`, and (for file uploads) `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`.

### Database Setup

```bash
npx prisma generate
npx prisma migrate dev
npx tsx prisma/reseed-accounts.ts   # optional: demo accounts and default settings
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── properties/
│   ├── tenants/
│   ├── leases/
│   ├── income/
│   ├── expenses/
│   ├── maintenance/
│   ├── utilities/
│   ├── contracts/
│   ├── reports/
│   ├── settings/
│   ├── login/
│   └── api/          # API route handlers
├── components/
│   ├── dashboard/
│   ├── layout/
│   ├── organization/
│   ├── property/
│   ├── reports/
│   └── ui/
├── hooks/
├── lib/              # Auth, DB, contract templates
└── stores/           # Zustand state stores

prisma/
└── schema.prisma

e2e/                  # Playwright E2E tests (17 test files, 170+ scenarios)
```

## Testing

```bash
# E2E tests
npm run test:e2e

# With UI
npm run test:e2e:ui
```

## License

MIT — see [LICENSE](LICENSE).
