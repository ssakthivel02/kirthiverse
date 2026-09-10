const ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const EVENT_ID_PATTERN = /^evt_[A-Za-z0-9_-]{12,96}$/
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,160}$/
const HASH_PATTERN = /^[a-f0-9]{64}$/
const MAX_METADATA_DEPTH = 4
const MAX_METADATA_KEYS = 24
const MAX_EVENT_BYTES = 8192
const MAX_CLOCK_SKEW_MS = 60_000
const GENESIS_HASH = '0'.repeat(64)

const ALLOWED_ROLES = new Set(['guardian', 'teacher', 'school_admin', 'platform_admin'])
const ALLOWED_ACTIONS = new Set([
  'auth.login.allowed',
  'auth.login.denied',
  'guardian.consent.checked',
  'guardian.consent.denied',
  'tenant.access.allowed',
  'tenant.access.denied',
  'sensitive.encrypt',
  'sensitive.decrypt',
  'export.requested',
  'deletion.requested',
  'admin.breakglass.denied',
])
const ALLOWED_OUTCOMES = new Set(['allowed', 'denied', 'recorded'])
const FORBIDDEN_KEYS = new Set([
  'password', 'token', 'authorization', 'jwt', 'secret', 'email', 'childname',
  'displaynameplaintext', 'keymaterial', 'privatekey',
])

export class AuditSecurityError extends Error {
  constructor(code, status = 403) {
    super(code)
    this.name = 'AuditSecurityError'
    this.code = code
    this.status = status
  }
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function requireOpaqueId(value, code) {
  const text = String(value || '')
  if (!ID_PATTERN.test(text)) throw new AuditSecurityError(code, 400)
  return text
}

function validateMetadata(value, depth = 0, state = { keys: 0 }) {
  if (depth > MAX_METADATA_DEPTH) throw new AuditSecurityError('audit_metadata_too_deep', 400)
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'string' && /bearer\s+[A-Za-z0-9._~-]+/i.test(value)) throw new AuditSecurityError('audit_sensitive_value_rejected', 400)
    if (typeof value === 'string' && value.split('.').length === 3 && value.length > 80) throw new AuditSecurityError('audit_jwt_rejected', 400)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) validateMetadata(item, depth + 1, state)
    return
  }
  if (typeof value !== 'object') throw new AuditSecurityError('audit_metadata_invalid', 400)
  for (const [key, nested] of Object.entries(value)) {
    state.keys += 1
    if (state.keys > MAX_METADATA_KEYS) throw new AuditSecurityError('audit_metadata_too_many_keys', 400)
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) throw new AuditSecurityError('audit_sensitive_key_rejected', 400)
    validateMetadata(nested, depth + 1, state)
  }
}

