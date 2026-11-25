# Issam Math · BAC 2027

Private, free mathematics learning platform for the six Algerian BAC specialities. Arabic RTL public site, student workspace and administrator console. No public registration, payments, subscriptions or financial entities.

## Requirements and quick start

Use Node.js 22.12+ and npm, PostgreSQL (Neon recommended), and HTTPS in production. The application also runs locally without provider credentials: the public site works, `/login` explains the missing database configuration, and `/preview` provides explicitly labeled, read-only development fixtures. Preview routes return 404 in production; they never authorize real content, mock a successful upload, or mint fake Zoom credentials.

```sh
npm ci
cp .env.example .env
```

Populate `DATABASE_URL` with your Neon PostgreSQL connection string, including `sslmode=require`. Use a pooled URL for application traffic; run migrations with a direct connection URL if your pooler does not support migration locks. Generate independent secrets with `openssl rand -base64 48` for `AUTH_SECRET` and `CRON_SECRET`. Do not commit `.env` or share these values. Set `AUTH_URL` to the exact origin (for example `http://localhost:3000` during local development).

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run admin:setup
npm run dev
```

Open `http://localhost:3000`. Log in at `/login`; administrators are directed to `/admin`, students to `/dashboard`.

`db:seed` is idempotent. It inserts only the six fixed specialities and initial platform settings, not public accounts, sample students, curriculum assumptions or default passwords. Change the exam countdown date only after the official date is confirmed. The date in the development preview is illustrative.

## Secure initial administrator setup

Run `npm run admin:setup` from a trusted interactive terminal. It prompts for a username and a hidden password of 12–128 characters. Setup is locked if an administrator already exists, with a PostgreSQL advisory lock preventing concurrent initial creation. There is intentionally no public bootstrap HTTP route. For automated deployment only, the script accepts `ADMIN_SETUP_USERNAME` and `ADMIN_SETUP_PASSWORD` supplied securely by the deployment environment. Never put real passwords in shell command history or source files. The script does not print passwords or hashes.

Student accounts are created only by the administrator. The student editor includes all required identity, speciality, status and internal-note fields. Copy generated temporary credentials and deliver them privately. Students must replace their temporary password before they can access content. Password resets invalidate all old sessions and restore the first-login requirement. Password changes invalidate existing sessions and require a fresh login. Account activation, suspension, archival and speciality changes are available in the student editor. Archived accounts are retained, not deleted. Notes are never sent to students.

CSV imports use these headers:

```csv
firstName,lastName,username,specialityId,password,email,phone,status,notes
```

Speciality identifiers: `science`, `math`, `technical`, `economy`, `literature`, `languages`. Usernames use lowercase Latin letters, digits, `_`, `.` or `-`, 3–60 characters. Passwords require at least 12 characters. Maximum 500 rows per import. Import is sequential, validates each row server-side, and reports how many rows were imported before any failure; it is not all-or-nothing. If a password is omitted, a random password is generated; use the individual password-reset action to issue credentials securely. Export omits password hashes, passwords and internal notes and escapes spreadsheet formula prefixes.

## Application workflows

