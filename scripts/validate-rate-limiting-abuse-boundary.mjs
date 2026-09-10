import assert from 'node:assert/strict'
import {
  RateLimitError,
  consumeTokenBucketState,
  deriveRateLimitKey,
  enforceRateLimit,
  rateLimitResponseHeaders,
  rateLimitingContract,
} from '../workers/kirthiverse-api-preview/src/rate-limiting.mjs'

const actorA = Object.freeze({ actorId: 'kvs_guardian_actor_0001', role: 'guardian', tenantId: null })
const actorB = Object.freeze({ actorId: 'kvs_guardian_actor_0002', role: 'guardian', tenantId: null })
const trustedNetworkA = Object.freeze({ networkId: 'net_trusted_edge_0001' })
const trustedNetworkB = Object.freeze({ networkId: 'net_trusted_edge_0002' })
const keySalt = 'synthetic-preview-rate-limit-salt-v1'
const now = Date.parse('2026-09-10T16:00:00.000Z')

function expectRateError(code, fn) {
  return assert.rejects(fn, (error) => error instanceof RateLimitError && error.code === code)
}

function makeAtomicPreviewBackend(startMs = now) {
  const buckets = new Map()
  let clock = startMs
  return Object.freeze({
    setNow(value) { clock = value },
    async consume(input) {
      const prior = buckets.get(input.key)
      const decision = consumeTokenBucketState(prior, input.policyId, clock)
      buckets.set(input.key, decision.state)
      return {
        allowed: decision.allowed,
        remaining: decision.remaining,
        retryAfterSeconds: decision.retryAfterSeconds,
      }
    },
  })
}

const authBackend = makeAtomicPreviewBackend()
for (let i = 0; i < 5; i += 1) {
  const decision = await enforceRateLimit({ policyId: 'auth_login' }, {
    trustedEdge: trustedNetworkA,
    keySalt,
    consumeRateLimit: authBackend.consume,
  })
  assert.equal(decision.allowed, true)
}
await expectRateError('rate_limit_exceeded', () => enforceRateLimit({ policyId: 'auth_login' }, {
  trustedEdge: trustedNetworkA,
  keySalt,
  consumeRateLimit: authBackend.consume,
}))

authBackend.setNow(now + 300_000)
const afterRefill = await enforceRateLimit({ policyId: 'auth_login' }, {
  trustedEdge: trustedNetworkA,
  keySalt,
  consumeRateLimit: authBackend.consume,
})
assert.equal(afterRefill.allowed, true)

const keyA = await deriveRateLimitKey({ policyId: 'auth_login' }, { trustedEdge: trustedNetworkA, keySalt })
const keyB = await deriveRateLimitKey({ policyId: 'auth_login' }, { trustedEdge: trustedNetworkB, keySalt })
assert.notEqual(keyA, keyB)
assert.ok(keyA.startsWith('rl_'))
assert.ok(!keyA.includes(trustedNetworkA.networkId))

const actorKeyA = await deriveRateLimitKey({ policyId: 'learner_sync', actorId: actorA.actorId }, { keySalt })
const actorKeyB = await deriveRateLimitKey({ policyId: 'learner_sync', actorId: actorB.actorId }, { keySalt })
assert.notEqual(actorKeyA, actorKeyB)
assert.ok(!actorKeyA.includes(actorA.actorId))

await expectRateError('rate_limit_client_network_hint_rejected', () => deriveRateLimitKey({
  policyId: 'auth_login',
  forwardedFor: '203.0.113.7',
}, { trustedEdge: trustedNetworkA, keySalt }))

await expectRateError('rate_limit_trusted_network_required', () => enforceRateLimit({ policyId: 'auth_login' }, {
  keySalt,
  consumeRateLimit: async () => ({ allowed: true, remaining: 1, retryAfterSeconds: 0 }),
}))

await expectRateError('rate_limit_backend_not_configured', () => enforceRateLimit({
  policyId: 'dsr_sensitive',
  actorId: actorA.actorId,
}, { keySalt, trustedActor: actorA }))

const publicReadDegraded = await enforceRateLimit({ policyId: 'public_read' }, {
  trustedEdge: trustedNetworkA,
  keySalt,
})
assert.equal(publicReadDegraded.allowed, true)
assert.equal(publicReadDegraded.degraded, true)

const publicBackendFailure = await enforceRateLimit({ policyId: 'public_read' }, {
  trustedEdge: trustedNetworkA,
  keySalt,
  consumeRateLimit: async () => { throw new Error('synthetic backend outage') },
})
assert.equal(publicBackendFailure.allowed, true)
assert.equal(publicBackendFailure.degraded, true)

