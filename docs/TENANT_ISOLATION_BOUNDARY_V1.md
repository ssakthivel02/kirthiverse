# Tenant Isolation & Authorization Boundary v1

## Purpose

This preview boundary prevents school-scoped actors from crossing KirthiVerse tenant boundaries and keeps guardian learner access on a separate trusted authorization path.

It is intentionally fail closed and does not enable live learner cloud persistence.

## Trust model

Authentication and authorization remain separate:

1. the external identity provider proves identity;
2. the trusted KirthiVerse actor resolver supplies the application actor, role and tenant;
3. this tenant boundary authorizes school-scoped resources and learner mappings;
4. guardian learner access uses a trusted guardian-to-learner link resolver;
5. learner-data purposes that require consent must additionally pass the Guardian Consent & Authorization Ledger boundary.

A caller-supplied tenant identifier is never authoritative. The trusted KirthiVerse actor tenant is the authorization anchor.

## School tenant rules

Only `teacher` and `school_admin` actors are tenant-scoped in this version.

For a school resource or school learner mapping:

- the actor must have a valid KirthiVerse actor ID;
- the actor must have a valid trusted tenant ID;
- the resource or learner mapping must have a valid tenant ID;
- actor tenant and target tenant must match exactly;
- learner school membership must be `active`;
- absence or failure of the trusted learner-tenant resolver fails closed.

Cross-tenant requests return `cross_tenant_access_denied`.

## Platform administrator rule

`platform_admin` does not receive implicit cross-tenant access in this boundary. A future privileged-support or break-glass design must be explicit, separately approved, time-bounded and auditable. Until then, platform administrators are denied by the tenant-scoped helper.

## Guardian learner rule

Guardians do not use school tenant authorization. Guardian learner access requires:

- role `guardian`;
- valid opaque KirthiVerse guardian actor ID;
- valid opaque learner ID;
- trusted guardian-to-learner resolver;
- exact guardian and learner match;
- `active` guardian learner link.

Revoked, missing or mismatched links are denied.

This link check does not replace purpose-specific guardian consent. Cloud progress sync, guardian progress viewing or guardian learning management must also pass the consent boundary when applicable.

## Deliberately disabled

This slice does not enable:

- real child or learner cloud data;
- live MySQL persistence;
- direct browser-to-database access;
- child direct login;
- remote teacher monitoring;
- unrestricted child chat;
- implicit platform-admin cross-tenant access.

## Persistence status

The existing preview MySQL design includes school memberships and guardian learner links, but this repository cannot currently apply or query the live Aiven MySQL schema through the connected tooling. Therefore this boundary uses injected trusted resolver interfaces and deterministic synthetic validation only.

No claim is made that these authorization records have been applied to or are live in `kirthiverse_preview`.

## Required composition before learner cloud features

A future learner cloud request must compose the relevant boundaries rather than bypass them:

`verified identity -> trusted actor resolver -> guardian/school relationship authorization -> tenant isolation -> purpose-specific guardian consent -> persistence authorization`

The persistence step remains disabled until network exposure, encryption/key management, retention/deletion/export, audit integrity, abuse controls and release approval are complete.
