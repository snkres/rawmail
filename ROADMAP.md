Roadmap — implementation status

## Tier 0 — Deployment modes (DONE ✅)

**Deployment modes** — `IS_SAAS` flag implemented. **SaaS mode**: rawmail.sh branding, Google OAuth, Polar.sh billing. **Self-hosted mode**: custom domain (`APP_DOMAIN`), SSO (Google-HD or OIDC), first-run MX wizard, all Teams features unlocked.

---

## Core implementation — completed features

| # | Item | Status |
|---|------|--------|
| R1 | Post-login flow | ✅ DONE |
| R2 | Org creation UI | ✅ DONE |
| R3 | Org dashboard redesign | ✅ DONE |
| R4 | Session-aware inbox page | ✅ DONE |
| R5 | Custom domain UI | ✅ DONE |
| R6 | Category management UI | ✅ DONE |
| R7 | Member management UI | ✅ DONE |
| R8 | Billing / upgrade UI | ✅ DONE — now using [Polar.sh](https://polar.sh) instead of Stripe |
| R9 | SSO domain setting | ✅ DONE |
| R11 | Error pages | ✅ DONE |
| R12 | Rate limiting tuning | ✅ DONE |
| R13 | @rawmail/sdk publish | ✅ DONE |
| R14 | docker compose hardening | ✅ DONE |
| R15 | Inbox search / filter | ✅ DONE |

**Billing migration note**: Billing now uses Polar.sh. Required environment variables: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`, `POLAR_TEAMS_PRODUCT_ID`.

---

## Outstanding items

| # | Item | What's needed |
|---|------|---------------|
| R10 | Attachment storage | Currently only a path string is stored — no actual file is saved. Need S3/MinIO or local volume mount |
| R16 | Webhook delivery | POST to a user-configured URL on new message (removed from scope earlier, worth revisiting) |
| R17 | End-to-end tests | Playwright smoke tests: open inbox → send email via swaks → verify message appears |

---

## New items discovered during implementation

| # | Item | What's needed |
|---|------|---------------|
| R18 | Member invite API | `POST /v1/orgs/:slug/members/invite` endpoint + email delivery not yet implemented. UI shows graceful "coming soon" message |
| R19 | OIDC full integration | Test `@polar-sh/better-auth` and `genericOAuth` better-auth plugin; may require version bump of better-auth |
| R20 | Attachment storage | `storagePath` field exists in DB but no S3/MinIO upload; attachments are metadata-only |
| R21 | Domains `createdAt` column | Domains table lacks a `createdAt` column; list is unordered |