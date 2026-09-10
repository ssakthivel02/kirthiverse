import { recordSecurityAuditEvent } from './audit-security.mjs'

const ACTOR_ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const NETWORK_ID_PATTERN = /^net_[A-Za-z0-9_-]{12,96}$/
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,160}$/
const POLICY_VERSION = 'kvs-rate-limit-preview-v1'
const MAX_RETRY_AFTER_SECONDS = 3600

const POLICY_DEFINITIONS = Object.freeze({
  auth_login: Object.freeze({
    capacity: 5,
    refillTokens: 5,
    refillIntervalMs: 300_000,
    requireActor: false,
    requireTrustedNetwork: true,
    backendFailure: 'closed',
    auditOnDenied: false,
    classification: 'security-sensitive-preauth',
  }),
  dsr_sensitive: Object.freeze({
    capacity: 3,
    refillTokens: 3,
    refillIntervalMs: 3_600_000,
    requireActor: true,
    requireTrustedNetwork: false,
    backendFailure: 'closed',
    auditOnDenied: true,
    classification: 'security-sensitive',
  }),
  learner_sync: Object.freeze({
    capacity: 60,
    refillTokens: 60,
    refillIntervalMs: 60_000,
    requireActor: true,
    requireTrustedNetwork: false,
    backendFailure: 'closed',
    auditOnDenied: true,
    classification: 'authenticated-write',
  }),
  public_read: Object.freeze({
    capacity: 120,
    refillTokens: 120,
    refillIntervalMs: 60_000,
    requireActor: false,
    requireTrustedNetwork: true,
    backendFailure: 'open',
    auditOnDenied: false,
    classification: 'public-read',
  }),
  admin_sensitive: Object.freeze({
    capacity: 10,
    refillTokens: 10,
    refillIntervalMs: 60_000,
    requireActor: true,
    requireTrustedNetwork: false,
    backendFailure: 'closed',
    auditOnDenied: true,
    classification: 'security-sensitive',
  }),
})

const CLIENT_NETWORK_HINTS = [
  'clientNetworkId',
  'forwardedFor',
  'xForwardedFor',
  'cfConnectingIp',
  'ipAddress',
]

export class RateLimitError extends Error {
  constructor(code, status = 429, details = {}) {
    super(code)
    this.name = 'RateLimitError'
    this.code = code
    this.status = status
    this.retryAfterSeconds = details.retryAfterSeconds ?? null
  }
}

function requirePolicy(policyId) {
  const id = String(policyId || '')
  const policy = POLICY_DEFINITIONS[id]
  if (!policy) throw new RateLimitError('rate_limit_policy_unknown', 400)
  return { id, policy }
}

function rejectClientNetworkHints(input) {
  for (const key of CLIENT_NETWORK_HINTS) {
    if (input && Object.prototype.hasOwnProperty.call(input, key)) {
      throw new RateLimitError('rate_limit_client_network_hint_rejected', 400)
    }
  }
}

function normalizeActorId(value, required) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new RateLimitError('rate_limit_actor_required', 401)
    return null
  }
  const actorId = String(value)
  if (!ACTOR_ID_PATTERN.test(actorId)) throw new RateLimitError('rate_limit_actor_invalid', 400)
  return actorId
}

function normalizeTrustedNetwork(trustedEdge, required) {
  if (!trustedEdge || typeof trustedEdge !== 'object' || !trustedEdge.networkId) {
    if (required) throw new RateLimitError('rate_limit_trusted_network_required', 503)
    return null
  }
  const networkId = String(trustedEdge.networkId)
  if (!NETWORK_ID_PATTERN.test(networkId)) throw new RateLimitError('rate_limit_trusted_network_invalid', 503)
  return networkId
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function deriveRateLimitKey(input, options = {}) {
  rejectClientNetworkHints(input)
  const { id, policy } = requirePolicy(input?.policyId)
  const actorId = normalizeActorId(input?.actorId, policy.requireActor)
  const networkId = normalizeTrustedNetwork(options.trustedEdge, policy.requireTrustedNetwork)
  const keySalt = String(options.keySalt || '')
  if (keySalt.length < 16) throw new RateLimitError('rate_limit_key_salt_required', 503)
  const identity = [id, actorId || '-', networkId || '-'].join('|')
  return `rl_${await sha256Hex(`${keySalt}|${identity}`)}`
}

export function consumeTokenBucketState(state, policyId, nowMs) {
  const { policy } = requirePolicy(policyId)
  const now = Number(nowMs)
  if (!Number.isFinite(now) || now < 0) throw new RateLimitError('rate_limit_time_invalid', 400)

  const previousTokens = Number.isFinite(state?.tokens) ? Math.max(0, Math.min(policy.capacity, state.tokens)) : policy.capacity
  const previousUpdatedAt = Number.isFinite(state?.updatedAtMs) ? Math.min(now, state.updatedAtMs) : now
  const elapsed = Math.max(0, now - previousUpdatedAt)
  const refillUnits = Math.floor(elapsed / policy.refillIntervalMs)
  const refilledTokens = Math.min(policy.capacity, previousTokens + (refillUnits * policy.refillTokens))
  const updatedAtMs = refillUnits > 0 ? previousUpdatedAt + (refillUnits * policy.refillIntervalMs) : previousUpdatedAt

  if (refilledTokens >= 1) {
    return Object.freeze({
      allowed: true,
      state: Object.freeze({ tokens: refilledTokens - 1, updatedAtMs }),
      remaining: refilledTokens - 1,
      retryAfterSeconds: 0,
    })
  }

  const nextRefillAt = updatedAtMs + policy.refillIntervalMs
  const retryAfterSeconds = Math.max(1, Math.min(MAX_RETRY_AFTER_SECONDS, Math.ceil((nextRefillAt - now) / 1000)))
  return Object.freeze({
    allowed: false,
    state: Object.freeze({ tokens: 0, updatedAtMs }),
    remaining: 0,
    retryAfterSeconds,
  })
}

function validateBackendDecision(value) {
  if (!value || typeof value !== 'object' || typeof value.allowed !== 'boolean') {
    throw new RateLimitError('rate_limit_backend_result_invalid', 503)
  }
  const retryAfterSeconds = Number(value.retryAfterSeconds || 0)
  const remaining = Number(value.remaining ?? 0)
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds < 0 || retryAfterSeconds > MAX_RETRY_AFTER_SECONDS) {
    throw new RateLimitError('rate_limit_backend_retry_invalid', 503)
  }
  if (!Number.isFinite(remaining) || remaining < 0) throw new RateLimitError('rate_limit_backend_remaining_invalid', 503)
  return Object.freeze({
    allowed: value.allowed,
    remaining: Math.floor(remaining),
    retryAfterSeconds: Math.ceil(retryAfterSeconds),
  })
}

