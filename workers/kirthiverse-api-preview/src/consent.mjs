const PURPOSE_CODES = new Set([
  'cloud_progress_sync',
  'guardian_progress_view',
  'guardian_learning_management',
])

const ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const VERSION_PATTERN = /^[A-Za-z0-9._-]{1,32}$/

export class ConsentError extends Error {
  constructor(code, status = 403) {
    super(code)
    this.name = 'ConsentError'
    this.code = code
    this.status = status
  }
}

function requireString(value, code, max = 128) {
  if (typeof value !== 'string' || value.length < 1 || value.length > max) {
    throw new ConsentError(code, 503)
  }
  return value
}

function toEpoch(value, code) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  throw new ConsentError(code, 503)
}

export function validateConsentRecord(record) {
  if (!record || typeof record !== 'object') throw new ConsentError('consent_record_invalid', 503)

  const id = requireString(record.id, 'consent_record_id_invalid', 96)
  const guardianActorId = requireString(record.guardianActorId, 'consent_guardian_invalid', 96)
  const learnerId = requireString(record.learnerId, 'consent_learner_invalid', 96)
  const purposeCode = requireString(record.purposeCode, 'consent_purpose_invalid', 64)
  const policyVersion = requireString(record.policyVersion, 'consent_policy_version_invalid', 32)

  if (!ID_PATTERN.test(guardianActorId)) throw new ConsentError('consent_guardian_invalid', 503)
  if (!ID_PATTERN.test(learnerId)) throw new ConsentError('consent_learner_invalid', 503)
  if (!PURPOSE_CODES.has(purposeCode)) throw new ConsentError('consent_purpose_invalid', 503)
  if (!VERSION_PATTERN.test(policyVersion)) throw new ConsentError('consent_policy_version_invalid', 503)
  if (record.decision !== 'granted' && record.decision !== 'denied') {
    throw new ConsentError('consent_decision_invalid', 503)
  }

  const decidedAt = toEpoch(record.decidedAt, 'consent_decided_at_invalid')
  const revokedAt = record.revokedAt == null ? null : toEpoch(record.revokedAt, 'consent_revoked_at_invalid')
  if (revokedAt != null && revokedAt < decidedAt) throw new ConsentError('consent_revocation_invalid', 503)

  return {
    id,
    guardianActorId,
    learnerId,
    purposeCode,
    policyVersion,
    decision: record.decision,
    decidedAt,
    revokedAt,
  }
}

export function evaluateCurrentConsent(records, context) {
  if (!Array.isArray(records)) throw new ConsentError('consent_records_invalid', 503)
  if (!context || typeof context !== 'object') throw new ConsentError('consent_context_invalid', 503)

  const guardianActorId = requireString(context.guardianActorId, 'consent_guardian_invalid', 96)
  const learnerId = requireString(context.learnerId, 'consent_learner_invalid', 96)
  const purposeCode = requireString(context.purposeCode, 'consent_purpose_invalid', 64)
  const policyVersion = requireString(context.policyVersion, 'consent_policy_version_invalid', 32)

  if (!PURPOSE_CODES.has(purposeCode)) throw new ConsentError('consent_purpose_not_allowed', 403)
  if (!VERSION_PATTERN.test(policyVersion)) throw new ConsentError('consent_policy_version_invalid', 503)

  const relevant = records
    .map(validateConsentRecord)
    .filter((record) => (
      record.guardianActorId === guardianActorId
      && record.learnerId === learnerId
      && record.purposeCode === purposeCode
      && record.policyVersion === policyVersion
    ))
    .sort((a, b) => b.decidedAt - a.decidedAt)

  if (relevant.length === 0) throw new ConsentError('guardian_consent_required', 403)

  if (relevant.length > 1 && relevant[0].decidedAt === relevant[1].decidedAt && relevant[0].decision !== relevant[1].decision) {
    throw new ConsentError('consent_state_ambiguous', 503)
  }

  const current = relevant[0]
  if (current.revokedAt != null) throw new ConsentError('guardian_consent_revoked', 403)
  if (current.decision !== 'granted') throw new ConsentError('guardian_consent_denied', 403)

  return {
    consentId: current.id,
    purposeCode: current.purposeCode,
    policyVersion: current.policyVersion,
    decidedAt: current.decidedAt,
  }
}

export async function authorizeGuardianLearnerPurpose(actor, learnerId, purposeCode, policyVersion, options = {}) {
  if (!actor || actor.role !== 'guardian' || !ID_PATTERN.test(String(actor.actorId || ''))) {
    throw new ConsentError('guardian_role_required', 403)
  }
  if (!ID_PATTERN.test(String(learnerId || ''))) throw new ConsentError('learner_id_invalid', 403)
  if (!PURPOSE_CODES.has(purposeCode)) throw new ConsentError('consent_purpose_not_allowed', 403)
  if (!VERSION_PATTERN.test(String(policyVersion || ''))) throw new ConsentError('consent_policy_version_invalid', 503)

  const resolveConsent = options.resolveConsent
  if (typeof resolveConsent !== 'function') throw new ConsentError('consent_resolver_not_configured', 503)

  let records
  try {
    records = await resolveConsent({
      guardianActorId: actor.actorId,
      learnerId,
      purposeCode,
      policyVersion,
    })
  } catch (error) {
    if (error instanceof ConsentError) throw error
    throw new ConsentError('consent_resolver_failed', 503)
  }

  return evaluateCurrentConsent(records, {
    guardianActorId: actor.actorId,
    learnerId,
    purposeCode,
    policyVersion,
  })
}

export function supportedConsentPurposes() {
  return [...PURPOSE_CODES]
}
