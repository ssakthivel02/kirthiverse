import { AuditSecurityError, buildAuditEvent } from './audit-security.mjs'

const KEY_VERSION_PATTERN = /^[A-Za-z0-9._-]{1,32}$/
const HASH_PATTERN = /^[a-f0-9]{64}$/
const MAC_PATTERN = /^[A-Za-z0-9_-]{43}$/
const GENESIS_HASH = '0'.repeat(64)

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`
}

function encodeBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function requireKeyVersion(value) {
  const keyVersion = String(value || '')
  if (!KEY_VERSION_PATTERN.test(keyVersion)) throw new AuditSecurityError('audit_integrity_key_version_invalid', 400)
  return keyVersion
}

function requirePreviousHash(value) {
  const previousEventHash = value || GENESIS_HASH
  if (!HASH_PATTERN.test(previousEventHash)) throw new AuditSecurityError('audit_previous_hash_invalid', 400)
  return previousEventHash
}

function requireHmacKey(key) {
  if (!(key instanceof CryptoKey)) throw new AuditSecurityError('audit_integrity_key_invalid', 503)
  if (key.algorithm?.name !== 'HMAC' || key.algorithm?.hash?.name !== 'SHA-256') {
    throw new AuditSecurityError('audit_integrity_key_algorithm_invalid', 503)
  }
  if (!key.usages.includes('sign') || !key.usages.includes('verify')) {
    throw new AuditSecurityError('audit_integrity_key_usage_invalid', 503)
  }
  return key
}

async function resolveIntegrityKey(keyVersion, options) {
  if (typeof options?.resolveIntegrityKey !== 'function') {
    throw new AuditSecurityError('audit_integrity_key_resolver_not_configured', 503)
  }
  let key
  try {
    key = await options.resolveIntegrityKey({ keyVersion })
  } catch (error) {
    if (error instanceof AuditSecurityError) throw error
    throw new AuditSecurityError('audit_integrity_key_resolver_failed', 503)
  }
  if (!key) throw new AuditSecurityError('audit_integrity_key_not_found', 503)
  return requireHmacKey(key)
}

async function computeMac(event, keyVersion, key) {
  const payload = canonicalize({ schema: 'kvs-audit-integrity-v1', keyVersion, event })
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return encodeBase64Url(new Uint8Array(signature))
}

export async function buildIntegrityProtectedAuditEvent(input, options = {}) {
  const keyVersion = requireKeyVersion(options.keyVersion)
  const previousEventHash = requirePreviousHash(options.previousEventHash)
  const key = await resolveIntegrityKey(keyVersion, options)
  const event = await buildAuditEvent(input, { ...options, previousEventHash })
  const integrityMac = await computeMac(event, keyVersion, key)
  return Object.freeze({
    ...event,
    integrity: Object.freeze({ schema: 'kvs-audit-integrity-v1', keyVersion, mac: integrityMac }),
  })
}

export async function verifyIntegrityProtectedAuditEvent(event, options = {}) {
  if (!event || typeof event !== 'object' || !event.integrity || event.integrity.schema !== 'kvs-audit-integrity-v1') {
    throw new AuditSecurityError('audit_integrity_envelope_invalid', 400)
  }
  const keyVersion = requireKeyVersion(event.integrity.keyVersion)
  const mac = String(event.integrity.mac || '')
  if (!MAC_PATTERN.test(mac)) throw new AuditSecurityError('audit_integrity_mac_invalid', 400)
  const key = await resolveIntegrityKey(keyVersion, options)
  const { integrity, ...baseEvent } = event
  const expected = await computeMac(baseEvent, keyVersion, key)
  if (expected !== mac) throw new AuditSecurityError('audit_integrity_verification_failed', 403)
  return true
}

export async function appendIntegrityProtectedAuditEvent(input, options = {}) {
  if (typeof options.resolveAuditHead !== 'function') {
    throw new AuditSecurityError('audit_head_resolver_not_configured', 503)
  }
  if (typeof options.compareAndAppendAuditEvent !== 'function') {
    throw new AuditSecurityError('audit_compare_append_writer_not_configured', 503)
  }

  let previousEventHash
  try {
    previousEventHash = requirePreviousHash(await options.resolveAuditHead())
  } catch (error) {
    if (error instanceof AuditSecurityError) throw error
    throw new AuditSecurityError('audit_head_resolver_failed', 503)
  }

  const event = await buildIntegrityProtectedAuditEvent(input, { ...options, previousEventHash })

  let result
  try {
    result = await options.compareAndAppendAuditEvent({ event, expectedPreviousHash: previousEventHash })
  } catch (error) {
    if (error instanceof AuditSecurityError) throw error
    throw new AuditSecurityError('audit_compare_append_writer_failed', 503)
  }

  if (!result || result.accepted !== true) throw new AuditSecurityError('audit_append_conflict', 409)
  return Object.freeze({ recorded: true, event })
}

export function auditIntegrityHardeningContract() {
  return Object.freeze({
    schema: 'kvs-audit-integrity-v1',
    keyedIntegrity: 'HMAC-SHA-256',
    explicitKeyVersionRequired: true,
    existingAuditAllowListsPreserved: true,
    trustedContextChecksPreserved: true,
    trustedHeadResolverRequired: true,
    atomicCompareAndAppendRequired: true,
    appendConflictFailsClosed: true,
    durableStoreConnected: false,
    productionKeyProvisioned: false,
    liveAuditPersistenceEnabled: false,
  })
}
