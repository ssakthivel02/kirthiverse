import assert from 'node:assert/strict'
import {
  AuditBoundaryError,
  appendAuditEvent,
  auditIntegrityContract,
  createIntegrityProtectedAuditEvent,
  verifyIntegrityProtectedAuditEvent,
} from '../workers/kirthiverse-api-preview/src/audit-boundary.mjs'

const key = await crypto.subtle.generateKey(
  { name: 'HMAC', hash: 'SHA-256', length: 256 },
  false,
  ['sign', 'verify'],
)

const resolveIntegrityKey = async ({ keyVersion }) => keyVersion === 'v1' ? key : null
const draft = {
  eventId: 'kvs_evt_01KVSSECURITY0001',
  actorId: 'kvs_guardian_000001',
  action: 'guardian.progress.view',
  targetType: 'learner_profile',
  targetId: 'kvs_learner_0000001',
  requestId: 'req-20260910-0001',
  occurredAt: '2026-09-10T19:00:00.000Z',
  metadata: { purpose: 'guardian_progress_view', result: 'allowed' },
}

const first = await createIntegrityProtectedAuditEvent(draft, {
  keyVersion: 'v1',
  previousHash: null,
  resolveIntegrityKey,
})
assert.equal(first.schema, 'kvs-audit-v1')
assert.equal(first.keyVersion, 'v1')
assert.equal(first.previousHash, null)
assert.equal(typeof first.eventHash, 'string')
assert.equal(first.eventHash.length, 43)
assert.equal(await verifyIntegrityProtectedAuditEvent(first, { resolveIntegrityKey }), true)

const tampered = structuredClone(first)
tampered.event.metadata.result = 'denied'
await assert.rejects(
  () => verifyIntegrityProtectedAuditEvent(tampered, { resolveIntegrityKey }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_integrity_verification_failed',
)

await assert.rejects(
  () => createIntegrityProtectedAuditEvent({ ...draft, metadata: { token: 'secret' } }, {
    keyVersion: 'v1', resolveIntegrityKey,
  }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_sensitive_metadata_forbidden',
)

await assert.rejects(
  () => createIntegrityProtectedAuditEvent(draft, { keyVersion: 'v1' }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_integrity_key_resolver_not_configured',
)

await assert.rejects(
  () => createIntegrityProtectedAuditEvent(draft, {
    keyVersion: 'missing', resolveIntegrityKey,
  }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_integrity_key_not_found',
)

let head = null
const written = []
const appended1 = await appendAuditEvent(draft, {
  keyVersion: 'v1',
  resolveIntegrityKey,
  resolveAuditHead: async () => head,
  appendAuditRecord: async ({ envelope, expectedPreviousHash }) => {
    assert.equal(expectedPreviousHash, head)
    written.push(envelope)
    head = envelope.eventHash
    return { accepted: true }
  },
})
assert.equal(appended1.previousHash, null)
assert.equal(head, appended1.eventHash)

const appended2 = await appendAuditEvent({
  ...draft,
  eventId: 'kvs_evt_01KVSSECURITY0002',
  requestId: 'req-20260910-0002',
  occurredAt: '2026-09-10T19:01:00.000Z',
}, {
  keyVersion: 'v1',
  resolveIntegrityKey,
  resolveAuditHead: async () => head,
  appendAuditRecord: async ({ envelope, expectedPreviousHash }) => {
    assert.equal(expectedPreviousHash, head)
    written.push(envelope)
    head = envelope.eventHash
    return { accepted: true }
  },
})
assert.equal(appended2.previousHash, appended1.eventHash)
assert.equal(written.length, 2)

await assert.rejects(
  () => appendAuditEvent({
    ...draft,
    eventId: 'kvs_evt_01KVSSECURITY0003',
    requestId: 'req-20260910-0003',
  }, {
    keyVersion: 'v1',
    resolveIntegrityKey,
    resolveAuditHead: async () => head,
    appendAuditRecord: async () => ({ accepted: false }),
  }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_append_conflict',
)

await assert.rejects(
  () => appendAuditEvent(draft, {
    keyVersion: 'v1', resolveIntegrityKey, appendAuditRecord: async () => ({ accepted: true }),
  }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_head_resolver_not_configured',
)

await assert.rejects(
  () => appendAuditEvent(draft, {
    keyVersion: 'v1', resolveIntegrityKey, resolveAuditHead: async () => null,
  }),
  (error) => error instanceof AuditBoundaryError && error.code === 'audit_writer_not_configured',
)

const contract = auditIntegrityContract()
assert.equal(contract.integrity, 'HMAC-SHA-256')
assert.equal(contract.appendOnlyWriterRequired, true)
assert.equal(contract.compareAndAppendRequired, true)
assert.equal(contract.sensitiveMetadataForbidden, true)
assert.equal(contract.durableStoreConnected, false)

console.log('Audit integrity boundary validation passed')
