# KirthiVerse Audit Integrity Hardening v1

Status: preview-only security hardening. This extends the already-merged tamper-resistant audit boundary; it does not replace or duplicate it.

## Objective

Add keyed integrity and atomic append semantics to the existing KirthiVerse audit security model before durable learner-cloud persistence is enabled.

## Preserved controls

The existing PR #42 audit contract remains authoritative for:

- allow-listed security actions and roles,
- trusted actor/role/tenant anti-spoofing,
- opaque KirthiVerse identifiers,
- bounded/redacted metadata,
- deterministic canonicalization,
- previous-event hash chaining,
- fail-closed mandatory audit sink behavior.

## Added hardening

- HMAC-SHA-256 integrity over the canonical existing audit event.
- Explicit integrity key versioning.
- Trusted server-side integrity-key resolver only.
- Fail-closed missing/invalid key resolver or key handling.
- Trusted audit-head resolver requirement.
- Atomic compare-and-append writer contract.
- Explicit append-conflict rejection.
- Deterministic tamper verification tests.
- Existing role/action/tenant/redaction rules are reused rather than reimplemented.

## Non-claims

This change does not claim a durable immutable audit store, compliance certification, non-repudiation, production KMS/HSM custody, or production audit persistence.

## Still disabled

- Live Aiven MySQL audit writes.
- Production HMAC/KMS/HSM secrets.
- Real learner/child cloud data.
- Browser-side signing keys.
- Direct child cloud authentication.
- Remote teacher monitoring.

Future durable persistence must implement the compare-and-append operation atomically inside a trusted server-side datastore boundary and must use approved production key custody/rotation controls.
