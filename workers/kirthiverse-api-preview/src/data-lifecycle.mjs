import { authorizeGuardianLearnerLink } from './tenant-authorization.mjs'
import { decryptSensitiveString } from './crypto-boundary.mjs'
import { recordSecurityAuditEvent } from './audit-security.mjs'

const ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const REQUEST_PATTERN = /^dsr_[A-Za-z0-9_-]{12,96}$/
const POLICY_VERSION = 'kvs-data-lifecycle-preview-v1'

const RETENTION_POLICIES = Object.freeze({
  adult_private_contact: Object.freeze({ activeDays: null, postDeletionDays: 30 }),
  learner_profile: Object.freeze({ activeDays: null, postDeletionDays: 30 }),
  learner_progress: Object.freeze({ activeDays: null, postDeletionDays: 30 }),
  guardian_learner_link: Object.freeze({ activeDays: null, postDeletionDays: 30 }),
  consent_ledger: Object.freeze({ activeDays: null, postDeletionDays: 730 }),
  data_subject_request: Object.freeze({ activeDays: 730, postDeletionDays: 730 }),
  security_audit: Object.freeze({ activeDays: 365, postDeletionDays: 365 }),
})

const TRANSITIONS = Object.freeze({
  received: new Set(['verified', 'rejected']),
  verified: new Set(['processing', 'rejected']),
  processing: new Set(['completed', 'rejected']),
  completed: new Set(),
  rejected: new Set(),
})

const AUDIT_SUFFIX = Object.freeze({
  'export.requested': 'exp_req',
  'export.allowed': 'exp_allow',
  'export.denied': 'exp_deny',
  'export.completed': 'exp_done',
  'deletion.requested': 'del_req',
  'deletion.allowed': 'del_allow',
  'deletion.denied': 'del_deny',
  'deletion.completed': 'del_done',
})

export class DataLifecycleError extends Error {
  constructor(code, status = 403) {
    super(code)
    this.name = 'DataLifecycleError'
    this.code = code
    this.status = status
  }
}

function requireOpaqueId(value, code) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new DataLifecycleError(code, 400)
  return value
}

function normalizeActor(actor) {
  if (!actor || typeof actor !== 'object') throw new DataLifecycleError('actor_context_required', 403)
  const actorId = requireOpaqueId(actor.actorId, 'actor_id_invalid')
  const role = String(actor.role || '')
  if (!['guardian', 'teacher', 'school_admin', 'platform_admin'].includes(role)) throw new DataLifecycleError('actor_role_invalid', 403)
  const tenantId = actor.tenantId == null ? null : requireOpaqueId(actor.tenantId, 'actor_tenant_invalid')
  return Object.freeze({ actorId, role, tenantId })
}

function normalizeRequest(input) {
  if (!input || typeof input !== 'object') throw new DataLifecycleError('data_subject_request_required', 400)
  const requestId = String(input.requestId || '')
  if (!REQUEST_PATTERN.test(requestId)) throw new DataLifecycleError('data_subject_request_id_invalid', 400)
  const requestType = String(input.requestType || '')
  if (!['export', 'delete'].includes(requestType)) throw new DataLifecycleError('data_subject_request_type_invalid', 400)
  const targetType = String(input.targetType || '')
  if (!['adult_account', 'learner_profile'].includes(targetType)) throw new DataLifecycleError('data_subject_target_type_invalid', 400)
  const targetId = requireOpaqueId(input.targetId, 'data_subject_target_id_invalid')
  return Object.freeze({ requestId, requestType, targetType, targetId })
}

function assertNoClientBypassHints(input) {
  if (!input || typeof input !== 'object') return
  const forbidden = ['authorized', 'isGuardian', 'isAdmin', 'tenantBypass', 'skipConsent', 'skipLegalHold', 'forceDelete']
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(input, key)) throw new DataLifecycleError('client_authorization_hint_rejected', 400)
  }
}

