# KirthiVerse Platform Execution Plan

## Objective
Deliver KVS-PLATFORM-001 through KVS-PLATFORM-006 as controlled, evidence-based releases while keeping the current production site stable.

## Delivery policy
- One release branch and pull request at a time.
- No direct feature pushes to `main`.
- No cloud child-data collection before Identity Foundation and privacy gates are complete.
- Guest mode remains available throughout.
- Every release requires type-check, lint, build, dist validation, automated tests, accessibility checks and production smoke testing.
- No release may claim worldwide compliance; market readiness requires recorded legal review.

## Release sequence

### KVS-PLATFORM-001 — Premium learner experience
Branch: `feature/kvs-platform-001-premium-experience`

Deliver:
- Original KirthiVerse visual identity and subject-world system.
- Premium homepage, learner onboarding and Today journey.
- Mobile-first navigation and responsive shell.
- Rich lesson, quiz, achievement and progress interactions.
- Reduced-motion, larger-text and keyboard support.
- Playwright E2E and visual regression coverage.

Gate: no new cloud personal-data collection.

### KVS-PLATFORM-002 — Identity foundation
Branch: `feature/kvs-platform-002-identity-foundation`

Deliver:
- Verified adult accounts.
- Secure cookie-based sessions.
- Passkeys/MFA-ready architecture.
- Guest-to-account progress migration.
- Adult-controlled child profiles.
- Consent, export and deletion APIs.

Gate: DPIA draft, threat model, retention draft and security review.

### KVS-PLATFORM-003 — Family console
Branch: `feature/kvs-platform-003-family-console`

Deliver:
- Multiple child profiles.
- Parent dashboard, goals and reports.
- Approved-device management.
- Parent-controlled tutor delegation.
- Data export, correction and deletion controls.

Gate: verified parent authorisation and cross-profile isolation tests.

### KVS-PLATFORM-004 — School and tutor console
Branch: `feature/kvs-platform-004-school-tutor-console`

Deliver:
- Multi-tenant school model.
- Admin, teacher, tutor and learner roles.
- Classes, join codes, assignments and progress reports.
- Tenant-scoped authorisation and audit logs.
- Strict CSV import/export validation.

Gate: tenant-isolation, role-escalation and audit-integrity tests.

### KVS-PLATFORM-005 — Safe competition
Branch: `feature/kvs-platform-005-safe-competition`

Deliver:
- Private family/class/school competitions.
- Pseudonymous display names.
- Daily limits and wellbeing controls.
- Moderation, safeguarding and abuse-reporting controls.
- No public child discovery, direct messaging or open global leaderboard.

Gate: safeguarding review and misuse-case testing.

### KVS-PLATFORM-006 — Compliance and production hardening
Branch: `feature/kvs-platform-006-compliance-hardening`

Deliver:
- DPIA, RoPA, retention schedule and sub-processor register.
- Child-readable and adult-readable privacy notices.
- Security, accessibility and penetration testing.
- Monitoring, SLOs, incident response, backup and disaster recovery.
- Market launch checklist for UK first, followed by separately reviewed jurisdictions.

Gate: no high/critical security findings and recorded legal/privacy approval.

## Cross-release quality gates
1. Reproducible frozen-lockfile installation.
2. TypeScript, lint and production build pass.
3. Unit, integration and E2E tests pass.
4. Keyboard, screen-reader, reduced-motion and 320px responsive checks pass.
5. No unsupported claims, fake users or fabricated metrics.
6. No secrets in source or client bundles.
7. Rollback procedure verified before merge.
8. GitHub Actions green before merge.
9. Production smoke tests recorded after deployment.

## Immediate execution
Start KVS-PLATFORM-001 only. Releases 002–006 are tracked and designed now, but implementation begins only after the preceding release passes its production gates.