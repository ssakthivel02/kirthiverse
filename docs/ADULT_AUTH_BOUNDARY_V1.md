# Adult Authentication Boundary v1

This slice establishes a fail-closed adult authentication and authorization boundary for the KirthiVerse cloud-identity preview API.

## Guarantees

- External identity tokens must be cryptographically verified by an injected verifier before claims are trusted.
- Issuer, audience, subject, expiry and optional not-before constraints are validated after signature verification.
- Only adult-owned identities are accepted.
- Allowed roles are `guardian`, `teacher`, `school_admin` and `platform_admin`.
- Teacher and school-admin contexts require an explicit tenant identifier.
- Authorization is deny-by-default through `requireRole`.
- Raw bearer tokens, passwords, learner emails and learner passwords are never persisted or returned.
- The normalized request context contains only subject, role, tenant, issuer and authentication time.
- No database persistence is introduced by this slice.
- No learner direct login, open child chat, remote teacher monitoring or real learner sync is enabled.

## Fail-closed deployment state

The Worker currently has no production external-provider verifier adapter. Therefore protected identity routes return an authentication configuration error rather than accepting an unsigned or unverified token. A provider adapter must be added as a later gated slice and must verify signatures against trusted provider keys before calling the claim-validation boundary.

## Required configuration for a future provider adapter

- `KVS_AUTH_ISSUER`
- `KVS_AUTH_AUDIENCE`
- trusted provider key/JWKS configuration held server-side only

Browser code must never receive verifier secrets, database credentials or raw service credentials.
