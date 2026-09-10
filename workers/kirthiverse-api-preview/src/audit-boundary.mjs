const ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const EVENT_ID_PATTERN = /^kvs_evt_[A-Za-z0-9_-]{12,96}$/
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,96}$/
const ACTION_PATTERN = /^[a-z0-9._:-]{3,80}$/
const TARGET_PATTERN = /^[a-z0-9._:-]{3,48}$/
const KEY_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,32}$/
const HASH_PATTERN = /^[A-Za-z0-9_-]{43}$/
const MAX_METADATA_BYTES = 4096

const FORBIDDEN_METADATA_KEYS = new Set([
  'password', 'passwd', 'secret', 'token', 'authorization', 'cookie', 'email', 'phone',
  'displayname', 'display_name', 'plaintext', 'ciphertext', 'provider_subject', 'subject',
])

export class AuditBoundaryError extends Error {
  constructor(code, status = 503) {
    super(code)
    this.name = 'AuditBoundaryError'
    this.code = code
    this.status = status
  }
}

function encodeBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function utf8(value) {
  return new TextEncoder().encode(value)
}

function stable(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(stable)
  return Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = stable(value[key])
    return acc
  }, {})
}

function stableJson(value) {
  return JSON.stringify(stable(value))
}

function requirePattern(value, pattern, code) {
  if (typeof value !== 'string' || !pattern.test(value)) throw new AuditBoundaryError(code)
  return value
}

function validateMetadata(metadata) {
  if (metadata == null) return null
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new AuditBoundaryError('audit_metadata_invalid', 400)
  }

  const visit = (value, depth = 0) => {
    if (depth > 6) throw new AuditBoundaryError('audit_metadata_too_deep', 400)
    if (Array.isArray(value)) {
      if (value.length > 64) throw new AuditBoundaryError('audit_metadata_array_too_large', 400)
      for (const item of value) visit(item, depth + 1)
      return
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value)
      if (keys.length > 64) throw new AuditBoundaryError('audit_metadata_object_too_large', 400)
      for (const key of keys) {
        const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '')
        if (FORBIDDEN_METADATA_KEYS.has(normalized)) {
          throw new AuditBoundaryError('audit_sensitive_metadata_forbidden', 400)
        }
        visit(value[key], depth + 1)
      }
      return
    }
    if (!['string', 'number', 'boolean'].includes(typeof value) && value !== null) {
      throw new AuditBoundaryError('audit_metadata_value_invalid', 400)
    }
    if (typeof value === 'string' && value.length > 512) {
      throw new AuditBoundaryError('audit_metadata_string_too_long', 400)
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new AuditBoundaryError('audit_metadata_number_invalid', 400)
    }
  }

  visit(metadata)
  const bytes = utf8(stableJson(metadata)).byteLength
  if (bytes > MAX_METADATA_BYTES) throw new AuditBoundaryError('audit_metadata_too_large', 400)
  return stable(metadata)
}

function validateEventDraft(draft) {
  if (!draft || typeof draft !== 'object') throw new AuditBoundaryError('audit_event_invalid', 400)

  const actorId = draft.actorId == null ? null : requirePattern(draft.actorId, ID_PATTERN, 'audit_actor_id_invalid')
  const targetId = draft.targetId == null ? null : requirePattern(draft.targetId, ID_PATTERN, 'audit_target_id_invalid')

  return {
    eventId: requirePattern(draft.eventId, EVENT_ID_PATTERN, 'audit_event_id_invalid'),
    actorId,
    action: requirePattern(draft.action, ACTION_PATTERN, 'audit_action_invalid'),
    targetType: requirePattern(draft.targetType, TARGET_PATTERN, 'audit_target_type_invalid'),
    targetId,
    requestId: requirePattern(draft.requestId, REQUEST_ID_PATTERN, 'audit_request_id_invalid'),
    occurredAt: requirePattern(draft.occurredAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'audit_occurred_at_invalid'),
    metadata: validateMetadata(draft.metadata),
  }
}

function validateHmacKey(key) {
  if (!(key instanceof CryptoKey)) throw new AuditBoundaryError('audit_integrity_key_invalid')
  if (key.algorithm?.name !== 'HMAC' || key.algorithm?.hash?.name !== 'SHA-256') {
    throw new AuditBoundaryError('audit_integrity_key_algorithm_invalid')
  }
  if (!key.usages.includes('sign') || !key.usages.includes('verify')) {
    throw new AuditBoundaryError('audit_integrity_key_usage_invalid')
  }
  return key
}