const auditEvents = []
const dsrBackend = makeAtomicPreviewBackend()
const dsrInputBase = {
  policyId: 'dsr_sensitive',
  actorId: actorA.actorId,
  requestId: 'req_rate_limit_0001',
  correlationId: 'corr_rate_limit_0001',
  auditEventId: 'evt_rate_limit_denied_0001',
  occurredAt: new Date(now).toISOString(),
  recordedAt: new Date(now).toISOString(),
}
for (let i = 0; i < 3; i += 1) {
  await enforceRateLimit(dsrInputBase, {
    keySalt,
    trustedActor: actorA,
    consumeRateLimit: dsrBackend.consume,
    writeAuditEvent: async () => true,
    nowMs: now,
  })
}
await expectRateError('rate_limit_exceeded', () => enforceRateLimit(dsrInputBase, {
  keySalt,
  trustedActor: actorA,
  consumeRateLimit: dsrBackend.consume,
  writeAuditEvent: async (event) => { auditEvents.push(event); return true },
  nowMs: now,
}))
assert.equal(auditEvents.length, 1)
assert.equal(auditEvents[0].action, 'rate_limit.denied')
assert.equal(auditEvents[0].outcome, 'denied')
assert.equal(auditEvents[0].metadata.policyId, 'dsr_sensitive')
assert.equal(auditEvents[0].actorId, actorA.actorId)
assert.equal(auditEvents[0].metadata.retryAfterSeconds, 3600)
assert.ok(!JSON.stringify(auditEvents[0]).includes('synthetic@example.invalid'))

const dsrNoAuditSink = makeAtomicPreviewBackend()
for (let i = 0; i < 3; i += 1) {
  await enforceRateLimit(dsrInputBase, {
    keySalt,
    trustedActor: actorA,
    consumeRateLimit: dsrNoAuditSink.consume,
    writeAuditEvent: async () => true,
    nowMs: now,
  })
}
await assert.rejects(() => enforceRateLimit(dsrInputBase, {
  keySalt,
  trustedActor: actorA,
  consumeRateLimit: dsrNoAuditSink.consume,
  nowMs: now,
}), (error) => error?.code === 'audit_sink_not_configured')

const retryBackend = makeAtomicPreviewBackend()
for (let i = 0; i < 5; i += 1) {
  await enforceRateLimit({ policyId: 'auth_login' }, {
    trustedEdge: trustedNetworkA,
    keySalt,
    consumeRateLimit: retryBackend.consume,
  })
}
let retryError
try {
  await enforceRateLimit({ policyId: 'auth_login' }, {
    trustedEdge: trustedNetworkA,
    keySalt,
    consumeRateLimit: retryBackend.consume,
  })
} catch (error) {
  retryError = error
}
assert.ok(retryError instanceof RateLimitError)
assert.equal(retryError.status, 429)
assert.equal(retryError.retryAfterSeconds, 300)
assert.equal(rateLimitResponseHeaders(retryError)['retry-after'], '300')

const rapidBackend = makeAtomicPreviewBackend()
const rapidResults = []
for (let i = 0; i < 61; i += 1) {
  try {
    rapidResults.push(await enforceRateLimit({ policyId: 'learner_sync', actorId: actorB.actorId }, {
      keySalt,
      trustedActor: actorB,
      consumeRateLimit: rapidBackend.consume,
      writeAuditEvent: async () => true,
      nowMs: now,
      previousEventHash: '0'.repeat(64),
    }))
  } catch (error) {
    rapidResults.push(error)
  }
}
assert.equal(rapidResults.filter((value) => value instanceof RateLimitError && value.code === 'rate_limit_exceeded').length, 1)

await expectRateError('rate_limit_client_network_hint_rejected', () => enforceRateLimit({
  policyId: 'admin_sensitive',
  actorId: actorA.actorId,
  clientNetworkId: 'net_spoofed_client_0001',
}, {
  keySalt,
  trustedActor: actorA,
  consumeRateLimit: async () => ({ allowed: true, remaining: 9, retryAfterSeconds: 0 }),
}))

const contract = rateLimitingContract()
assert.equal(contract.trustedServerEnforcementRequired, true)
assert.equal(contract.clientForwardingHeadersTrustedDirectly, false)
assert.equal(contract.rawPiiRateLimitKeysAllowed, false)
assert.equal(contract.securitySensitiveBackendFailureMode, 'closed')
assert.equal(contract.publicReadBackendFailureMode, 'open-degraded')
assert.equal(contract.globalPlatformAdminBypassAllowed, false)
assert.equal(contract.directChildCloudAuthenticationAllowed, false)
assert.equal(contract.liveRateLimiterEnabled, false)
assert.equal(contract.liveCloudflareRateLimitingClaimed, false)
assert.equal(contract.syntheticPreviewOnly, true)

console.log('Rate limiting & abuse protection boundary validation passed')
