import assert from 'node:assert/strict'
import {
  AuditSecurityError,
} from '../workers/kirthiverse-api-preview/src/audit-security.mjs'
import {
  appendIntegrityProtectedAuditEvent,
  auditIntegrityHardeningContract,
  buildIntegrityProtectedAuditEvent,
  verifyIntegrityProtectedAuditEvent,
} from '../workers/kirthiverse-api-preview/src/audit-integrity-hardening.mjs'

const nowMs = Date.parse('2026-09-10T21:15:00.000Z')
const trustedContext = { actorId: 'kvs_guardian_000001', actorRole: 'guardian', tenantId: null }
const key = await crypto.subtle.generateKey(
  { name: 'HMAC', hash: 'SHA-256', length: 256 },
  false,
  ['sign', 'verify'],
)
const resolveIntegrityKey = async ({ keyVersion }) => keyVersion === 'v1' ? key : null

const base = {
  eventId: 'evt_audit_00010001',
  occurredAt: '2026-09-10T21:14:58.000Z',
  recordedAt: '2026-09-10T21:14:59.000Z',
  requestId: 'req:10000001',
  actorId: trustedContext.actorId,
  actorRole: trustedContext.actorRole,
  tenantId: null,
  action: 'guardian.consent.checked',
  targetType: 'learner_profile',
  targetId: 'kvs_learner_000001',
  outcome: 'allowed',
  reasonCode: 'active_consent_found',
  correlationId: 'corr:10000001',
  policyVersion: 'audit-v1',
  metadata: { purpose: 'synthetic_validation' },
}

async function expectCode(fn, code) {
  await assert.rejects(fn, (error) => error instanceof AuditSecurityError && error.code === code)
}

const first = await buildIntegrityProtectedAuditEvent(base, {
  nowMs,
  trustedContext,
  keyVersion: 'v1',
  resolveIntegrityKey,
})
assert.equal(first.integrity.schema, 'kvs-audit-integrity-v1')
assert.equal(first.integrity.keyVersion, 'v1')
assert.equal(first.integrity.mac.length, 43)
assert.equal(await verifyIntegrityProtectedAuditEvent(first, { resolveIntegrityKey }), true)

const tampered = structuredClone(first)
tampered.reasonCode = 'tampered'
await expectCode(() => verifyIntegrityProtectedAuditEvent(tampered, { resolveIntegrityKey }), 'audit_integrity_verification_failed')

await expectCode(() => buildIntegrityProtectedAuditEvent(base, {
  nowMs, trustedContext, keyVersion: 'v1',
}), 'audit_integrity_key_resolver_not_configured')
await expectCode(() => buildIntegrityProtectedAuditEvent(base, {
  nowMs, trustedContext, keyVersion: 'missing', resolveIntegrityKey,
}), 'audit_integrity_key_not_found')
await expectCode(() => buildIntegrityProtectedAuditEvent({ ...base, actorRole: 'teacher' }, {
  nowMs, trustedContext, keyVersion: 'v1', resolveIntegrityKey,
}), 'audit_actor_role_mismatch')
await expectCode(() => buildIntegrityProtectedAuditEvent({ ...base, action: 'unknown.action' }, {
  nowMs, trustedContext, keyVersion: 'v1', resolveIntegrityKey,
}), 'audit_action_not_allowed')
await expectCode(() => buildIntegrityProtectedAuditEvent({ ...base, metadata: { email: 'child@example.test' } }, {
  nowMs, trustedContext, keyVersion: 'v1', resolveIntegrityKey,
}), 'audit_sensitive_key_rejected')

let head = null
const writes = []
const recorded1 = await appendIntegrityProtectedAuditEvent(base, {
  nowMs,
  trustedContext,
  keyVersion: 'v1',
  resolveIntegrityKey,
  resolveAuditHead: async () => head,
  compareAndAppendAuditEvent: async ({ event, expectedPreviousHash }) => {
    const current = head || '0'.repeat(64)
    if (expectedPreviousHash !== current) return { accepted: false }
    writes.push(event)
    head = event.eventHash
    return { accepted: true }
  },
})
assert.equal(recorded1.recorded, true)
assert.equal(writes.length, 1)
assert.equal(await verifyIntegrityProtectedAuditEvent(recorded1.event, { resolveIntegrityKey }), true)

const secondInput = {
  ...base,
  eventId: 'evt_audit_00010002',
  requestId: 'req:10000002',
  correlationId: 'corr:10000002',
}
const recorded2 = await appendIntegrityProtectedAuditEvent(secondInput, {
  nowMs,
  trustedContext,
  keyVersion: 'v1',
  resolveIntegrityKey,
  resolveAuditHead: async () => head,
  compareAndAppendAuditEvent: async ({ event, expectedPreviousHash }) => {
    if (expectedPreviousHash !== head) return { accepted: false }
    writes.push(event)
    head = event.eventHash
    return { accepted: true }
  },
})
assert.equal(recorded2.event.previousEventHash, recorded1.event.eventHash)
assert.equal(writes.length, 2)

await expectCode(() => appendIntegrityProtectedAuditEvent(secondInput, {
  nowMs, trustedContext, keyVersion: 'v1', resolveIntegrityKey,
  resolveAuditHead: async () => head,
  compareAndAppendAuditEvent: async () => ({ accepted: false }),
}), 'audit_append_conflict')
await expectCode(() => appendIntegrityProtectedAuditEvent(base, {
  nowMs, trustedContext, keyVersion: 'v1', resolveIntegrityKey,
  compareAndAppendAuditEvent: async () => ({ accepted: true }),
}), 'audit_head_resolver_not_configured')
await expectCode(() => appendIntegrityProtectedAuditEvent(base, {
  nowMs, trustedContext, keyVersion: 'v1', resolveIntegrityKey,
  resolveAuditHead: async () => null,
}), 'audit_compare_append_writer_not_configured')

const contract = auditIntegrityHardeningContract()
assert.equal(contract.keyedIntegrity, 'HMAC-SHA-256')
assert.equal(contract.explicitKeyVersionRequired, true)
assert.equal(contract.existingAuditAllowListsPreserved, true)
assert.equal(contract.trustedContextChecksPreserved, true)
assert.equal(contract.atomicCompareAndAppendRequired, true)
assert.equal(contract.appendConflictFailsClosed, true)
assert.equal(contract.durableStoreConnected, false)
assert.equal(contract.productionKeyProvisioned, false)
assert.equal(contract.liveAuditPersistenceEnabled, false)

console.log('Audit integrity hardening validation passed')
