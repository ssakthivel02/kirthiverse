# KirthiVerse Cloud Identity Preview v1

## Purpose

This slice prepares KirthiVerse for optional cloud-backed adult, guardian, teacher and school workflows while preserving the current local-first learner experience. It targets the existing Aiven MySQL database `kirthiverse_preview` only.

The preview contract is intentionally **disabled by default** and does not enable cloud child profiles in production.

## System boundary

Allowed architecture:

`KirthiVerse browser/PWA -> authenticated KirthiVerse API -> kirthiverse_preview`

Disallowed architecture:

`KirthiVerse browser/PWA -> MySQL`

Database credentials, TLS material, encryption keys and privileged queries stay server-side. The browser must never receive MySQL credentials or connection strings.

## Identity model

- Adult identity is owned by an external authentication provider; KirthiVerse stores only a provider identifier hash and account state.
- KirthiVerse does not store raw passwords.
- Learners do not receive independent cloud login credentials in v1.
- A learner profile is owned by an adult guardian account.
- Additional guardian access is represented through an explicit guardian/learner link.
- Teacher and school access is separate from guardian access and must be enforced by RBAC.
- A guardian-approved tutor role is distinct from teacher and school-admin roles.

## Privacy model

The schema deliberately avoids full date of birth, learner email and learner phone fields. Age is represented only by the existing learning age bands.

Sensitive adult contact and learner display-name values are stored only as application-encrypted ciphertext, with a key version. Lookup uses one-way hashes where required. Encryption-key material is not stored in MySQL.

Cloud learner sync defaults to `FALSE` per learner profile. Real child data remains blocked at the product-contract level until every release gate below is complete.

## Preview database domains

The initial MySQL contract contains:

1. `adult_accounts` — external-provider adult identity reference and lifecycle.
2. `adult_private_contacts` — encrypted adult contact data and lookup hash.
3. `learner_profiles` — guardian-owned learner shell with encrypted display name and age band.
4. `guardian_learner_links` — explicit guardian permissions.
5. `teacher_profiles` — teacher capability attached to an adult account.
6. `schools` — tenant root.
7. `school_memberships` — tenant-scoped adult roles.
8. `assignments` — teacher/admin-created learning assignment records.
9. `assignment_targets` — assignment-to-learner relationship.
10. `consent_ledger` — purpose/version-specific guardian consent evidence.
11. `learner_progress_sync` — versioned cloud sync payloads after consent and feature enablement.
12. `audit_events` — security and authorization-relevant activity evidence.
13. `data_subject_requests` — export/delete/correct lifecycle tracking.

## Required production gates

Cloud learner identity or sync must remain disabled until all of the following have evidence:

- adult authentication;
- guardian consent;
- role-based access control;
- school/tenant isolation;
- encryption key management and rotation;
- retention, deletion and export workflows;
- tamper-resistant audit logging;
- restricted database network exposure;
- abuse protection and rate limiting;
- security review and release approval.

## Aiven boundary

The preview target is the existing `kirthiverse_preview` database on the KirthiVerse Aiven MySQL service. No RamaVerse or SaravanAI tables belong in this database.

Before real personal data is permitted, Aiven network access must be restricted from broad internet CIDRs to the final backend runtime path. Until then, this database is suitable only for schema work and synthetic/non-sensitive preview records.

## Deployment sequence

1. Keep the production website local-first.
2. Validate this schema and contract in CI.
3. Implement authenticated server-side API endpoints against `kirthiverse_preview`.
4. Apply migration to preview only.
5. Use synthetic adult/learner/teacher/guardian/school data.
6. Prove RBAC, consent, tenant isolation, export and deletion.
7. Restrict DB network exposure.
8. Run security/release gates.
9. Only then consider enabling guardian-controlled cloud sync for real learners.

## Non-goals of v1

- No direct browser-to-database connection.
- No public child profiles.
- No child social/chat system.
- No public child leaderboard identity.
- No remote teacher monitoring.
- No automatic school-roster ingestion.
- No independent child email/password account.
- No production activation merely because the database exists.
