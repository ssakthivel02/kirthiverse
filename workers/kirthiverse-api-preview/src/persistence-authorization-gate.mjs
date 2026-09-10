const OPAQUE_ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const ALLOWED_WRITE_OPERATIONS = new Set([
  'learner_progress.write',
  'data_subject_request.write',
  'audit_event.append',
])
const CONSENT_REQUIRED_OPERATIONS = new Set(['learner_progress.write'])
const ENCRYPTION_REQUIRED_OPERATIONS = new Set(['learner_progress.write'])

export class PersistenceAuthorizationGateError extends Error {
  constructor(code, status = 403) {
    super(code)
    this.name = 'PersistenceAuthorizationGateError'
    this.code = code
    this.status = status
  }
}

function requireOpaqueId(value, code, nullable = false) {
  if (nullable && (value === null || value === undefined)) return null
  const text = String(value || '')
  if (!OPAQUE_ID_PATTERN.test(text)) throw new PersistenceAuthorizationGateError(code, 400)
  return text
}

function requireTrustedAttestation(value, source, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PersistenceAuthorizationGateError(code)
  }
  if (value.source !== source || value.verified !== true) {
    throw new PersistenceAuthorizationGateError(code)
  }
  return value
}

export function authorizeFuturePersistence(request, attestations = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new PersistenceAuthorizationGateError('persistence_authorization_request_invalid', 400)
  }

  const operation = String(request.operation || '')
  if (!ALLOWED_WRITE_OPERATIONS.has(operation)) {
    throw new PersistenceAuthorizationGateError('persistence_write_operation_not_allowed')
  }
  if (request.realChildData === true) {
    throw new PersistenceAuthorizationGateError('real_child_cloud_data_rejected')
  }
  if (request.tenantBypass === true || request.platformAdminBypass === true) {
    throw new PersistenceAuthorizationGateError('persistence_authorization_bypass_rejected')
  }

  const actorId = requireOpaqueId(request.actorId, 'persistence_actor_id_invalid')
  const tenantId = requireOpaqueId(request.tenantId, 'persistence_tenant_id_invalid', true)

  const auth = requireTrustedAttestation(
    attestations.authorization,
    'trusted-kirthiverse-authorization',
    'trusted_authorization_attestation_required',
  )
  if (auth.actorId !== actorId || (auth.tenantId ?? null) !== tenantId) {
    throw new PersistenceAuthorizationGateError('authorization_context_mismatch')
  }
  if (auth.operation !== operation || auth.allowed !== true) {
    throw new PersistenceAuthorizationGateError('operation_authorization_denied')
  }

  const persistence = requireTrustedAttestation(
    attestations.persistence,
    'trusted-persistence-security-boundary',
    'trusted_persistence_attestation_required',
  )
  if (persistence.liveBindingEnabled === true || persistence.networkRestricted !== true) {
    throw new PersistenceAuthorizationGateError('persistence_boundary_not_ready')
  }

  if (CONSENT_REQUIRED_OPERATIONS.has(operation)) {
    const consent = requireTrustedAttestation(
      attestations.consent,
      'trusted-guardian-consent-ledger',
      'trusted_consent_attestation_required',
    )
    if (consent.actorId !== actorId || consent.tenantId !== tenantId || consent.purpose !== 'learner_progress_persistence' || consent.active !== true) {
      throw new PersistenceAuthorizationGateError('guardian_consent_not_authorized')
    }
  }

  if (ENCRYPTION_REQUIRED_OPERATIONS.has(operation)) {
    const encryption = requireTrustedAttestation(
      attestations.encryption,
      'trusted-encryption-boundary',
      'trusted_encryption_attestation_required',
    )
    if (encryption.ciphertextOnly !== true || encryption.keyResolvedServerSide !== true || encryption.browserKeyMaterialPresent === true) {
      throw new PersistenceAuthorizationGateError('encryption_boundary_not_satisfied')
    }
  }

  const audit = requireTrustedAttestation(
    attestations.audit,
    'trusted-audit-integrity-boundary',
    'trusted_audit_attestation_required',
  )
  if (audit.actorId !== actorId || (audit.tenantId ?? null) !== tenantId || audit.operation !== operation || audit.readyForAtomicAppend !== true) {
    throw new PersistenceAuthorizationGateError('audit_boundary_not_satisfied')
  }

  return Object.freeze({
    trustedAuthorization: true,
    operation,
    actorId,
    tenantId,
    realChildData: false,
    tenantBypass: false,
    platformAdminBypass: false,
    previewOnly: true,
  })
}

export function persistenceAuthorizationGateContract() {
  return Object.freeze({
    syntheticPreviewOnly: true,
    liveWritesEnabled: false,
    realChildCloudDataAllowed: false,
    directBrowserDatabaseAccessAllowed: false,
    trustedAuthorizationRequired: true,
    tenantIsolationRequired: true,
    guardianConsentRequiredForLearnerProgress: true,
    ciphertextOnlyRequiredForLearnerProgress: true,
    auditIntegrityRequiredBeforeFutureWrite: true,
    restrictedPersistenceBoundaryRequired: true,
    implicitPlatformAdminBypassAllowed: false,
  })
}
