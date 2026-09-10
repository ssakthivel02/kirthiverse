# Future Persistence Authorization Gate v1

## Purpose

This preview-only boundary prevents a future persistence operation from being treated as authorized merely because a caller supplies `trustedAuthorization: true`.

It composes evidence from the already-established KirthiVerse boundaries before issuing a trusted persistence context.

Required evidence is server-side and fail-closed:

1. trusted KirthiVerse authorization for the exact actor, tenant and operation;
2. restricted persistence/network readiness;
3. guardian consent for learner-progress persistence;
4. ciphertext-only encryption for learner-progress persistence;
5. audit-integrity readiness for the exact actor, tenant and operation.

## Security properties

- opaque KirthiVerse actor and tenant identifiers only;
- no client-controlled authorization override;
- no tenant or implicit platform-admin bypass;
- no real child cloud data;
- no browser database access or key material;
- learner-progress writes require purpose-specific active guardian consent;
- learner-progress writes require ciphertext-only, server-key-resolved encryption;
- future writes require the audit boundary to be ready for atomic append;
- persistence boundary must attest restricted network posture and no live binding.

## Non-claims

This slice does **not** enable:

- live Aiven connectivity;
- schema application;
- real database writes;
- real learner/child cloud persistence;
- production KMS/HSM keys;
- Cloudflare production secrets;
- browser-side encryption/signing keys;
- remote teacher monitoring.

The returned context is a preview authorization artifact only. A future production persistence adapter must still satisfy every downstream persistence-security check and production-readiness gate.
