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
- **SEO:** Ahrefs CSV imports, CrUX API (real user data), PageSpeed Insights API (lab data)
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
- Migrations via `drizzle-kit generate` then `drizzle-kit push` (requires `DATABASE_URL` env var)
- Use UUIDs for primary keys
- Use `timestamp` with timezone for all date columns
- Domain-level data (CrUX scores, Ahrefs upload metadata) stored in `projects.settings` JSONB
- Per-page data (SEO scores, PSI scores, on-page signals) stored as columns on `pages` table

### Testing
- **Vitest** for unit and integration tests
- Test files: `src/**/__tests__/*.test.ts`
- Run: `pnpm test`

### Data Tables UI Pattern

All data tables in the project follow a consistent pattern. When adding a new table:

**Structure:**
```tsx
<div className="rounded-lg border overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b bg-muted/50">
        <th className="text-left p-3 font-medium">Column</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
          <td className="p-3">...</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Key conventions:**
- Wrapper: `rounded-lg border overflow-hidden`
- Header: `border-b bg-muted/50`, cells with `p-3 font-medium`
- Rows: `border-b last:border-0 hover:bg-muted/30`
- URLs: `font-mono text-xs text-primary` with `<a>` or `<Link>`, use `max-w-xs truncate`
- Numbers: `text-right tabular-nums`
- Badges: use shadcn `<Badge>` with tier colors (`bg-green-100 text-green-800`, etc.)
- Tooltips on headers: use `<Tooltip>` + `<Info>` icon from lucide-react (see `seo-table.tsx`)

**Pagination (server-side, URL-based):**
```tsx
<div className="flex items-center justify-between">
  <p className="text-sm text-muted-foreground">
    Showing {startItem}–{endItem} of {total}
  </p>
  <div className="flex items-center gap-1">
    <Link href={prevUrl} className="inline-flex items-center justify-center rounded-md border h-8 w-8 hover:bg-muted"
      aria-disabled={page <= 1}>
      <ChevronLeft className="h-4 w-4" />
    </Link>
    <span className="px-2 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
    <Link href={nextUrl} className="inline-flex ... hover:bg-muted"
      aria-disabled={page >= totalPages}>
      <ChevronRight className="h-4 w-4" />
    </Link>
  </div>
</div>
```

- Use `searchParams` for page number, filter state
- Disable links with `pointer-events-none opacity-50` + `aria-disabled` + `tabIndex={-1}`

**Reference implementations:** `pages-table.tsx`, `seo-table.tsx`, `content-tiers.tsx`

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
      projects/[id]/      # Project tabs: overview, crawl, analysis, pages, seo, performance, report
    (public)/             # Public report viewer
    api/                  # Webhook endpoints only
  actions/                # Server Actions (projects.ts, seo.ts, analysis.ts, report.ts)
  components/             # React components
    analysis/             # Classification, section detection UI
    pages/                # Pages table, tree view, sitemap
    projects/             # Project tabs, forms
    report/               # Report sections and layout
    seo/                  # SEO table, Ahrefs upload, CrUX overview, PSI controls
    ui/                   # Shadcn/ui primitives
  db/                     # Drizzle schema, connection, seeds
  inngest/                # Inngest client and functions
  lib/                    # Utilities, constants, Supabase clients (url.ts, utils.ts)
  services/               # Business logic
    seo.ts                # On-page extraction + SEO scoring
    ahrefs-parser.ts      # Ahrefs CSV parsing (UTF-16LE/UTF-8, Zod validation)
    crux.ts               # Chrome UX Report API (origin + history)
    pagespeed.ts          # PageSpeed Insights API
    report-data.ts        # Report data assembly
  types/                  # Shared TypeScript types
docs/
  PRD.md                  # Product requirements
  plans/                  # Build plans
  solutions/              # Learnings and gotchas from past work — check before building
  example-ahrefs-csv/     # Ahrefs CSV fixtures for testing
```

## Learnings

Check `docs/solutions/` before starting new work. These documents capture gotchas, patterns, and decisions from past features so we don't repeat mistakes. Add a new file after completing any non-trivial feature.
