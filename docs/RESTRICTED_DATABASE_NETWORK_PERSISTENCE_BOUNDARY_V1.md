# Restricted Database Network & Persistence Boundary v1

## Status
Security architecture preview only. This document does **not** claim live database connectivity, applied schema, live Aiven integration, production persistence, or approval for real child data.

## Purpose
Define the minimum admission controls that must exist before KirthiVerse may connect a trusted server-side persistence adapter to the existing preview MySQL schema.

## Current source of truth
The existing schema remains `database/kirthiverse-preview/001_cloud_identity_preview.sql`. It is explicitly preview-only and must not be treated as applied or production-ready merely because the SQL exists in the repository.

## Network requirements
A persistence adapter must present a trusted server-side network-policy attestation. The boundary requires:

- TLS enabled and mandatory.
- No browser reachability.
- No public Internet reachability.
- No `0.0.0.0/0` or `::/0` allow-list entries.
- Only private or loopback network ranges for the synthetic preview adapter.
- Client-supplied network/database configuration is rejected.

This intentionally fails closed rather than treating broad Internet reachability as acceptable.

## Persistence requirements
The browser must never receive database credentials or connect directly to MySQL. The trusted server/API layer is the only permitted architectural path.

The v1 boundary accepts only allow-listed semantic operations. It rejects caller-supplied SQL or query strings, so an application caller cannot turn the adapter into an arbitrary SQL execution endpoint.

Allowed operation identifiers in this preview are deliberately narrow and cover trusted identity resolution, guardian/tenant/consent resolution, learner progress operations, DSR operations, and append-only audit persistence preparation.

Every operation requires an already-established trusted authorization context. This boundary does not replace authentication, tenant authorization, guardian consent, encryption, session controls, audit controls, retention rules, rate limiting, or production configuration validation.

## Child-data restriction
Real learner/child cloud data remains forbidden. The validator and contract require `realChildData=false` for this preview. Synthetic test data only.

## Platform-admin restriction
There is no implicit platform-admin or tenant bypass. Persistence admission rejects explicit bypass hints.

## Existing Aiven service
The project has an existing preview MySQL service, but this repository slice does not verify or alter its current firewall/network filters, execute SQL, create users, rotate credentials, or claim that `001_cloud_identity_preview.sql` has been applied. Those are separate operational actions requiring independently verified network restriction and a reviewed server-side adapter.

## Production blockers
Before any production persistence activation:

1. Restrict the database network at the provider/firewall layer to approved private or narrowly controlled server egress paths.
2. Remove broad public CIDRs such as `0.0.0.0/0` and `::/0` if present.
3. Provision database credentials only through an approved server-side secret mechanism.
4. Verify TLS certificate validation and connection policy.
5. Implement a reviewed persistence adapter using parameterized statements/prepared operations.
6. Prove tenant isolation and guardian/consent enforcement at operation boundaries.
7. Apply and verify schema migrations through an auditable migration process.
8. Run only synthetic data until the full cloud-identity security gate approves real learner data.
9. Add backup/restore, deletion, retention, monitoring, and incident-response evidence.

## Explicit non-claims
- No live database binding is enabled.
- No live Aiven connectivity is claimed.
- No SQL schema application is claimed.
- No production database credentials are present.
- No browser-direct database access is allowed.
- No real child cloud data is allowed.
- No live persistence route is enabled in the Worker.
