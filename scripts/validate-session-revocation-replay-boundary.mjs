import assert from 'node:assert/strict'
import {
  SessionSecurityError,
  authorizeSessionUse,
  authorizeOneTimeSecurityOperation,
  sessionSecurityContract,
} from '../workers/kirthiverse-api-preview/src/session-security.mjs'

const actor = { actorId: 'kvs_guardian_000001', role: 'guardian', tenantId: null }
const token = { tokenId: 'jwt:token:00000001', issuedAt: 1_700_000_000, expiresAt: 1_700_003_600 }
const nowSeconds = 1_700_000_100

const activeResolver = async ({ actorId, tokenId }) => ({ actorId, tokenId, status: 'active' })
const revokedResolver = async ({ actorId, tokenId }) => ({ actorId, tokenId, status: 'revoked' })

async function expectCode(fn, code) {
  await assert.rejects(fn, (error) => error instanceof SessionSecurityError && error.code === code)
}

const session = await authorizeSessionUse(actor, token, { nowSeconds, resolveSessionState: activeResolver })
assert.equal(session.actorId, actor.actorId)
assert.equal(session.tokenId, token.tokenId)

await expectCode(() => authorizeSessionUse(actor, token, { nowSeconds, resolveSessionState: revokedResolver }), 'session_revoked')
await expectCode(() => authorizeSessionUse(actor, token, { nowSeconds }), 'session_state_resolver_not_configured')
await expectCode(() => authorizeSessionUse(actor, { ...token, expiresAt: nowSeconds }, { nowSeconds, resolveSessionState: activeResolver }), 'security_token_expired')
await expectCode(() => authorizeSessionUse(actor, token, {
  nowSeconds,
  resolveSessionState: async () => ({ actorId: 'kvs_guardian_other0001', tokenId: token.tokenId, status: 'active' }),
}), 'session_state_mismatch')

const consumedKeys = new Set()
const consumeReplayKey = async ({ actorId, tokenId, purpose }) => {
  const key = `${actorId}:${tokenId}:${purpose}`
  if (consumedKeys.has(key)) return false
  consumedKeys.add(key)
  return true
}

const protectedUse = await authorizeOneTimeSecurityOperation(actor, token, 'guardian.export.request', {
  nowSeconds,
  resolveSessionState: activeResolver,
  consumeReplayKey,
})
assert.equal(protectedUse.replayProtected, true)

await expectCode(() => authorizeOneTimeSecurityOperation(actor, token, 'guardian.export.request', {
  nowSeconds,
  resolveSessionState: activeResolver,
  consumeReplayKey,
}), 'replay_detected')

await expectCode(() => authorizeOneTimeSecurityOperation(actor, token, 'guardian.delete.request', {
  nowSeconds,
  resolveSessionState: activeResolver,
}), 'replay_store_not_configured')

const contract = sessionSecurityContract()
assert.equal(contract.trustedServerStateRequired, true)
assert.equal(contract.revokedSessionsDenied, true)
assert.equal(contract.oneTimeOperationsRequireAtomicReplayConsume, true)
assert.equal(contract.genericJwtReplayPreventionClaimed, false)
assert.equal(contract.persistenceEnabled, false)

console.log('Session revocation and replay boundary validation passed')
