const PRIVATE_CIDR_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^127\./,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^::1$/,
]
const PUBLIC_WILDCARDS = new Set(['0.0.0.0/0', '::/0'])
const CLIENT_HINTS = new Set([
  'databaseUrl', 'dbUrl', 'dbHost', 'dbPort', 'dbUser', 'dbPassword', 'mysqlUrl',
  'networkCidrs', 'allowedCidrs', 'skipTls', 'disableTls', 'bypassNetworkPolicy',
  'directDatabase', 'directDb', 'query', 'sql',
])
const ALLOWED_OPERATIONS = new Set([
  'adult_account.resolve',
  'guardian_learner_link.resolve',
  'school_membership.resolve',
  'consent_ledger.resolve',
  'learner_progress.read',
  'learner_progress.write',
  'data_subject_request.read',
  'data_subject_request.write',
  'audit_event.append',
])

export class PersistenceSecurityError extends Error {
  constructor(code, status = 503) {
    super(code)
    this.name = 'PersistenceSecurityError'
    this.code = code
    this.status = status
  }
}

function requireString(value, code, min = 1, max = 512) {
  if (typeof value !== 'string') throw new PersistenceSecurityError(code)
  const normalized = value.trim()
  if (normalized.length < min || normalized.length > max) throw new PersistenceSecurityError(code)
  return normalized
}

function rejectClientHints(clientInput) {
  if (!clientInput || typeof clientInput !== 'object' || Array.isArray(clientInput)) return
  for (const key of Object.keys(clientInput)) {
    if (CLIENT_HINTS.has(key)) throw new PersistenceSecurityError('client_persistence_override_rejected', 400)
  }
}

function cidrIsPrivateOrLoopback(cidr) {
  const address = String(cidr).split('/')[0]
  return PRIVATE_CIDR_PATTERNS.some((pattern) => pattern.test(address))
}

export function validateNetworkAttestation(attestation = {}) {
  if (!attestation || typeof attestation !== 'object' || Array.isArray(attestation)) {
    throw new PersistenceSecurityError('database_network_attestation_required')
  }
  if (attestation.source !== 'trusted-server-network-policy') {
    throw new PersistenceSecurityError('database_network_attestation_untrusted')
  }
  if (attestation.tlsRequired !== true) throw new PersistenceSecurityError('database_tls_required')
  if (attestation.browserReachable === true) throw new PersistenceSecurityError('browser_database_reachability_rejected')
  if (attestation.publicInternetReachable === true) throw new PersistenceSecurityError('public_database_reachability_rejected')
  if (!Array.isArray(attestation.allowedCidrs) || attestation.allowedCidrs.length === 0 || attestation.allowedCidrs.length > 32) {
    throw new PersistenceSecurityError('database_allowed_cidrs_invalid')
  }

  const cidrs = attestation.allowedCidrs.map((cidr) => requireString(cidr, 'database_allowed_cidrs_invalid', 3, 64))
  for (const cidr of cidrs) {
    if (PUBLIC_WILDCARDS.has(cidr)) throw new PersistenceSecurityError('public_database_cidr_rejected')
    if (!cidrIsPrivateOrLoopback(cidr)) throw new PersistenceSecurityError('database_private_network_required')
  }

  return Object.freeze({
    source: attestation.source,
    tlsRequired: true,
    browserReachable: false,
    publicInternetReachable: false,
    allowedCidrs: Object.freeze([...cidrs]),
  })
}

export function validatePersistenceAdapter(adapter, options = {}) {
  rejectClientHints(options.clientInput)
  if (options.trustedServer !== true) throw new PersistenceSecurityError('trusted_server_persistence_required')
  if (!adapter || typeof adapter !== 'object') throw new PersistenceSecurityError('persistence_adapter_required')
  if (adapter.syntheticPreview !== true) throw new PersistenceSecurityError('synthetic_preview_adapter_required')
  if (adapter.browserCallable === true) throw new PersistenceSecurityError('browser_callable_adapter_rejected')
  if (typeof adapter.executeOperation !== 'function') throw new PersistenceSecurityError('persistence_operation_executor_required')

  const network = validateNetworkAttestation(adapter.networkAttestation)
  return Object.freeze({
    syntheticPreview: true,
    browserCallable: false,
    network,
    executeOperation: adapter.executeOperation,
  })
}

export async function executeRestrictedPersistenceOperation(adapter, request, options = {}) {
  const validated = validatePersistenceAdapter(adapter, options)
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new PersistenceSecurityError('persistence_request_invalid', 400)
  }
  const operation = requireString(request.operation, 'persistence_operation_invalid', 3, 80)
  if (!ALLOWED_OPERATIONS.has(operation)) throw new PersistenceSecurityError('persistence_operation_not_allowed', 403)
  if (Object.hasOwn(request, 'sql') || Object.hasOwn(request, 'query')) {
    throw new PersistenceSecurityError('arbitrary_sql_rejected', 400)
  }
  if (!request.context || request.context.trustedAuthorization !== true) {
    throw new PersistenceSecurityError('trusted_authorization_context_required', 403)
  }
  if (request.context.realChildData === true) {
    throw new PersistenceSecurityError('real_child_cloud_data_rejected', 403)
  }
  if (request.context.tenantBypass === true || request.context.platformAdminBypass === true) {
    throw new PersistenceSecurityError('persistence_authorization_bypass_rejected', 403)
  }

  try {
    return await validated.executeOperation({
      operation,
      parameters: request.parameters ?? {},
      context: Object.freeze({
        trustedAuthorization: true,
        realChildData: false,
        tenantId: request.context.tenantId ?? null,
        actorId: request.context.actorId ?? null,
      }),
    })
  } catch (error) {
    if (error instanceof PersistenceSecurityError) throw error
    throw new PersistenceSecurityError('persistence_backend_failed', 503)
  }
}

export function persistenceSecurityContract() {
  return Object.freeze({
    trustedServerPersistenceRequired: true,
    trustedNetworkAttestationRequired: true,
    tlsRequired: true,
    publicInternetDatabaseAccessAllowed: false,
    publicWildcardCidrsAllowed: false,
    browserDirectDatabaseAccessAllowed: false,
    browserDatabaseCredentialsAllowed: false,
    arbitrarySqlAllowed: false,
    operationAllowListRequired: true,
    trustedAuthorizationContextRequired: true,
    tenantBypassAllowed: false,
    platformAdminImplicitBypassAllowed: false,
    realChildCloudDataAllowed: false,
    liveDatabaseBindingEnabled: false,
    liveAivenConnectivityClaimed: false,
    schemaAppliedClaimed: false,
    syntheticPreviewOnly: true,
  })
}
