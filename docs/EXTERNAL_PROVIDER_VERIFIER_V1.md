# External Provider Verifier v1

This slice adds cryptographic JWT verification for the adult-owned cloud identity preview boundary.

## Runtime contract

The Worker may use an external OpenID/OAuth provider only when all of these deployment variables are configured:

- `KVS_AUTH_ISSUER`
- `KVS_AUTH_AUDIENCE`
- `KVS_AUTH_JWKS_URL` (HTTPS only)
- optional `KVS_AUTH_ALLOWED_ALGORITHMS` (v1 accepts only `RS256`)

No provider is enabled by repository defaults. Missing verifier configuration remains fail-closed.

## Security controls

- compact JWT format required
- maximum token size bounded
- `alg=none` rejected
- v1 algorithm allow-list restricted to RS256
- `kid` required and bounded
- HTTPS JWKS URL required
- bounded JWKS set size
- bounded JWKS cache TTL
- unknown `kid` forces one refresh to support key rotation
- duplicate matching key IDs rejected
- RSA signing-use and algorithm consistency checked
- signature validated with Web Crypto before claims are trusted
- issuer, audience, subject, expiry and not-before enforced by the adult-auth boundary
- future-issued tokens outside the 60-second clock-skew allowance are rejected
- learner account types are rejected
- teacher/school-admin identities require tenant context

## Explicit non-goals in v1

This slice does not enable database persistence, child login, real learner cloud data, unrestricted chat, remote teacher monitoring, refresh-token storage, or browser-to-database access.

Replay detection requiring durable `jti` state is not claimed in this slice. Signed bearer tokens remain bounded by provider expiry and claim checks; durable one-time-token/revocation state must be implemented before claiming replay prevention.

## Release rule

The exact PR head must pass parity, production seed/full release contract, Lighthouse and Playwright before merge. After merge, exact-main Deploy, Lighthouse and Playwright must pass before this slice is called production-verified.