- Public `/`: teacher introduction, six specialities, live/recorded features, FAQ, WhatsApp/contact information and login. Set contact details under administration settings; without them the site explicitly says contact information has not been announced.
- Student `/dashboard`: published lessons, speciality-scoped curriculum, upcoming sessions, progress, announcements, resources and exercises. It never displays invented activity or counts.
- `/dashboard/lessons`: searchable lessons with an embedded private Stream player, resume, speed/volume/fullscreen/provider adaptive quality, progress saving every 15 seconds and on pause/end, completion, chapter navigation and attachments.
- `/dashboard/live` and `/dashboard/schedule`: speciality-scoped sessions. The classroom opens 15 minutes before the scheduled start, remains available during the class and for 60 minutes after its scheduled end, or until cancelled/completed. Only the teacher can join outside this window.
- `/dashboard/exercises`: PDF resources plus text exercises and detailed expandable solutions. Put math between `$...$` or `$$...$$` for KaTeX.
- `/dashboard/exams` and `/dashboard/bac`: timed multiple-choice practice, quizzes and previous BAC examinations. Scores are calculated server-side on a 20-point scale. Submitted attempts are immutable; late submissions receive zero. Students never receive answer keys before submitting. Results are saved per student.
- `/dashboard/notifications`: individual read states and unread counters. Publication/session changes send recipient notifications; administrators can announce to everyone, selected specialities or specific user IDs.
- `/dashboard/settings`: saved light, dark and sage appearances and password change.
- `/admin`: counts, speciality chart, attendance/progress totals, upcoming sessions and an audit trail. Individual student profiles show progress, attendance and examination results.
- `/admin/chapters`, `/admin/lessons`, `/admin/resources`, `/admin/exercises`, `/admin/exams`: create/edit, order where applicable, share with multiple specialities and publish/unpublish. Files are not duplicated for each speciality.
- `/admin/live`: scheduling, editing/rescheduling, cancellation, status changes, list and monthly calendar, embedded teacher classroom and attendance.
- `/admin/videos`: direct private uploads, processing refresh, associated lesson and recording-import job status.
- `/admin/settings`: teacher/contact details, academic year and official exam date, platform brand name, accent-color presets and default appearance. Students can override the default theme privately.

## Zoom configuration guide

Create a Zoom Server-to-Server OAuth application under the teacher's Zoom account. Set:

- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.
- `ZOOM_HOST_USER_ID`: the teacher's Zoom user ID/email authorized to host meetings.
- Scopes allowing meeting creation/read/update/delete, recording read/download and host ZAK token access for that user. Zoom scope names vary between granular and legacy app types; authorize only the equivalent required scopes.

Create/configure a Zoom Meeting SDK application and set `ZOOM_SDK_KEY` and `ZOOM_SDK_SECRET`. Add the deployed domain to the app's SDK allowlist and follow Zoom's app review/authorization requirements for your distribution. Never prefix these secrets with `NEXT_PUBLIC_`. Meeting signatures are generated only after fresh account, role and speciality checks. Teacher joins use role 1 and a server-retrieved ZAK; students use role 0. Students never receive OAuth secrets, SDK secrets or host ZAKs.

The embedded Component View uses `@zoom/meetingsdk/embedded`, not a redirect to the Zoom application. Supported controls (camera, microphone, screen share, chat and fullscreen) come from the SDK and depend on the browser, device, teacher settings and Zoom account. The surrounding UI is Arabic; this pinned SDK's typed Component View locales do not include Arabic, so SDK controls use French. Serve HTTPS and test actual classroom behavior on all target devices; localhost is suitable for local browser media testing. Do not embed the entire application in a third-party frame that denies camera/microphone access.

For recordings, the Zoom host needs a cloud-recording-capable account. Enabling recording in the session editor sets Zoom's cloud auto-recording setting. A recording warning is displayed before joining. Tell students how recordings are used and obtain any required consent, especially for minors. The platform's attendance records are written after the browser SDK reports a successful join, with explicit exits recorded; they are client-confirmed, not independent proof of continued meeting participation. Do not use them as high-stakes verified attendance without adding Zoom participant webhooks/reconciliation.

### Optional automatic recording imports

Enable the Zoom `recording.completed` webhook and use `/api/webhooks/zoom` as the endpoint. Set `ZOOM_WEBHOOK_SECRET` to the event subscription secret. Endpoint validation and delivery require a valid HMAC and timestamp within five minutes. Meeting UUID deduplication is persisted in `WebhookEvent`; payloads are kept server-side, not exposed in the admin UI.

