# KirthiVerse Audit Integrity Boundary v1

Status: preview-only security foundation. No durable audit store is connected by this change.

## Objective

Provide a fail-closed server-side contract for security and privacy audit events before cloud learner persistence is enabled. The boundary is designed so an audit writer cannot silently overwrite prior history and so later changes to an event are detectable.

## Security properties

- HMAC-SHA-256 integrity protection with explicit key version.
- Canonical deterministic event serialization before integrity calculation.
- Hash chaining through `previousHash`.
- Compare-and-append semantics: the writer receives the expected previous hash and must explicitly accept the append.
- Missing audit head resolver, writer, integrity-key resolver or key fails closed.
- Integrity verification detects event or metadata modification.
- Event IDs, actor/target IDs, request IDs, actions and target types are bounded and validated.
- Metadata is size/depth bounded and rejects secret/token/password/contact/plaintext/ciphertext/provider-subject style fields.
- Provider identity subjects are not accepted as public audit actor identifiers; opaque KirthiVerse actor IDs are used.

## Non-claims

This is not yet a tamper-proof or compliance-certified audit system. Durable integrity requires a trusted append-only or append-constrained persistence layer, atomic compare-and-append behavior, controlled key custody/rotation, retention policy, access controls, monitoring and operational evidence.

The contract deliberately reports `durableStoreConnected: false`.

## Expected future composition

Verified external identity -> trusted KirthiVerse actor resolver -> role/relationship/tenant authorization -> purpose-specific guardian consent -> sensitive-data encryption -> authorized persistence -> integrity-protected audit append.

## Still disabled

- Live Aiven MySQL audit writes.
- Production HMAC/KMS secrets.
- Real learner/child cloud data.
- Browser-side audit signing keys.
- Child direct login.
- Remote teacher monitoring.
- Unrestricted child chat.

## Validation

`scripts/validate-audit-integrity-boundary.mjs` covers valid signing/verification, tamper detection, forbidden sensitive metadata, missing key resolver/key, chained append behavior, write conflicts, and missing head/writer dependencies.
