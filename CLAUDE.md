# Replatform Discovery Engine

AI-powered website analysis tool for migration auditing. Internal tool for Pagepro team.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + Shadcn/ui
- **Database:** PostgreSQL via Supabase + Drizzle ORM
- **Background Jobs:** Inngest (serverless durable functions)
- **AI:** Claude API (Haiku for classification, Sonnet for analysis/vision)
- **Crawler:** Firecrawl API
- **Hosting:** Vercel
- **Package Manager:** pnpm

## Conventions

### TypeScript
- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation of external data (API responses, form inputs)

### React / Next.js
- **Server Components by default.** Only use `"use client"` when you need browser APIs, event handlers, or hooks.
- Use **Server Actions** for mutations (not API routes). Exception: webhook endpoints.
- Route groups: `(dashboard)` for authenticated, `(public)` for public, `(auth)` for login/signup.

### File Naming
- **Files:** kebab-case (e.g., `crawl-progress.tsx`, `new-project-form.tsx`)
- **Components:** PascalCase exports (e.g., `export function CrawlProgress()`)
- **Server Actions:** `src/actions/` directory
- **Services (business logic):** `src/services/` directory
- **Database:** `src/db/` directory

### Database
- Use **Drizzle ORM** for all queries
- Schema in `src/db/schema.ts`
- Migrations via `drizzle-kit`
- Use UUIDs for primary keys
- Use `timestamp` with timezone for all date columns

### Testing
- **Vitest** for unit and integration tests
- Test files: `src/**/__tests__/*.test.ts`
- Run: `pnpm test`

### Git
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- Feature branches per phase: `feat/phase-N-description`
- PR to main after each phase

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Login/signup pages
    (dashboard)/          # Authenticated internal pages
    (public)/             # Public report viewer
    api/                  # Webhook endpoints only
  actions/                # Server Actions
  components/             # React components
  db/                     # Drizzle schema, connection, seeds
  inngest/                # Inngest client and functions
  lib/                    # Utilities, constants, Supabase clients
  services/               # Business logic (classification, scoring, etc.)
  types/                  # Shared TypeScript types
docs/
  PRD.md                  # Product requirements
  plans/                  # Build plans
```
