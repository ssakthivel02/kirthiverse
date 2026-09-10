# Production Secrets & Configuration Boundary v1

## Status

Security architecture boundary only. This slice defines how KirthiVerse server-side configuration and secrets must be validated and represented. It does **not** claim that production secrets, Cloudflare secrets, a managed secrets store, KMS/HSM, live database credentials, or production key material have been provisioned.

Real child cloud data and direct child cloud authentication remain forbidden.

## Objectives

- keep all secret material server-side;
- distinguish preview, staging, and production environments;
- reject client-controlled configuration or bypass hints;
- fail closed when security-sensitive production configuration is incomplete;
- reject obvious placeholder/default production secrets;
- keep key version identifiers separate from key material;
- prevent browser-side database credentials;
- provide deterministic redaction for logs, audit metadata, and error context;
- avoid exposing secret values through normalized configuration objects.

## Existing configuration reconciled

The existing Worker already uses non-secret `[vars]` for `KVS_CLOUD_IDENTITY_PREVIEW` and `KVS_ALLOWED_ORIGINS`, and existing auth code reads `KVS_AUTH_JWKS_URL`, `KVS_AUTH_ISSUER`, and `KVS_AUTH_AUDIENCE` from trusted Worker environment input. This boundary does not duplicate those modules; it validates the configuration contract around them.

## Environment model

Allowed runtime environments are exactly:

- `preview`
- `staging`
- `production`

Production rejects cloud-identity preview mode. Preview remains the default for this repository slice.

## Public configuration vs secrets

Public/non-secret configuration may include release flags, allowed origins, issuer identifiers, JWKS URLs, audience identifiers, and key version references.

Secret material includes encryption key material, database credentials/URLs, passwords, private tokens, and rate-limit salts. Secret material must never be put into a browser bundle, public Worker `[vars]`, status payload, audit metadata, or ordinary logs.

## Production requirements

The validator requires production configuration to provide a complete external-auth tuple, an encryption key version plus key material, and a rate-limit salt. These checks validate presence and structure only; they do not prove that any value came from a managed secret store or KMS.

Obvious placeholder/default secret values are rejected in production. Synthetic values used by the automated validator are test-only and do not represent provisioned production secrets.

## Client override boundary

Client input cannot select the server environment, set secret material, inject database credentials, override authentication issuer/audience/JWKS configuration, or supply the rate-limit salt.

## Redaction

`redactConfigObject()` recursively redacts configuration fields classified as secrets and bearer/JWT-like values before they can be emitted into diagnostics. This is a defensive boundary, not a substitute for never logging raw request credentials.

## Key rotation readiness

The boundary models `KVS_ENCRYPTION_KEY_VERSION` separately from `KVS_ENCRYPTION_KEY_MATERIAL`. This preserves the versioned-key architecture introduced by the encryption boundary and enables future trusted resolver/KMS integration without putting key material into public configuration.

## Persistence boundary

A server-side `KVS_DATABASE_URL` may be detected as configured, but the normalized result never returns its value and continues to declare browser-direct database access forbidden. No Aiven credentials are introduced by this slice and no live persistence is enabled.

## Automated validation

`scripts/validate-production-secrets-configuration-boundary.mjs` verifies trusted-server-only evaluation, environment validation, client override rejection, HTTPS-only JWKS/origin configuration, incomplete auth rejection, key-version requirements, fail-closed production requirements, placeholder-secret rejection, non-disclosure of key material, recursive redaction, and explicit non-production claims.

## Explicit non-claims

- no live Cloudflare secret provisioning;
- no live KMS/HSM integration;
- no live secrets manager;
- no live production database credential;
- no production encryption key material;
- no live Worker route integration required by this boundary;
- no production-ready cloud identity claim;
- no real learner/child cloud persistence.

## Remaining production blockers

Before production cloud identity can be considered, KirthiVerse still requires reviewed secret provisioning and rotation procedures, trusted key resolver/KMS integration, restricted database networking, controlled persistence, operational recovery procedures, security telemetry, and an end-to-end security/privacy release gate with evidence from the exact deployed commit.
