import assert from 'node:assert/strict'
import {
  AuditSecurityError,
  auditSecurityContract,
  buildAuditEvent,
  recordSecurityAuditEvent,
  verifyAuditChain,
} from '../workers/kirthiverse-api-preview/src/audit-security.mjs'

const nowMs = Date.parse('2026-09-10T14:00:00.000Z')
const trustedContext = {
  actorId: 'kvs_guardian_000001',
  actorRole: 'guardian',
  tenantId: null,
}
const base = {
  eventId: 'evt_audit_00000001',
  occurredAt: '2026-09-10T13:59:58.000Z',
  recordedAt: '2026-09-10T13:59:59.000Z',
  requestId: 'req:00000001',
  actorId: trustedContext.actorId,
  actorRole: trustedContext.actorRole,
  tenantId: null,
  action: 'auth.login.allowed',
  targetType: 'adult_account',
  targetId: 'kvs_account_000001',
  outcome: 'allowed',
  reasonCode: 'trusted_identity_verified',
  correlationId: 'corr:00000001',
  policyVersion: 'audit-v1',
  metadata: { provider: 'synthetic', attempt: 1 },
}

async function expectCode(fn, code) {
  await assert.rejects(fn, (error) => error instanceof AuditSecurityError && error.code === code)
}

const first = await buildAuditEvent(base, { nowMs, trustedContext })
const firstAgain = await buildAuditEvent(base, { nowMs, trustedContext })
assert.equal(first.eventHash, firstAgain.eventHash)
assert.equal(await verifyAuditChain([first]), true)

const second = await buildAuditEvent({
  ...base,
  eventId: 'evt_audit_00000002',
  action: 'guardian.consent.checked',
  targetType: 'learner_profile',
  targetId: 'kvs_learner_000001',
  outcome: 'allowed',
  reasonCode: 'active_consent_found',
  requestId: 'req:00000002',
  correlationId: 'corr:00000002',
}, { nowMs, trustedContext, previousEventHash: first.eventHash })
assert.equal(await verifyAuditChain([first, second]), true)

assert.equal(await verifyAuditChain([{ ...first, reasonCode: 'tampered' }, second]), false)
assert.equal(await verifyAuditChain([first, { ...second, previousEventHash: 'a'.repeat(64) }]), false)
assert.equal(await verifyAuditChain([second, first]), false)
assert.equal(await verifyAuditChain([second]), false)

await expectCode(() => buildAuditEvent({ ...base, eventId: '' }, { nowMs, trustedContext }), 'audit_event_id_invalid')
await expectCode(() => buildAuditEvent({ ...base, actorId: 'guardian@example.com' }, { nowMs, trustedContext }), 'audit_actor_id_invalid')
await expectCode(() => buildAuditEvent({ ...base, targetId: 'child-name' }, { nowMs, trustedContext }), 'audit_target_id_invalid')
await expectCode(() => buildAuditEvent({ ...base, actorRole: 'teacher' }, { nowMs, trustedContext }), 'audit_actor_role_mismatch')
await expectCode(() => buildAuditEvent({ ...base, tenantId: 'kvs_tenant_000001' }, { nowMs, trustedContext }), 'audit_tenant_spoof_rejected')
await expectCode(() => buildAuditEvent({ ...base, action: 'unknown.action' }, { nowMs, trustedContext }), 'audit_action_not_allowed')
await expectCode(() => buildAuditEvent({ ...base, metadata: { authorization: 'Bearer abc.def.ghi' } }, { nowMs, trustedContext }), 'audit_sensitive_key_rejected')
await expectCode(() => buildAuditEvent({ ...base, metadata: { note: `Bearer ${'x'.repeat(100)}` } }, { nowMs, trustedContext }), 'audit_sensitive_value_rejected')
await expectCode(() => buildAuditEvent({ ...base, metadata: { email: 'child@example.test' } }, { nowMs, trustedContext }), 'audit_sensitive_key_rejected')
await expectCode(() => buildAuditEvent({ ...base, metadata: { childName: 'Synthetic Child' } }, { nowMs, trustedContext }), 'audit_sensitive_key_rejected')
await expectCode(() => buildAuditEvent({ ...base, metadata: { payload: 'x'.repeat(9000) } }, { nowMs, trustedContext }), 'audit_event_too_large')
await expectCode(() => buildAuditEvent({ ...base, occurredAt: '2026-09-10T14:02:00.000Z' }, { nowMs, trustedContext }), 'audit_timestamp_in_future')

await expectCode(() => recordSecurityAuditEvent(base, { nowMs, trustedContext }), 'audit_sink_not_configured')
await expectCode(() => recordSecurityAuditEvent(base, {
  nowMs,
  trustedContext,
  writeAuditEvent: async () => { throw new Error('synthetic failure') },
}), 'audit_sink_failed')

const written = []
const recorded = await recordSecurityAuditEvent(base, {
  nowMs,
  trustedContext,
  writeAuditEvent: async (event) => { written.push(event); return true },
})
assert.equal(recorded.recorded, true)
assert.equal(written.length, 1)
assert.equal('email' in written[0].metadata, false)

const optional = await recordSecurityAuditEvent(base, { nowMs, trustedContext, mandatory: false })
assert.deepEqual(optional, { recorded: false, mandatory: false })

const contract = auditSecurityContract()
assert.equal(contract.tamperEvidentHashChain, true)
assert.equal(contract.externalImmutabilityClaimed, false)
assert.equal(contract.nonRepudiationClaimed, false)
assert.equal(contract.trustedServerSinkRequiredForMandatoryEvents, true)
assert.equal(contract.syntheticPreviewOnly, true)
assert.equal(contract.liveAuditPersistenceEnabled, false)

console.log('Tamper-resistant audit boundary validation passed')
