# KirthiVerse Retention / Deletion / Export Enforcement Boundary v1

Status: **security preview only**. This boundary is synthetic and does not enable live persistence, live deletion, live export, real child cloud data, or direct child cloud authentication.

## Purpose

This boundary defines deterministic server-side controls for future data-subject export and deletion workflows while preserving the existing adult-owned identity, guardian authorization, tenant isolation, encryption, session, and tamper-evident audit boundaries.

It is deliberately fail-closed. Client flags cannot grant authorization or bypass guardian linkage, legal hold, active dependencies, encryption controls, or mandatory security auditing.

## Authorization model

- Learner export and deletion requests require an authenticated `guardian` actor plus an **active trusted guardian-to-learner link** resolved server-side.
- Teachers and school administrators cannot use this boundary to export or delete learner data.
- `platform_admin` has **no implicit cross-subject bypass**.
- Adult-account requests are self-service only: the authenticated adult actor ID must exactly match the target adult account ID.
- Direct child cloud login remains forbidden.
- Browser-to-database access remains forbidden.

## Retention policy model

The preview policy contains explicit product-policy windows so behavior is deterministic and testable. These values are **not a legal determination or legal advice** and must be reviewed against applicable jurisdiction, contractual obligations, safeguarding requirements, and approved KirthiVerse governance before production activation.

| Record class | Active lifecycle | Post-deletion preview window |
| --- | --- | ---: |
| `adult_private_contact` | retain while active | 30 days |
| `learner_profile` | retain while active | 30 days |
| `learner_progress` | retain while active | 30 days |
| `guardian_learner_link` | retain while active | 30 days |
| `consent_ledger` | retain while active | 730 days |
| `data_subject_request` | 730 days | 730 days |
| `security_audit` | 365 days | 365 days |

Retention expiry produces only `eligible_for_reviewed_deletion`. It does **not** perform deletion. A legal hold always returns `retain` regardless of elapsed time.

## Deletion controls

A deletion authorization requires all of the following:

1. trusted adult actor context;
2. target authorization (adult self-service or active guardian-to-learner link);
3. trusted deletion-constraint resolver available and successful;
4. no legal hold;
5. no active dependency that prevents safe deletion;
6. mandatory audit sink available and successful.

Deletion remains disabled after authorization. A future persistence adapter must separately implement reviewed execution, referential cleanup, cryptographic/key handling, backups, tombstones where approved, and post-delete verification.

## Export controls

Sensitive export material may only be decrypted through the existing trusted server encryption boundary. `materializeTrustedExportField()` rejects calls that are not explicitly marked as trusted-server execution and delegates AES-256-GCM envelope verification/context binding/key resolution to `crypto-boundary.mjs`.

The browser is not permitted to hold persistence encryption keys or directly decrypt stored sensitive records.

## Request state machine

Allowed lifecycle transitions are monotonic:

- `received` → `verified` or `rejected`
- `verified` → `processing` or `rejected`
- `processing` → `completed` or `rejected`
- `completed` and `rejected` are terminal

Repeating the current state is idempotent. Skipping forward or moving backward fails with `409`.

## Audit requirements

Lifecycle operations use the tamper-evident audit boundary introduced in PR #42. The allow-list now includes:

- `export.requested`
- `export.allowed`
- `export.denied`
- `export.completed`
- `deletion.requested`
- `deletion.allowed`
- `deletion.denied`
- `deletion.completed`

Requested, authorization decision, and completion records use distinct event IDs. The sink is mandatory; absence or failure blocks the security-sensitive operation.

The existing audit non-claims remain unchanged: this is not blockchain, not non-repudiation, and not externally immutable. Live audit persistence is still disabled.

## Preview SQL reconciliation

`database/kirthiverse-preview/001_cloud_identity_preview.sql` already contains `data_subject_requests` with `export`, `delete`, and `correct` request types and the lifecycle states `received`, `verified`, `processing`, `completed`, and `rejected`. This PR does not claim that schema has been applied to Aiven or any other database.

The code boundary intentionally implements only `export` and `delete`; `correct` remains outside this security slice.

## Automated validation

`scripts/validate-data-lifecycle-boundary.mjs` covers:

- active/post-deletion retention behavior;
- legal-hold precedence;
- state-transition idempotency and invalid replay/backtracking;
- active, revoked, and mismatched guardian links;
- teacher and platform-admin learner-data bypass rejection;
- adult self-service equality;
- active-dependency blocking;
- client bypass-hint rejection;
- missing deletion resolver and missing audit sink fail-closed behavior;
- trusted-server-only decryption and encryption-context mismatch rejection;
- completion audit enforcement;
- preview/non-production contract assertions.

The validator is included in `pnpm run check`. Existing validation, accessibility, Lighthouse, Playwright, build, lint, type-check, and release thresholds are not weakened.

## Production blockers that remain

Before any live data-subject operation, KirthiVerse still requires approved legal/governance retention policy, restricted production persistence networking, production secrets/KMS, controlled persistence adapters, backup/deletion semantics, verified audit durability/checkpointing, operational authorization procedures, and end-to-end production security validation.

Until those gates are complete, **real child cloud data remains forbidden**.