# Project guidance

- Stack: Next.js App Router, strict TypeScript, Tailwind v4, Prisma/PostgreSQL, Auth.js credentials. Arabic RTL; Tajawal for Arabic and DM Sans for Latin text.
- Verify with `npm run typecheck`, `npm test`, `npm run build`, and `npm audit`. Run `npm run db:generate` after schema/dependency changes.
- Use Node 22.12+ for the full dependency toolchain. Node 20.20 can run the application but some dependency CLIs require Node 22.
- `npm run db:migrate` deploys committed migrations; `npm run db:seed` creates six fixed specialities only; `npm run admin:setup` is the trusted one-time bootstrap.
- No public registration, payments, subscription expiry or financial entities. Student accounts are admin-created, active-only and forced to replace temporary passwords.
- Reuse `apiUser`, `requireUser`, `requireAdmin` and `canAccess`; never rely on client-side filtering for access control. Keep provider credentials and answer keys server-side.
- `/preview` is development-only, read-only fixture data. It must never authorize private resources or be available in production.
- HTTP tests require an isolated PostgreSQL database with `test` in its name, seeded/migrated, and an app using that database. Set `TEST_DATABASE_URL` and `APP_TEST_URL` for the test runner. Tests retain their uniquely named fixtures; never point them at production.
- All provider flows fail explicitly when credentials are absent. Live Zoom, private Stream/R2 access and recording import still require credentialed acceptance testing.
- Standalone seed/admin scripts must load `.env*` with `@next/env` before constructing PrismaClient. After adding or changing `DATABASE_URL`, fully restart the Next.js dev server to discard its cached Prisma client.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