function normalizeBaseEvent(input, trustedContext = {}, nowMs = Date.now()) {
  if (!input || typeof input !== 'object') throw new AuditSecurityError('audit_event_required', 400)
  const eventId = String(input.eventId || '')
  if (!EVENT_ID_PATTERN.test(eventId)) throw new AuditSecurityError('audit_event_id_invalid', 400)
  const occurredAt = new Date(input.occurredAt).getTime()
  const recordedAt = new Date(input.recordedAt).getTime()
  if (!Number.isFinite(occurredAt) || !Number.isFinite(recordedAt)) throw new AuditSecurityError('audit_timestamp_invalid', 400)
  if (occurredAt > nowMs + MAX_CLOCK_SKEW_MS || recordedAt > nowMs + MAX_CLOCK_SKEW_MS) throw new AuditSecurityError('audit_timestamp_in_future', 400)
  if (recordedAt + MAX_CLOCK_SKEW_MS < occurredAt) throw new AuditSecurityError('audit_recorded_before_occurred', 400)

  const actorId = requireOpaqueId(input.actorId, 'audit_actor_id_invalid')
  const actorRole = String(input.actorRole || '')
  if (!ALLOWED_ROLES.has(actorRole)) throw new AuditSecurityError('audit_actor_role_invalid', 400)
  const tenantId = input.tenantId === null || input.tenantId === undefined ? null : requireOpaqueId(input.tenantId, 'audit_tenant_id_invalid')
  const targetId = requireOpaqueId(input.targetId, 'audit_target_id_invalid')
  const action = String(input.action || '')
  if (!ALLOWED_ACTIONS.has(action)) throw new AuditSecurityError('audit_action_not_allowed', 400)
  const outcome = String(input.outcome || '')
  if (!ALLOWED_OUTCOMES.has(outcome)) throw new AuditSecurityError('audit_outcome_invalid', 400)
  const requestId = String(input.requestId || '')
  const correlationId = String(input.correlationId || '')
  if (!REQUEST_ID_PATTERN.test(requestId) || !REQUEST_ID_PATTERN.test(correlationId)) throw new AuditSecurityError('audit_request_id_invalid', 400)

  if (trustedContext.actorId && trustedContext.actorId !== actorId) throw new AuditSecurityError('audit_actor_spoof_rejected', 403)
  if (trustedContext.actorRole && trustedContext.actorRole !== actorRole) throw new AuditSecurityError('audit_actor_role_mismatch', 403)
  if ('tenantId' in trustedContext && trustedContext.tenantId !== tenantId) throw new AuditSecurityError('audit_tenant_spoof_rejected', 403)

  const metadata = input.metadata ?? {}
  validateMetadata(metadata)

  const event = {
    eventId,
    occurredAt: new Date(occurredAt).toISOString(),
    recordedAt: new Date(recordedAt).toISOString(),
    requestId,
    actorId,
    actorRole,
    tenantId,
    action,
    targetType: String(input.targetType || ''),
    targetId,
    outcome,
    reasonCode: String(input.reasonCode || ''),
    correlationId,
    policyVersion: String(input.policyVersion || ''),
    metadata,
  }
  if (!event.targetType || !event.reasonCode || !event.policyVersion) throw new AuditSecurityError('audit_required_field_missing', 400)
  if (new TextEncoder().encode(canonicalize(event)).length > MAX_EVENT_BYTES) throw new AuditSecurityError('audit_event_too_large', 413)
  return event
}

export async function buildAuditEvent(input, options = {}) {
  const previousEventHash = options.previousEventHash || GENESIS_HASH
  if (!HASH_PATTERN.test(previousEventHash)) throw new AuditSecurityError('audit_previous_hash_invalid', 400)
  const base = normalizeBaseEvent(input, options.trustedContext || {}, options.nowMs)
  const eventHash = await sha256Hex(`${canonicalize(base)}|${previousEventHash}`)
  return Object.freeze({ ...base, previousEventHash, eventHash })
}

export async function verifyAuditChain(events) {
  if (!Array.isArray(events)) throw new AuditSecurityError('audit_chain_invalid', 400)
  let expectedPrevious = GENESIS_HASH
  for (const event of events) {
    if (event.previousEventHash !== expectedPrevious) return false
    const { previousEventHash, eventHash, ...base } = event
    if (!HASH_PATTERN.test(String(eventHash || ''))) return false
    const expectedHash = await sha256Hex(`${canonicalize(base)}|${previousEventHash}`)
    if (expectedHash !== eventHash) return false
    expectedPrevious = eventHash
  }
  return true
}

export async function recordSecurityAuditEvent(input, options = {}) {
  const mandatory = options.mandatory !== false
  if (typeof options.writeAuditEvent !== 'function') {
    if (mandatory) throw new AuditSecurityError('audit_sink_not_configured', 503)
    return Object.freeze({ recorded: false, mandatory: false })
  }
  const event = await buildAuditEvent(input, options)
  try {
    const written = await options.writeAuditEvent(event)
    if (written !== true) throw new Error('audit sink rejected event')
  } catch (error) {
    if (error instanceof AuditSecurityError) throw error
    if (mandatory) throw new AuditSecurityError('audit_sink_failed', 503)
    return Object.freeze({ recorded: false, mandatory: false })
  }
  return Object.freeze({ recorded: true, mandatory, event })
}

export function auditSecurityContract() {
  return Object.freeze({
    tamperEvidentHashChain: true,
    externalImmutabilityClaimed: false,
    nonRepudiationClaimed: false,
    trustedServerSinkRequiredForMandatoryEvents: true,
    syntheticPreviewOnly: true,
    liveAuditPersistenceEnabled: false,
    genesisHash: GENESIS_HASH,
    maxEventBytes: MAX_EVENT_BYTES,
  })
}
