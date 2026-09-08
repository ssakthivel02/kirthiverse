# Trusted Application Role Resolver v1

## Purpose

This slice separates external identity proof from KirthiVerse authorization. A trusted external identity provider may prove who an adult is, but it must not directly grant KirthiVerse roles or school tenancy through token claims.

## Security model

The request path is:

1. Parse bearer token.
2. Cryptographically verify the JWT using the configured JWKS verifier.
3. Validate issuer, audience, subject, expiry, not-before and issued-at constraints.
4. Pass only the verified provider subject, provider issuer and authentication time to a trusted KirthiVerse actor resolver.
5. Resolve an application-controlled opaque `actorId`, adult account type, role and optional tenant.
6. Validate the resolved actor against KirthiVerse policy.
7. Authorize the request by the resolved application role.

Provider claims such as `kvs_role`, `kvs_tenant_id` or `kvs_account_type` have no authorization authority in this boundary.

## Fail-closed requirements

Protected identity routes fail closed when either the cryptographic verifier or trusted actor resolver is absent. Missing application mapping returns `actor_mapping_not_found`. Resolver infrastructure failure returns `actor_resolver_failed`.

Teacher and school-admin mappings require a trusted tenant ID. Allowed roles remain `guardian`, `teacher`, `school_admin` and `platform_admin`.

## Privacy boundary

Raw external provider subjects remain transient server-side identity material. The public `whoami` response exposes only the KirthiVerse opaque `actorId`, application role and tenant ID. It never returns the provider subject.

Opaque actor IDs must match the KirthiVerse-owned `kvs_...` identifier format and must not be copied directly from provider subjects.

## Current deployment state

The repository contains the role-resolver interface and deterministic synthetic validation, but no durable actor-role mapping store is connected in this slice. A normal Cloudflare Worker environment cannot configure a JavaScript function through plain Wrangler vars; a concrete server-side mapping adapter is still required before this boundary can become live authentication infrastructure.

Therefore this slice does **not** enable:

- database persistence;
- real child cloud identity;
- child direct login;
- browser-to-MySQL access;
- remote teacher monitoring;
- unrestricted child chat;
- refresh-token storage; or
- production actor-role administration.

## Next gate before persistence

A future persistence slice must establish a trusted actor/role store with guardian consent, tenant isolation, encryption/key management, retention/deletion/export controls, tamper-resistant audit, restricted database networking and abuse/rate-limit controls before real learner data is permitted.