async function auditDenied(input, policyId, options, retryAfterSeconds) {
  const actor = options.trustedActor
  if (!actor || !ACTOR_ID_PATTERN.test(String(actor.actorId || ''))) {
    throw new RateLimitError('rate_limit_audit_actor_required', 503)
  }
  if (!REQUEST_ID_PATTERN.test(String(input.requestId || ''))) throw new RateLimitError('rate_limit_request_id_invalid', 400)
  if (!REQUEST_ID_PATTERN.test(String(input.correlationId || ''))) throw new RateLimitError('rate_limit_correlation_id_invalid', 400)

  await recordSecurityAuditEvent({
    eventId: input.auditEventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    requestId: input.requestId,
    actorId: actor.actorId,
    actorRole: actor.role,
    tenantId: actor.tenantId ?? null,
    action: 'rate_limit.denied',
    targetType: 'rate_limit_policy',
    targetId: actor.actorId,
    outcome: 'denied',
    reasonCode: `rate_limit_${policyId}_exceeded`,
    correlationId: input.correlationId,
    policyVersion: POLICY_VERSION,
    metadata: { policyId, retryAfterSeconds },
  }, {
    trustedContext: {
      actorId: actor.actorId,
      actorRole: actor.role,
      tenantId: actor.tenantId ?? null,
    },
    previousEventHash: options.previousEventHash,
    writeAuditEvent: options.writeAuditEvent,
    mandatory: true,
    nowMs: options.nowMs,
  })
}

export async function enforceRateLimit(input, options = {}) {
  rejectClientNetworkHints(input)
  const { id, policy } = requirePolicy(input?.policyId)
  const key = await deriveRateLimitKey(input, options)
  const consume = options.consumeRateLimit

  if (typeof consume !== 'function') {
    if (policy.backendFailure === 'open') {
      return Object.freeze({ allowed: true, degraded: true, remaining: null, retryAfterSeconds: 0, policyId: id })
    }
    throw new RateLimitError('rate_limit_backend_not_configured', 503)
  }

  let decision
  try {
    decision = validateBackendDecision(await consume({
      key,
      policyId: id,
      capacity: policy.capacity,
      refillTokens: policy.refillTokens,
      refillIntervalMs: policy.refillIntervalMs,
    }))
  } catch (error) {
    if (error instanceof RateLimitError && error.code.startsWith('rate_limit_backend_') && policy.backendFailure === 'open') {
      return Object.freeze({ allowed: true, degraded: true, remaining: null, retryAfterSeconds: 0, policyId: id })
    }
    if (policy.backendFailure === 'open') {
      return Object.freeze({ allowed: true, degraded: true, remaining: null, retryAfterSeconds: 0, policyId: id })
    }
    if (error instanceof RateLimitError) throw error
    throw new RateLimitError('rate_limit_backend_failed', 503)
  }

  if (!decision.allowed) {
    if (policy.auditOnDenied) await auditDenied(input, id, options, decision.retryAfterSeconds)
    throw new RateLimitError('rate_limit_exceeded', 429, { retryAfterSeconds: decision.retryAfterSeconds })
  }

  return Object.freeze({
    allowed: true,
    degraded: false,
    remaining: decision.remaining,
    retryAfterSeconds: 0,
    policyId: id,
  })
}

export function rateLimitResponseHeaders(resultOrError) {
  const headers = { 'cache-control': 'no-store' }
  if (resultOrError instanceof RateLimitError && resultOrError.status === 429) {
    headers['retry-after'] = String(resultOrError.retryAfterSeconds || 1)
  }
  if (resultOrError && Number.isFinite(resultOrError.remaining)) {
    headers['x-ratelimit-remaining'] = String(Math.max(0, Math.floor(resultOrError.remaining)))
  }
  return Object.freeze(headers)
}

export function rateLimitingContract() {
  return Object.freeze({
    policyVersion: POLICY_VERSION,
    algorithm: 'token-bucket-with-discrete-refill',
    trustedServerEnforcementRequired: true,
    trustedEdgeNetworkIdentityRequiredWhereConfigured: true,
    clientForwardingHeadersTrustedDirectly: false,
    rawPiiRateLimitKeysAllowed: false,
    securitySensitiveBackendFailureMode: 'closed',
    publicReadBackendFailureMode: 'open-degraded',
    globalPlatformAdminBypassAllowed: false,
    directChildCloudAuthenticationAllowed: false,
    liveRateLimiterEnabled: false,
    liveCloudflareRateLimitingClaimed: false,
    syntheticPreviewOnly: true,
    maxRetryAfterSeconds: MAX_RETRY_AFTER_SECONDS,
  })
}
