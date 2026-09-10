# Session Revocation & Replay Defense Boundary v1

## Purpose

This preview-only boundary closes a known gap between cryptographic token verification and stateful authorization. A correctly signed token is not sufficient by itself for sensitive KirthiVerse operations: the server must also confirm trusted session state and, for one-time high-risk operations, atomically consume a replay key.

## Guarantees

- Session state is resolved only through a trusted server-side resolver.
- Revoked or inactive sessions fail closed.
- Actor and token identifiers returned by trusted state must exactly match the authenticated context.
- Expired tokens and materially future-issued tokens are rejected.
- One-time security operations require an atomic replay-store consume operation.
- A second use of the same actor + token + purpose tuple is rejected as a replay.
- Missing or unavailable session/replay stores fail closed.

## Explicit non-claims

This slice does **not** claim universal replay prevention for every ordinary JWT request. General bearer-token replay prevention requires a durable server-side session/revocation design and, where appropriate, proof-of-possession or request-level anti-replay mechanisms. This PR establishes the authorization contract and deterministic behavior only.

## Intended composition

Future sensitive learner-cloud operations should compose boundaries in this order:

1. external provider signature verification,
2. trusted KirthiVerse adult actor resolution,
3. trusted session/revocation validation,
4. guardian/learner relationship or school tenant authorization,
5. purpose-specific guardian consent where required,
6. encryption and ciphertext-only persistence boundary,
7. atomic replay consume for one-time high-risk mutations,
8. durable audit event.

## Still disabled

No live session store, replay store, production identity provider, live Aiven persistence, real child cloud data, remote teacher monitoring, or unrestricted child chat is enabled by this slice.
