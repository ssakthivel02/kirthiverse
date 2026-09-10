# Tamper-Resistant Audit & Security Event Boundary v1

## Status

Preview-only security boundary for synthetic data. No live audit persistence, external append-only ledger, KMS/HSM integration, or production child-data processing is enabled by this change.

## Purpose

This boundary standardises security-event recording for the KirthiVerse server/API path while preserving the existing privacy-first and fail-closed architecture. It creates tamper-evident chaining suitable for later controlled persistence without claiming blockchain, external immutability, non-repudiation, or legal-grade evidentiary guarantees.

## Event shape

The canonical event includes opaque identifiers only:

- `eventId`
- `occurredAt`
- `recordedAt`
- `requestId`
- `actorId`
- `actorRole`
- `tenantId`
- `action`
- `targetType`
- `targetId`
- `outcome`
- `reasonCode`
- `correlationId`
- `policyVersion`
- bounded `metadata`
- `previousEventHash`
- `eventHash`

Raw JWTs, provider subjects, bearer tokens, passwords, authorization headers, email addresses, child names, plaintext display names, key material, private keys and secrets are forbidden.

## Allow-listed security actions

v1 accepts only actions already meaningful to the current security architecture:

- `auth.login.allowed`
- `auth.login.denied`
- `guardian.consent.checked`
- `guardian.consent.denied`
- `tenant.access.allowed`
- `tenant.access.denied`
- `sensitive.encrypt`
- `sensitive.decrypt`
- `export.requested`
- `deletion.requested`
- `admin.breakglass.denied`

New actions require an explicit code change and validation update.

## Integrity chain

For each event:

`eventHash = SHA-256(canonicalEventPayload + "|" + previousEventHash)`

The first event uses the fixed all-zero genesis hash. Canonical object keys are sorted recursively before hashing, making identical logical input deterministic. Verification detects field tampering, prior-hash tampering, insertion/reordering and non-genesis chain starts. Tail deletion cannot be proven from an isolated local chain without a separately trusted external head/checkpoint; v1 therefore does not claim external immutability.

## Fail-closed recording

`recordSecurityAuditEvent()` accepts an injected trusted server-side `writeAuditEvent` sink. Mandatory security events deny the operation if the sink is absent, throws, or refuses the write. Optional telemetry may explicitly set `mandatory: false`; this is not permitted as a silent fallback for mandatory security decisions.

Mandatory-event candidates include authentication allow/deny decisions, consent enforcement, tenant authorization decisions, sensitive decrypt operations, export/deletion requests and break-glass denials. Integration into each production operation remains a separate reviewed change; this PR establishes and validates the boundary only.

## Anti-spoofing

When a trusted authorization context is supplied, the audit event must match its `actorId`, `actorRole` and `tenantId`. Caller-supplied tenant or role hints cannot override trusted server context.

## Data minimisation and bounds

Metadata is recursively inspected. Forbidden key names and bearer/JWT-like values are rejected. Metadata depth, total metadata key count and total canonical event size are bounded. Opaque actor/tenant/target identifiers are required.

## Validation

Run:

```sh
pnpm run validate:audit-boundary
```

The deterministic validator covers:

- valid event acceptance
- deterministic hashing
- valid multi-event chain verification
- field tamper detection
- previous-hash tamper detection
- reorder/non-genesis detection
- missing/invalid IDs
- unapproved actions
- role and tenant spoof rejection
- sensitive metadata rejection
- bearer/JWT rejection
- oversized event rejection
- future timestamp rejection
- absent/failing mandatory sink denial
- successful trusted sink recording
- explicit optional telemetry behaviour
- contract claims remaining bounded to preview-only tamper evidence

## Non-goals

This boundary does not enable real child cloud data, direct child login, browser-to-database access, live learner persistence, remote teacher monitoring, unrestricted child chat, production audit storage, blockchain, non-repudiation, or a platform-admin authorization bypass.