Schedule an external worker/cron to POST `/api/jobs/recordings` with `Authorization: Bearer <CRON_SECRET>` every minute. Also POST `/api/jobs/reminders` with the same authorization every minute to send deduplicated in-app reminders for sessions starting within 30 minutes; rescheduled sessions receive a new reminder keyed to their new start time. The route claims up to five jobs with an optimistic database lease, retrieves recording metadata through authorized Zoom APIs, requests a private Cloudflare Stream copy, polls processing on later runs, and creates an unpublished lesson in an unpublished recordings chapter. Review the chapter/lesson, assign or confirm all intended specialities, then publish. Publishing creates student notifications. Failures retry up to eight times, excluding normal processing polls. Job state and sanitized failures are visible in the video library. Investigate exhausted jobs before resetting their state through a trusted database operation. Never expose this cron token in client code.

Run only one cron schedule; database leases reduce overlap and recover work abandoned for five minutes. External provider copy creation and the local database cannot share a transaction: a process crash immediately after Cloudflare accepts a copy but before the returned UID is saved can leave an orphan copy. Reconcile such rare ambiguous cases in Cloudflare before retrying. Provider account plans, recording download restrictions and URLs need live acceptance testing.

## Cloudflare configuration guide

### Stream

Enable Cloudflare Stream and create a scoped API token for Stream edit/read on the target account. Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` server-side. Upload from the video library. Direct upload requests use `requireSignedURLs: true`, as do imported recordings. Refresh the processing state, then attach the ready video to a lesson. The lesson must be in a published chapter and published for the student's speciality.

On each playback request the server rechecks authorization, then asks Stream for a non-downloadable signed token expiring in one hour. The public Stream UID alone does not grant playback access. Configure allowed origins in Cloudflare for additional protection. Existing signed playback URLs remain valid until their short expiry; immediate revocation of an already issued provider token is not guaranteed. Videos are private, not DRM, and cannot prevent screen capture by authorized viewers.

The simple direct-upload path is appropriate for files within Cloudflare's basic direct-upload limits (commonly 200 MB). Larger/unstable-network uploads need a resumable tus integration before using them in production. The interface displays provider failures instead of falsely reporting success. This application does not provide a resumable uploader.

### R2 documents

Create a private R2 bucket with public access disabled. Configure `R2_ENDPOINT` (your account's S3-compatible endpoint), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`. Grant the credentials read/write access only to the intended bucket. Add CORS allowing the exact application origin, `PUT` and `GET`, and `Content-Type`; do not allow arbitrary production origins. Upload PDF documents (UI limit 50 MB), then copy the returned `documents/<uuid>.pdf` key into a resource record, select specialities and publish.

The server issues five-minute signed upload/download URLs. Students view PDFs in an iframe inside the site, and resource/lesson publication plus speciality access is rechecked before issuing read links. Uploads are administrator-only. Deploy malware scanning/content validation on the storage pipeline if documents can come from untrusted sources; browser MIME checks are not antivirus. Browser-native PDF viewing support varies, particularly on mobile. Signed URLs can be reused within their expiry window.

## Security model

Auth.js credentials authentication, bcrypt cost 12, encrypted JWT cookies, 12-hour sessions and database-backed session-version/status revalidation. No sign-up provider or endpoint. API mutations validate their origin; Auth.js handles its own CSRF flow. Zod validates accepted fields, preventing role/status mass assignment outside the administrator's allowlisted operations. All protected pages and API operations enforce server-side account state and role checks. Published content is selected by speciality; exam answer indexes and private notes are excluded from student data. Document keys and Stream IDs are never treated as authorization.

Login attempts are counted atomically in PostgreSQL by hashed normalized username (10 attempts per 15 minutes, including failed/unknown accounts). This protects accounts across application instances but is not a network abuse control; deploy trusted edge/IP rate limiting and request body limits to resist distributed username floods. Periodically prune expired `RateLimit` rows. Add request body limits (for example 1 MB for JSON routes) at your proxy; media uploads bypass the application server. Never log passwords, provider tokens or signed URLs. Header protections are in `next.config.ts`.

