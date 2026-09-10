import assert from 'node:assert/strict'
import {
  DataLifecycleError,
  authorizeDataSubjectRequest,
  transitionDataSubjectRequest,
  evaluateRetention,
  materializeTrustedExportField,
  markDataSubjectRequestCompleted,
  dataLifecycleContract,
} from '../workers/kirthiverse-api-preview/src/data-lifecycle.mjs'
import { encryptSensitiveString } from '../workers/kirthiverse-api-preview/src/crypto-boundary.mjs'

const NOW = Date.parse('2026-09-10T12:00:00.000Z')
const guardian = Object.freeze({ actorId: 'kvs_guardian_A123456789', role: 'guardian', tenantId: null })
const teacher = Object.freeze({ actorId: 'kvs_teacher_A1234567890', role: 'teacher', tenantId: 'kvs_tenant_A1234567890' })
const admin = Object.freeze({ actorId: 'kvs_admin_A123456789012', role: 'platform_admin', tenantId: null })
const learnerId = 'kvs_learner_A1234567890'
const otherLearnerId = 'kvs_learner_B1234567890'

function request(requestType = 'export', targetType = 'learner_profile', targetId = learnerId, suffix = 'A12345678901') {
  return { requestId: `dsr_${suffix}`, requestType, targetType, targetId }
}

function activeLink({ guardianActorId, learnerId: requestedLearnerId }) {
  return { guardianActorId, learnerId: requestedLearnerId, linkStatus: 'active' }
}

function revokedLink({ guardianActorId, learnerId: requestedLearnerId }) {
  return { guardianActorId, learnerId: requestedLearnerId, linkStatus: 'revoked' }
}

async function expectCode(promiseOrFn, code) {
  let caught
  try {
    if (typeof promiseOrFn === 'function') await promiseOrFn()
    else await promiseOrFn
  } catch (error) {
    caught = error
  }
  assert.ok(caught, `expected error ${code}`)
  assert.equal(caught.code, code)
  return caught
}

function auditSink(events) {
  return async (event) => {
    events.push(event)
    return true
  }
}

// Retention policy: active records remain retained; elapsed post-deletion windows only become eligible for reviewed deletion.
{
  const active = evaluateRetention('learner_progress', '2020-01-01T00:00:00Z', { nowMs: NOW })
  assert.equal(active.disposition, 'retain')
  assert.equal(active.reason, 'active_lifecycle')

  const recent = evaluateRetention('learner_progress', '2026-09-01T00:00:00Z', { nowMs: NOW, afterDeletion: true })
  assert.equal(recent.disposition, 'retain')
  assert.equal(recent.reason, 'retention_active')

  const elapsed = evaluateRetention('learner_progress', '2026-07-01T00:00:00Z', { nowMs: NOW, afterDeletion: true })
  assert.equal(elapsed.disposition, 'eligible_for_reviewed_deletion')
  assert.equal(elapsed.reason, 'retention_elapsed')

  const held = evaluateRetention('learner_progress', '2020-01-01T00:00:00Z', { nowMs: NOW, afterDeletion: true, legalHold: true })
  assert.equal(held.disposition, 'retain')
  assert.equal(held.reason, 'legal_hold')

  await expectCode(() => evaluateRetention('unknown', '2026-01-01T00:00:00Z', { nowMs: NOW }), 'retention_record_class_invalid')
}

// DSR lifecycle is monotonic and replay/idempotency safe.
{
  const received = { requestId: 'dsr_StateA123456789', status: 'received' }
  const verified = transitionDataSubjectRequest(received, 'verified')
  assert.equal(verified.status, 'verified')
  assert.equal(verified.idempotent, false)
  const replay = transitionDataSubjectRequest(verified, 'verified')
  assert.equal(replay.status, 'verified')
  assert.equal(replay.idempotent, true)
  await expectCode(() => transitionDataSubjectRequest(received, 'completed'), 'data_subject_request_transition_invalid')
  await expectCode(() => transitionDataSubjectRequest({ ...received, status: 'completed' }, 'processing'), 'data_subject_request_transition_invalid')
}

// Guardian may export an actively linked learner. Request and decision auditing are mandatory and action-distinct.
{
  const events = []
  const result = await authorizeDataSubjectRequest(request('export'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: activeLink,
    writeAuditEvent: auditSink(events),
    nowMs: NOW,
  })
  assert.equal(result.authorized, true)
  assert.equal(result.actorId, guardian.actorId)
  assert.deepEqual(events.map((event) => event.action), ['export.requested', 'export.allowed'])
  assert.notEqual(events[0].eventId, events[1].eventId)
}

