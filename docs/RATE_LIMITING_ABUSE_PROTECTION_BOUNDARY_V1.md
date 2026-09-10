# Rate Limiting & Abuse Protection Boundary v1

## Status

Security preview only. This boundary defines deterministic enforcement semantics for the KirthiVerse cloud-identity preview. It does **not** claim that Cloudflare Rate Limiting, KV, Durable Objects, D1, Aiven, or any other live limiter backend is configured or active.

Real child cloud data and direct child cloud authentication remain forbidden.

## Security objectives

The boundary protects authenticated and public API surfaces from bursts, repeated security-sensitive operations, and backend abuse while preserving the existing adult-owned identity, tenant, consent, session, encryption, audit, and data-lifecycle boundaries.

Rate-limit decisions are server-side. Browser/client hints cannot set quotas, trusted network identity, or bypasses. Network identity is accepted only from a trusted edge adapter and is converted into a salted SHA-256 opaque limiter key. Raw IP addresses, email addresses, child names, bearer tokens, and other PII/secrets must not be used as limiter keys or audit metadata.

## Preview policies

| Policy | Capacity / refill | Identity | Backend failure |
| --- | --- | --- | --- |
| `auth_login` | 5 / 5 minutes | trusted network | fail closed |
| `dsr_sensitive` | 3 / hour | trusted adult actor | fail closed |
| `learner_sync` | 60 / minute | trusted adult actor | fail closed |
| `public_read` | 120 / minute | trusted network | fail open, explicitly degraded |
| `admin_sensitive` | 10 / minute | trusted adult actor | fail closed |

These values are preview product-policy defaults, not legal, regulatory, contractual, or production-capacity determinations.

## Algorithm

The contract uses a token bucket with discrete refill. A trusted atomic backend must consume against the opaque key. The boundary itself does not claim distributed atomic persistence. The test harness supplies a deterministic in-memory adapter only to verify semantics.

A denied request returns HTTP-equivalent status `429` and a bounded `Retry-After` value. The maximum represented retry interval is one hour.

## Trusted network context

`Forwarded`, `X-Forwarded-For`, browser-supplied IP/network IDs, and similar request fields are not accepted as trusted network identity by this module. A future Worker integration must derive a bounded opaque `networkId` from trusted Cloudflare runtime context in a separately reviewed adapter. The boundary deliberately makes no claim that such a production adapter is active today.

## Failure policy

Security-sensitive and authenticated-write policies fail closed when the limiter backend is absent, malformed, or unavailable. The public-read policy may fail open only in an explicitly marked degraded state so a limiter outage does not automatically become a public read outage. This exception does not apply to login, DSR, learner sync, or security-sensitive administration.

There is no platform-admin global bypass.

## Audit integration

Authenticated denied decisions for `dsr_sensitive`, `learner_sync`, and `admin_sensitive` require the existing mandatory trusted audit sink and emit the allow-listed action `rate_limit.denied` with only bounded non-sensitive metadata: policy ID and retry interval.

Pre-authentication login throttling intentionally does not invent an authenticated actor for the audit chain. A future edge/security telemetry integration may record pre-auth network abuse separately, but it must not fabricate a KirthiVerse actor identity.

## Automated validation

`scripts/validate-rate-limiting-abuse-boundary.mjs` verifies:

- burst allowance followed by denial;
- refill/window rollover behavior;
- actor and trusted-network isolation;
- opaque hashed keys without raw identities;
- rejection of client network spoof hints;
- fail-closed behavior for sensitive missing backends;
- explicit fail-open-degraded public-read behavior;
- mandatory audit on authenticated throttling;
- mandatory audit sink failure behavior;
- rapid duplicate/learner-sync throttling;
- bounded `Retry-After` headers;
- non-production contract flags.

The validator uses synthetic identifiers only.

## Integration boundary

This v1 module is not wired into live Worker routing. That is intentional: enabling enforcement requires a reviewed atomic limiter backend, trusted-edge network adapter, operational thresholds, observability, and deployment evidence. Wiring it into `index.mjs` before those dependencies exist would turn a preview contract into an unsafe production claim.

## Remaining production blockers

- approve production rate/burst values from measured traffic and threat modelling;
- implement a trusted Cloudflare edge-network identity adapter without trusting browser forwarding headers;
- select and configure an atomic distributed limiter backend;
- define production outage/fallback operational procedures;
- add pre-auth security telemetry that does not fabricate authenticated actors;
- integrate per-route enforcement and response headers;
- validate concurrency, multi-region behavior, clock behavior, and backend failure modes under load;
- verify audit durability/checkpointing for authenticated deny events;
- complete end-to-end production security and privacy review.
