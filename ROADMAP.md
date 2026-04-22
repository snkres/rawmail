Roadmap — what remains
Tier 1 — Core gaps (blocking usable product)
#	Item	What's needed
R1	Post-login flow	After Google OAuth the user lands at / with no indication they're logged in to a workspace. Need a /dashboard or /org/new page that appears when useSession() has a user but no org
R2	Org creation UI	No page to create an org. Need a /org/new form (name + slug) that calls POST /v1/orgs
R3	Org dashboard redesign	/org/[slug]/page.tsx still uses the old dark theme — needs the white/yellow design + tabs for Inboxes / Members / Domains / Settings
R4	Session-aware inbox page	Currently the inbox page has no concept of a logged-in user. If the user owns an org inbox, the token should come from their session, not localStorage
Tier 2 — Teams features (needed for the $9.99 plan to mean anything)
#	Item	What's needed
R5	Custom domain UI	Form to add a domain, show MX instructions, poll + display verified status
R6	Category management UI	Tree view of categories, create/rename/delete, assign inbox to category
R7	Member management UI	List members with roles, invite by email, remove, change role
R8	Billing / upgrade UI	"Upgrade to Teams" button → Stripe Checkout. Current plan badge. Manage billing → Stripe Portal
R9	SSO domain setting	In org settings, let the owner set ssoDomain so @penny.co users auto-join
Tier 3 — Quality and completeness
#	Item	What's needed
R10	Attachment storage	Currently only a path string is stored — no actual file is saved. Need S3/MinIO or local volume mount
R11	Error pages	/not-found and error boundaries with the new design
R12	Rate limiting tuning	Current limit is 60 req/min global — claimed inboxes and auth routes need their own tighter limits
R13	@rawmail/sdk publish	packages/sdk/package.json is missing tsup build script and npm publish config
R14	docker compose hardening	Remove obsolete version: '3.9' warning; add restart: unless-stopped to api/web/mail
Tier 4 — Nice to have
#	Item	What's needed
R15	Inbox search / filter	Filter by sender, subject, date range in the message list
R16	Webhook delivery	POST to a user-configured URL on new message (removed from scope earlier, worth revisiting)
R17	End-to-end tests	Playwright smoke tests: open inbox → send email via swaks → verify message appears
The highest-value next step is R1–R2 (post-login flow + org creation) — without those, a signed-in user has nowhere to go.