// Revoked or mismatched guardian links fail closed and are audited as denied.
{
  const events = []
  await expectCode(authorizeDataSubjectRequest(request('export', 'learner_profile', learnerId, 'RevokedA123456'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: revokedLink,
    writeAuditEvent: auditSink(events),
    nowMs: NOW,
  }), 'guardian_learner_link_inactive')
  assert.deepEqual(events.map((event) => event.action), ['export.requested', 'export.denied'])

  await expectCode(authorizeDataSubjectRequest(request('export', 'learner_profile', otherLearnerId, 'MismatchA123456'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: () => ({ guardianActorId: guardian.actorId, learnerId, linkStatus: 'active' }),
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'guardian_learner_link_mismatch')
}

// Teachers and platform admins have no implicit learner DSR bypass.
{
  await expectCode(authorizeDataSubjectRequest(request('export', 'learner_profile', learnerId, 'TeacherA1234567'), {
    trustedActor: teacher,
    resolveGuardianLearnerLink: activeLink,
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'learner_data_guardian_required')

  await expectCode(authorizeDataSubjectRequest(request('delete', 'learner_profile', learnerId, 'AdminA123456789'), {
    trustedActor: admin,
    resolveGuardianLearnerLink: activeLink,
    resolveDeletionConstraints: async () => ({ legalHold: false, activeDependency: false }),
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'learner_data_guardian_required')
}

// Adult account export/delete is self-service only through an authenticated adult-owned identity.
{
  const selfExport = await authorizeDataSubjectRequest(request('export', 'adult_account', guardian.actorId, 'SelfExport123456'), {
    trustedActor: guardian,
    writeAuditEvent: async () => true,
    nowMs: NOW,
  })
  assert.equal(selfExport.authorized, true)

  await expectCode(authorizeDataSubjectRequest(request('export', 'adult_account', 'kvs_guardian_B123456789', 'OtherAdult123456'), {
    trustedActor: guardian,
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'adult_self_service_only')
}

// Legal holds and active dependencies block deletion. Client-supplied bypass hints are rejected.
{
  await expectCode(authorizeDataSubjectRequest(request('delete', 'learner_profile', learnerId, 'LegalHold123456'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: activeLink,
    resolveDeletionConstraints: async () => ({ legalHold: true, activeDependency: false }),
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'deletion_blocked_legal_hold')

  await expectCode(authorizeDataSubjectRequest(request('delete', 'learner_profile', learnerId, 'Dependency123456'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: activeLink,
    resolveDeletionConstraints: async () => ({ legalHold: false, activeDependency: true, dependencyCode: 'active_school_assignment' }),
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'active_school_assignment')

  await expectCode(authorizeDataSubjectRequest({ ...request('delete', 'learner_profile', learnerId, 'BypassHint123456'), forceDelete: true }, {
    trustedActor: guardian,
    resolveGuardianLearnerLink: activeLink,
    resolveDeletionConstraints: async () => ({ legalHold: false, activeDependency: false }),
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'client_authorization_hint_rejected')
}

// Resolver and audit failures fail closed.
{
  await expectCode(authorizeDataSubjectRequest(request('delete', 'learner_profile', learnerId, 'NoConstraint12345'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: activeLink,
    writeAuditEvent: async () => true,
    nowMs: NOW,
  }), 'deletion_constraint_resolver_not_configured')

  await expectCode(authorizeDataSubjectRequest(request('export', 'learner_profile', learnerId, 'NoAuditSink123456'), {
    trustedActor: guardian,
    resolveGuardianLearnerLink: activeLink,
    nowMs: NOW,
  }), 'audit_sink_not_configured')
}

// Sensitive export decryption is available only on the trusted server path and honors encryption context.
{
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const resolveKey = async () => key
  const envelope = await encryptSensitiveString('synthetic@example.invalid', 'adult-private-contact', 'preview-key-v1', { resolveKey })
  await expectCode(materializeTrustedExportField(envelope, 'adult-private-contact', { trustedServer: false, resolveKey }), 'trusted_server_export_required')
  const plaintext = await materializeTrustedExportField(envelope, 'adult-private-contact', { trustedServer: true, resolveKey })
  assert.equal(plaintext, 'synthetic@example.invalid')
  await expectCode(materializeTrustedExportField(envelope, 'wrong-context', { trustedServer: true, resolveKey }), 'ciphertext_context_mismatch')
}

// Completion is separately audited and cannot silently succeed without the mandatory sink.
{
  const events = []
  const completed = await markDataSubjectRequestCompleted(request('export', 'adult_account', guardian.actorId, 'CompleteA123456'), {
    trustedActor: guardian,
    writeAuditEvent: auditSink(events),
    nowMs: NOW,
  })
  assert.equal(completed.completed, true)
  assert.equal(events[0].action, 'export.completed')
  await expectCode(markDataSubjectRequestCompleted(request('delete', 'adult_account', guardian.actorId, 'CompleteB123456'), {
    trustedActor: guardian,
    nowMs: NOW,
  }), 'audit_sink_not_configured')
}

// Contract must preserve preview-only security non-claims.
{
  const contract = dataLifecycleContract()
  assert.equal(contract.adultOwnedCloudIdentityOnly, true)
  assert.equal(contract.directChildCloudAuthenticationAllowed, false)
  assert.equal(contract.teacherLearnerExportAllowed, false)
  assert.equal(contract.teacherLearnerDeletionAllowed, false)
  assert.equal(contract.platformAdminImplicitBypassAllowed, false)
  assert.equal(contract.legalHoldBypassAllowed, false)
  assert.equal(contract.trustedServerRequiredForSensitiveExportDecryption, true)
  assert.equal(contract.mandatoryAuditForLifecycleDecisions, true)
  assert.equal(contract.liveDeletionEnabled, false)
  assert.equal(contract.liveExportEnabled, false)
  assert.equal(contract.livePersistenceEnabled, false)
  assert.equal(contract.syntheticPreviewOnly, true)
}

console.log('Data lifecycle retention/deletion/export boundary validation passed')