async function resolveIntegrityKey(keyVersion, options) {
  requirePattern(keyVersion, KEY_VERSION_PATTERN, 'audit_integrity_key_version_invalid')
  if (typeof options?.resolveIntegrityKey !== 'function') {
    throw new AuditBoundaryError('audit_integrity_key_resolver_not_configured')
  }
  let key
  try {
    key = await options.resolveIntegrityKey({ keyVersion })
  } catch (error) {
    if (error instanceof AuditBoundaryError) throw error
    throw new AuditBoundaryError('audit_integrity_key_resolver_failed')
  }
  if (!key) throw new AuditBoundaryError('audit_integrity_key_not_found')
  return validateHmacKey(key)
}

function canonicalPayload(event, previousHash, keyVersion) {
  return stableJson({
    schema: 'kvs-audit-v1',
    keyVersion,
    previousHash,
    event,
  })
}

async function computeEventHash(event, previousHash, keyVersion, key) {
  const signature = await crypto.subtle.sign('HMAC', key, utf8(canonicalPayload(event, previousHash, keyVersion)))
  return encodeBase64Url(new Uint8Array(signature))
}

export async function createIntegrityProtectedAuditEvent(draft, options = {}) {
  const event = validateEventDraft(draft)
  const keyVersion = requirePattern(options.keyVersion, KEY_VERSION_PATTERN, 'audit_integrity_key_version_invalid')
  const previousHash = options.previousHash == null ? null : requirePattern(options.previousHash, HASH_PATTERN, 'audit_previous_hash_invalid')
  const key = await resolveIntegrityKey(keyVersion, options)
  const eventHash = await computeEventHash(event, previousHash, keyVersion, key)

  return Object.freeze({
    schema: 'kvs-audit-v1',
    keyVersion,
    previousHash,
    event,
    eventHash,
  })
}

export async function verifyIntegrityProtectedAuditEvent(envelope, options = {}) {
  if (!envelope || typeof envelope !== 'object' || envelope.schema !== 'kvs-audit-v1') {
    throw new AuditBoundaryError('audit_envelope_invalid')
  }
  const event = validateEventDraft(envelope.event)
  const keyVersion = requirePattern(envelope.keyVersion, KEY_VERSION_PATTERN, 'audit_integrity_key_version_invalid')
  const previousHash = envelope.previousHash == null ? null : requirePattern(envelope.previousHash, HASH_PATTERN, 'audit_previous_hash_invalid')
  const eventHash = requirePattern(envelope.eventHash, HASH_PATTERN, 'audit_event_hash_invalid')
  const key = await resolveIntegrityKey(keyVersion, options)
  const expected = await computeEventHash(event, previousHash, keyVersion, key)
  if (expected !== eventHash) throw new AuditBoundaryError('audit_integrity_verification_failed', 403)
  return true
}

export async function appendAuditEvent(draft, options = {}) {
  if (typeof options.resolveAuditHead !== 'function') throw new AuditBoundaryError('audit_head_resolver_not_configured')
  if (typeof options.appendAuditRecord !== 'function') throw new AuditBoundaryError('audit_writer_not_configured')

  let previousHash
  try {
    previousHash = await options.resolveAuditHead()
  } catch {
    throw new AuditBoundaryError('audit_head_resolver_failed')
  }
  if (previousHash != null) requirePattern(previousHash, HASH_PATTERN, 'audit_previous_hash_invalid')

  const envelope = await createIntegrityProtectedAuditEvent(draft, {
    ...options,
    previousHash,
  })

  let result
  try {
    result = await options.appendAuditRecord({
      envelope,
      expectedPreviousHash: previousHash,
    })
  } catch {
    throw new AuditBoundaryError('audit_writer_failed')
  }

  if (!result || result.accepted !== true) throw new AuditBoundaryError('audit_append_conflict', 409)
  return envelope
}

export function auditIntegrityContract() {
  return Object.freeze({
    schema: 'kvs-audit-v1',
    integrity: 'HMAC-SHA-256',
    appendOnlyWriterRequired: true,
    compareAndAppendRequired: true,
    keyVersionRequired: true,
    sensitiveMetadataForbidden: true,
    durableStoreConnected: false,
  })
}
