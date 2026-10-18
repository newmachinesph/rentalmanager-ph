# AGENTS.md — Rental Manager PH

<!-- CLAUDE.md in this repo is just: @AGENTS.md -->

## Stack
Next.js 16.1.6 (App Router) · React 19 · Tailwind v4 · TypeScript · Prisma 7 + Postgres (`pg` adapter) · iron-session auth (bcryptjs) · zustand · TanStack Query · zod · Playwright.

## Loadouts (equip what applies)
@~/.claude/rules/ecc/common/coding-style.md
<!-- core packs (common/karpathy/git/security/windows) are always on via global CLAUDE.md -->
@~/.claude/rules/loadout/profiles/web.md
<!-- Postgres via Prisma, not Supabase — api profile (FastAPI/Supabase) does not apply here. -->

## Golden rule
Pull current docs via **Context7** for the exact installed version before coding (Next 16, React 19, Tailwind 4, Prisma 7). Don't trust training memory.

## Memory (read at session start, update at session end)
- `PROJECT.md`  — current status
- `DECISIONS.md` — why we chose things
- `MISTAKES.md`  — pitfalls to not repeat
- `CONTRACT.md`  — plan for a high-risk change; create before, delete after verify
