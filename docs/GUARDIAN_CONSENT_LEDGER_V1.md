# Guardian Consent & Authorization Ledger v1

## Purpose

This preview security slice establishes a fail-closed guardian-consent decision boundary before any learner cloud feature can be enabled. It does not enable persistence or real child data.

## Trust sequence

1. External identity provider proves adult identity cryptographically.
2. KirthiVerse trusted actor resolver maps the verified identity to an opaque KirthiVerse `actorId`, application role and tenant context.
3. Learner-purpose authorization requires a guardian actor.
4. A trusted server-side consent resolver returns ledger records scoped to guardian, learner, purpose and policy version.
5. KirthiVerse validates the ledger records and authorizes only an unrevoked latest `granted` decision for the exact current policy version.

## Supported preview purposes

- `cloud_progress_sync`
- `guardian_progress_view`
- `guardian_learning_management`

Remote teacher monitoring is intentionally not an allowed consent purpose in this release.

## Fail-closed guarantees

Authorization is denied when:

- the caller is not a trusted KirthiVerse guardian actor;
- the learner identifier is invalid;
- the purpose is not allow-listed;
- the policy version is invalid;
- the consent resolver is missing or fails;
- no matching consent exists;
- consent is denied;
- consent has been revoked;
- the matching ledger state is ambiguous;
- only consent for a different policy version exists.

A consent grant for one purpose does not authorize a different purpose. A grant under an older policy version does not authorize a newer version.

## Ledger model

The existing preview SQL already contains an append-oriented `consent_ledger` table with guardian, learner, purpose, policy version, decision, decision time, revocation time and evidence reference. This slice does not apply or mutate the live Aiven MySQL schema. The runtime boundary uses an injected trusted resolver so browser code never receives database credentials.

The runtime-facing guardian identifier is an opaque KirthiVerse actor ID. Mapping that actor ID to an internal adult account UUID is a server-side responsibility of the future persistence adapter.

## Not enabled

- no live MySQL persistence;
- no real learner cloud identity;
- no child direct login;
- no browser-to-database access;
- no unrestricted child chat;
- no remote teacher monitoring;
- no consent collection UI;
- no claim that consent alone satisfies all child-data legal obligations.

Before real learner data is enabled, the persistence adapter, guardian-learner relationship verification, encryption key management, retention/deletion/export execution, tenant isolation, tamper-resistant audit logging, rate limiting/abuse controls and release approval remain mandatory.
