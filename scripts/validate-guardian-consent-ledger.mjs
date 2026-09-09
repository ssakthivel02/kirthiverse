import assert from 'node:assert/strict'
import {
  ConsentError,
  authorizeGuardianLearnerPurpose,
  evaluateCurrentConsent,
  supportedConsentPurposes,
  validateConsentRecord,
} from '../workers/kirthiverse-api-preview/src/consent.mjs'

const guardian = { actorId: 'kvs_guardian_actor_001', role: 'guardian', tenantId: null }
const learnerId = 'kvs_learner_actor_001'
const purposeCode = 'cloud_progress_sync'
const policyVersion = '2026-09-v1'
const base = {
  id: 'consent-001',
  guardianActorId: guardian.actorId,
  learnerId,
  purposeCode,
  policyVersion,
  decision: 'granted',
  decidedAt: '2026-09-09T10:00:00Z',
  revokedAt: null,
}

assert.deepEqual(supportedConsentPurposes().sort(), [
  'cloud_progress_sync',
  'guardian_learning_management',
  'guardian_progress_view',
])

const normalized = validateConsentRecord(base)
assert.equal(normalized.decision, 'granted')
assert.equal(normalized.guardianActorId, guardian.actorId)

const current = evaluateCurrentConsent([base], {
  guardianActorId: guardian.actorId,
  learnerId,
  purposeCode,
  policyVersion,
})
assert.equal(current.consentId, base.id)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(guardian, learnerId, purposeCode, policyVersion),
  (error) => error instanceof ConsentError && error.code === 'consent_resolver_not_configured' && error.status === 503,
)

const authorized = await authorizeGuardianLearnerPurpose(
  guardian,
  learnerId,
  purposeCode,
  policyVersion,
  { resolveConsent: async () => [base] },
)
assert.equal(authorized.consentId, base.id)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(
    { ...guardian, role: 'teacher' },
    learnerId,
    purposeCode,
    policyVersion,
    { resolveConsent: async () => [base] },
  ),
  (error) => error instanceof ConsentError && error.code === 'guardian_role_required',
)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(
    guardian,
    learnerId,
    'remote_teacher_monitoring',
    policyVersion,
    { resolveConsent: async () => [base] },
  ),
  (error) => error instanceof ConsentError && error.code === 'consent_purpose_not_allowed',
)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(
    guardian,
    learnerId,
    purposeCode,
    policyVersion,
    { resolveConsent: async () => [] },
  ),
  (error) => error instanceof ConsentError && error.code === 'guardian_consent_required',
)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(
    guardian,
    learnerId,
    purposeCode,
    policyVersion,
    { resolveConsent: async () => [{ ...base, decision: 'denied' }] },
  ),
  (error) => error instanceof ConsentError && error.code === 'guardian_consent_denied',
)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(
    guardian,
    learnerId,
    purposeCode,
    policyVersion,
    { resolveConsent: async () => [{ ...base, revokedAt: '2026-09-09T10:05:00Z' }] },
  ),
  (error) => error instanceof ConsentError && error.code === 'guardian_consent_revoked',
)

await assert.rejects(
  () => authorizeGuardianLearnerPurpose(
    guardian,
    learnerId,
    purposeCode,
    '2026-10-v2',
    { resolveConsent: async () => [base] },
  ),
  (error) => error instanceof ConsentError && error.code === 'guardian_consent_required',
)

const laterGrant = { ...base, id: 'consent-002', decidedAt: '2026-09-09T10:10:00Z' }
const earlierDeny = { ...base, id: 'consent-003', decision: 'denied', decidedAt: '2026-09-09T09:50:00Z' }
assert.equal(evaluateCurrentConsent([earlierDeny, laterGrant], {
  guardianActorId: guardian.actorId,
  learnerId,
  purposeCode,
  policyVersion,
}).consentId, laterGrant.id)

await assert.rejects(
  () => Promise.resolve().then(() => evaluateCurrentConsent([
    { ...base, id: 'consent-a', decision: 'granted' },
    { ...base, id: 'consent-b', decision: 'denied' },
  ], {
    guardianActorId: guardian.actorId,
    learnerId,
    purposeCode,
    policyVersion,
  })),
  (error) => error instanceof ConsentError && error.code === 'consent_state_ambiguous' && error.status === 503,
)

console.log('Guardian consent and authorization ledger validation passed')