async function audit(action, actor, request, outcome, reasonCode, options = {}) {
  const now = options.nowMs ?? Date.now()
  const suffix = AUDIT_SUFFIX[action]
  if (!suffix) throw new DataLifecycleError('lifecycle_audit_action_invalid', 500)
  const eventId = options.auditEventId || `evt_${request.requestId.slice(4, 64)}_${suffix}`
  const requestId = options.auditRequestId || `req:${request.requestId}`
  const correlationId = options.correlationId || `corr:${request.requestId}`
  return recordSecurityAuditEvent({
    eventId,
    occurredAt: new Date(now).toISOString(),
    recordedAt: new Date(now).toISOString(),
    requestId,
    actorId: actor.actorId,
    actorRole: actor.role,
    tenantId: actor.tenantId,
    action,
    targetType: request.targetType,
    targetId: request.targetId,
    outcome,
    reasonCode,
    correlationId,
    policyVersion: POLICY_VERSION,
    metadata: { requestType: request.requestType },
  }, {
    mandatory: true,
    trustedContext: { actorId: actor.actorId, actorRole: actor.role, tenantId: actor.tenantId },
    writeAuditEvent: options.writeAuditEvent,
    previousEventHash: options.previousEventHash,
    nowMs: now,
  })
}

async function authorizeTarget(actor, request, options) {
  if (request.targetType === 'adult_account') {
    if (actor.role !== 'guardian' || actor.actorId !== request.targetId) {
      throw new DataLifecycleError('adult_self_service_only', 403)
    }
    return Object.freeze({ actorId: actor.actorId, role: actor.role, tenantId: null, targetId: request.targetId })
  }

  if (actor.role !== 'guardian') throw new DataLifecycleError('learner_data_guardian_required', 403)
  try {
    await authorizeGuardianLearnerLink(actor, request.targetId, {
      resolveGuardianLearnerLink: options.resolveGuardianLearnerLink,
    })
  } catch (error) {
    throw new DataLifecycleError(error.code || 'guardian_authorization_failed', error.status || 403)
  }
  return Object.freeze({ actorId: actor.actorId, role: actor.role, tenantId: null, targetId: request.targetId })
}

async function resolveDeletionConstraints(request, options) {
  if (typeof options.resolveDeletionConstraints !== 'function') throw new DataLifecycleError('deletion_constraint_resolver_not_configured', 503)
  let result
  try {
    result = await options.resolveDeletionConstraints({ targetType: request.targetType, targetId: request.targetId })
  } catch {
    throw new DataLifecycleError('deletion_constraint_resolver_failed', 503)
  }
  if (!result || typeof result !== 'object') throw new DataLifecycleError('deletion_constraints_invalid', 503)
  return Object.freeze({
    legalHold: result.legalHold === true,
    activeDependency: result.activeDependency === true,
    dependencyCode: result.dependencyCode ? String(result.dependencyCode) : null,
  })
}

export async function authorizeDataSubjectRequest(input, options = {}) {
  assertNoClientBypassHints(input)
  const actor = normalizeActor(options.trustedActor)
  const request = normalizeRequest(input)

  await audit(`${request.requestType === 'delete' ? 'deletion' : 'export'}.requested`, actor, request, 'recorded', 'request_received', options)

  try {
    await authorizeTarget(actor, request, options)
    if (request.requestType === 'delete') {
      const constraints = await resolveDeletionConstraints(request, options)
      if (constraints.legalHold) throw new DataLifecycleError('deletion_blocked_legal_hold', 409)
      if (constraints.activeDependency) throw new DataLifecycleError(constraints.dependencyCode || 'deletion_blocked_active_dependency', 409)
    }
    await audit(`${request.requestType === 'delete' ? 'deletion' : 'export'}.allowed`, actor, request, 'allowed', 'authorization_passed', options)
    return Object.freeze({ ...request, actorId: actor.actorId, authorized: true, policyVersion: POLICY_VERSION })
  } catch (error) {
    try {
      await audit(`${request.requestType === 'delete' ? 'deletion' : 'export'}.denied`, actor, request, 'denied', error.code || 'authorization_denied', options)
    } catch (auditError) {
      if (auditError.code?.startsWith('audit_')) throw auditError
    }
    if (error instanceof DataLifecycleError) throw error
    throw new DataLifecycleError(error.code || 'data_subject_request_denied', error.status || 403)
  }
}

