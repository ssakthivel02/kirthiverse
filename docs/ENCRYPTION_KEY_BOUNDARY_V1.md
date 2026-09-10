# Encryption Key Management & Sensitive Data Boundary v1

## Purpose
This preview-only boundary prevents sensitive KirthiVerse fields from crossing a persistence adapter as plaintext. It does not enable live database persistence or real learner data.

## Contract
- AES-256-GCM only (`A256GCM`).
- 96-bit random IV per encryption operation.
- 128-bit authentication tag.
- Application-defined encryption context is bound as authenticated additional data (AAD).
- Every ciphertext envelope carries an explicit key version.
- Keys are obtained only through an injected trusted server-side key resolver.
- Missing resolver, missing key, invalid key algorithm/length/usage, malformed ciphertext, context mismatch and authentication failure all fail closed.
- Sensitive storage adapters must accept ciphertext envelopes only; plaintext fields are rejected by the boundary.
- Raw key material is never returned by this module and must never be placed in browser code, repository files, logs, database rows or client-visible configuration.

## Rotation model
New writes use the current approved key version. Existing ciphertext retains its historical key version so it can be decrypted while that old key remains authorized. Re-encryption to a newer key is a separate controlled migration operation. Deleting an old key before migration would intentionally make historical ciphertext unreadable, so key retirement requires evidence that migration and recovery checks have completed.

## Intended sensitive fields
Examples from the existing preview schema include adult private contact values and learner display-name values. Encryption context must identify the exact logical field, such as `adult_private_contacts.email_ciphertext`, to prevent ciphertext from being silently replayed into another protected field.

## Not included in v1
- no live KMS/HSM provider adapter
- no Cloudflare secret deployment
- no Aiven MySQL writes
- no production key creation or rotation
- no plaintext learner profile persistence
- no real child data
- no browser-side encryption key access
- no remote teacher monitoring

## Required later gates
Before persistence can be enabled, KirthiVerse still requires a production key-management provider, restricted database network exposure, tested backup/restore and deletion workflows, tamper-resistant audit evidence, retention controls, abuse/rate limiting and explicit release approval.
