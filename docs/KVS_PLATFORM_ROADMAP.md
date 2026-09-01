# KirthiVerse Platform Roadmap

## Product objective

Evolve KirthiVerse from a local-first learning website into a child-safe, premium learning platform with separate Student, Parent, School and Tutor experiences while preserving the current offline/local mode.

## Account strategy

### Guest learner
- No account required.
- Progress remains on the current browser/device.
- Export/import remains available.
- No cloud synchronisation.

### Family account
- Parent or guardian creates the account.
- Parent creates and manages child profiles.
- Child uses a nickname/avatar and age band rather than public identity fields.
- Progress synchronises across approved devices.
- Parent can view progress, goals, reports and data controls.

### School account
- School administrator manages organisation settings.
- Teachers manage classes and assignments.
- Students join using school-issued codes or managed SSO.
- School and teacher access is role-based and auditable.
- Student data is separated by tenant/school.

### Tutor account
- Tutor manages assigned learners only.
- Parent/school approval is required before access.
- Access is revocable and logged.

## Minimum data model

### Adult account
- account_id
- email
- verified_at
- role
- locale
- security settings

### Child profile
- child_profile_id
- parent_or_school_owner_id
- nickname
- avatar_id
- age_band
- learning_level
- preferred_language
- accessibility preferences
- created_at

Do not require a child's full legal name, precise date of birth, phone number, personal email, location or photograph for normal learning.

### Learning records
- lesson completion
- quiz attempt and score
- mastery state
- XP and achievements
- streak events
- bookmarks
- assignment status
- timestamps and source device

## Authentication and security

- Adult email verification.
- Passkeys or MFA for adults and school administrators.
- Child-friendly PIN or school code only after adult/school provisioning.
- Secure session cookies; never store long-lived auth tokens in localStorage.
- Role-based and tenant-scoped authorisation on every API request.
- Rate limiting, abuse protection and bot controls.
- Encryption in transit and at rest.
- Audit logs for adult, teacher and administrator actions.
- Backup, recovery, incident-response and key-rotation procedures.
- Dependency scanning, secret scanning, SAST and production monitoring.

## Privacy and child safety principles

- Best interests of the child first.
- High-privacy defaults.
- Data minimisation and purpose limitation.
- No behavioural advertising.
- No sale of child data.
- Geolocation disabled and not collected by default.
- No open chat, direct messaging or public child profiles in the initial releases.
- No public global leaderboards using child identity.
- Clear child-readable and adult-readable privacy notices.
- Parent/school data access, correction, export and deletion controls.
- Defined retention periods and automatic deletion workflows.
- DPIA and records of processing before cloud child accounts launch.

## Compliance workstreams

The platform must not claim worldwide legal compliance from code alone. Before each market launch, complete a documented legal and privacy review covering at least:

- UK GDPR, Data Protection Act and ICO Children's Code.
- EU GDPR and applicable national child-consent rules.
- US COPPA and relevant state privacy/education laws.
- FERPA/PPRA analysis where schools provide education records.
- Contractual school data-processing terms.
- Accessibility review against WCAG 2.2 AA.
- Cookie/ePrivacy rules by deployment jurisdiction.
- Data residency, international transfer and sub-processor review.

## Release plan

### KVS-PLATFORM-001 — Premium learner experience
- Cinematic, age-appropriate visual shell.
- Original KirthiVerse characters and subject worlds.
- Rich onboarding, Today view and clear progression map.
- Audio, motion and reduced-motion alternatives.
- Improved lesson interactions and celebrations.
- Full mobile/tablet/desktop QA.
- No new personal-data collection.

### KVS-PLATFORM-002 — Identity foundation
- Cloudflare-based API gateway and authentication service.
- Adult accounts, email verification, passkeys/MFA.
- Guest-to-account migration.
- Child profiles created only by verified adults/schools.
- Secure session and consent records.
- Account/data deletion endpoints.

### KVS-PLATFORM-003 — Family console
- Parent dashboard.
- Multiple child profiles.
- Device approvals.
- Goals, reports, export and deletion.
- Parent-controlled tutor access.

### KVS-PLATFORM-004 — School and tutor console
- Multi-tenant schools.
- Admin, teacher, tutor and learner roles.
- Class rosters, join codes, assignments and reports.
- Tenant isolation and audit logs.
- CSV import/export with strict validation.

### KVS-PLATFORM-005 — Safe competition
- Private class/family competitions.
- Daily time caps and wellbeing controls.
- Pseudonymous display names.
- No public child discovery or direct messaging.
- Moderation and safeguarding controls.

### KVS-PLATFORM-006 — Compliance and production hardening
- DPIA, RoPA, retention schedule and sub-processor register.
- Child/adult privacy notices and consent flows.
- Security testing and penetration test.
- Accessibility audit.
- Incident-response exercises.
- Production SLOs, monitoring and disaster recovery.

## Production gates

A release cannot be marked production-ready unless:

- Type-check, lint, build and dist validation pass.
- Unit, integration and end-to-end tests pass.
- Authorisation and tenant-isolation tests pass where applicable.
- No high/critical security findings remain.
- Accessibility and responsive checks pass.
- Privacy and legal review for the target market is recorded.
- Rollback and data-recovery procedures are verified.
- Live smoke tests pass after deployment.