Administrator account/content operations are audited. Configure encrypted database backups, least-privilege provider credentials, data retention and deletion procedures, monitoring and school privacy/consent requirements before inviting real students. The app deliberately does not contain public account recovery, email delivery or financial modules.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm audit
```

Unit tests cover active/inactive/first-login/speciality access, administrator policy, temporary password generation, webhook forgery/replay/tampering, validation and grading. HTTP/database tests are skipped unless both `TEST_DATABASE_URL` and `APP_TEST_URL` are present. To run them, create an isolated PostgreSQL database whose name includes `test`, migrate and seed it, and start the application with that same `DATABASE_URL`, a disposable `AUTH_SECRET` and the matching `AUTH_URL`. Then run:

```sh
TEST_DATABASE_URL="<isolated test database URL>" APP_TEST_URL="http://localhost:3000" npm test
```

Tests create uniquely named fixtures and deliberately leave them in the disposable test database; never target a school production database. They check real credential login, forced password replacement, disabled accounts, admin denial, unpublished/other-speciality denial, persisted progress, administrator creation, session revocation, origin validation and durable login throttling. Provider calls require a separate credentialed acceptance test; unit/HTTP tests do not assert that real Zoom or Cloudflare accounts are configured.

For desktop/tablet/mobile browser smoke checks, run `npm run test:browser` against the development server. It launches a fresh headless Chrome profile, checks RTL, six specialities, navigation, password visibility and horizontal overflow at 390/768/1440 px, and writes screenshots to the system temporary directory. The default executable is the standard macOS Google Chrome installation; set `CHROME_EXECUTABLE` to your Chrome/Chromium binary elsewhere. Set `APP_TEST_URL` to change the server origin. The browser smoke check uses the development-only `/preview`, so do not run that particular check against production.

## Deployment instructions

1. Provision Neon PostgreSQL, configure connection pooling appropriately and run the committed migration against the intended production database.
2. Deploy to a Next.js-compatible Node host (Vercel or a Node server) with Node 22.12+, `npm ci`, `npm run build`, and `npm start` when self-hosting. Do not deploy this as a static export or to Cloudflare Pages static hosting.
3. Set production `AUTH_URL` to the canonical HTTPS origin, configure a strong `AUTH_SECRET`, database/provider environment variables and a separate `CRON_SECRET`. Do not reuse development secrets. Configure your trusted reverse proxy/host forwarding consistently with that origin. No production auth bypass is provided.
4. Seed six specialities and run initial administrator setup from a trusted environment with production database access. Keep the setup credentials out of build logs.
5. Configure Zoom SDK domains/webhooks, R2 CORS/private access, Stream origins and the authenticated recording worker schedule. Check host request timeouts against external API latency and monitor failed jobs.
6. Set teacher/contact details, confirm the academic year/date, create the real chapters, upload media, verify ready states and publication, then issue one test student account per speciality.
7. Smoke-test first-login password change, suspension, all six content scopes, embedded teacher/student Zoom joins, a real recording import, signed playback and R2 PDF access on desktop/tablet/mobile before going live.

## Architecture

- `src/app`: App Router public/student/admin pages, protected mutation endpoints, Auth.js handler, provider uploads, verified Zoom webhook and scheduled worker.
- `src/lib`: Prisma singleton, centralized authentication/access policy, Zod schemas, security helpers and provider adapters.
- `src/components`: Arabic RTL shell, dashboards, Radix/shadcn-style Button, forms, media/classroom players, calendar, analytics and interactive exam controls.
- `prisma`: PostgreSQL schema, committed SQL migration and idempotent six-speciality seed.
- `scripts/setup-admin.ts`: trusted one-time administrator bootstrap.
- `tests`: policy tests and opt-in real HTTP/PostgreSQL workflow tests.

Prisma is pinned to the audited 6.12 line because newer 6.x configuration dependencies were flagged by the package audit available during development; no security policy was disabled to install it. Dependencies and runtime requirements should be re-audited before deployment. Do not assume a successful local build validates external provider plans, SDK distribution approval, browser support or production privacy compliance.