export function transitionDataSubjectRequest(current, nextStatus) {
  if (!current || typeof current !== 'object') throw new DataLifecycleError('data_subject_request_state_required', 400)
  const requestId = String(current.requestId || '')
  if (!REQUEST_PATTERN.test(requestId)) throw new DataLifecycleError('data_subject_request_id_invalid', 400)
  const currentStatus = String(current.status || '')
  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, currentStatus)) throw new DataLifecycleError('data_subject_request_status_invalid', 400)
  if (currentStatus === nextStatus) return Object.freeze({ ...current, idempotent: true })
  if (!TRANSITIONS[currentStatus].has(nextStatus)) throw new DataLifecycleError('data_subject_request_transition_invalid', 409)
  return Object.freeze({ ...current, status: nextStatus, idempotent: false })
}

export function evaluateRetention(recordClass, referenceTime, options = {}) {
  const policy = RETENTION_POLICIES[recordClass]
  if (!policy) throw new DataLifecycleError('retention_record_class_invalid', 400)
  const nowMs = options.nowMs ?? Date.now()
  const referenceMs = new Date(referenceTime).getTime()
  if (!Number.isFinite(referenceMs)) throw new DataLifecycleError('retention_reference_time_invalid', 400)
  if (options.legalHold === true) return Object.freeze({ recordClass, disposition: 'retain', reason: 'legal_hold', policy })
  const days = options.afterDeletion === true ? policy.postDeletionDays : policy.activeDays
  if (days === null) return Object.freeze({ recordClass, disposition: 'retain', reason: 'active_lifecycle', policy })
  const expiresAtMs = referenceMs + days * 86_400_000
  return Object.freeze({
    recordClass,
    disposition: nowMs >= expiresAtMs ? 'eligible_for_reviewed_deletion' : 'retain',
    reason: nowMs >= expiresAtMs ? 'retention_elapsed' : 'retention_active',
    expiresAt: new Date(expiresAtMs).toISOString(),
    policy,
  })
}

export async function materializeTrustedExportField(envelope, expectedContext, options = {}) {
  if (options.trustedServer !== true) throw new DataLifecycleError('trusted_server_export_required', 503)
  return decryptSensitiveString(envelope, expectedContext, { resolveKey: options.resolveKey })
}

export async function markDataSubjectRequestCompleted(request, options = {}) {
  const actor = normalizeActor(options.trustedActor)
  const normalized = normalizeRequest(request)
  await audit(`${normalized.requestType === 'delete' ? 'deletion' : 'export'}.completed`, actor, normalized, 'recorded', 'operation_completed', options)
  return Object.freeze({ requestId: normalized.requestId, completed: true, policyVersion: POLICY_VERSION })
}

export function dataLifecycleContract() {
  return Object.freeze({
    policyVersion: POLICY_VERSION,
    retentionPolicies: RETENTION_POLICIES,
    adultOwnedCloudIdentityOnly: true,
    directChildCloudAuthenticationAllowed: false,
    guardianAuthorizationRequiredForLearnerRequests: true,
    teacherLearnerExportAllowed: false,
    teacherLearnerDeletionAllowed: false,
    platformAdminImplicitBypassAllowed: false,
    legalHoldBypassAllowed: false,
    activeDependencyBypassAllowed: false,
    trustedServerRequiredForSensitiveExportDecryption: true,
    mandatoryAuditForLifecycleDecisions: true,
    liveDeletionEnabled: false,
    liveExportEnabled: false,
    livePersistenceEnabled: false,
    syntheticPreviewOnly: true,
    retentionDurationsAreProductPreviewPolicyNotLegalAdvice: true,
  })
}