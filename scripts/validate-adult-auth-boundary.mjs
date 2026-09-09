import assert from 'node:assert/strict'
import {
  AuthError,
  authenticateAdultRequest,
  requireRole,
  validateResolvedActor,
  validateVerifiedIdentityClaims,
} from '../workers/kirthiverse-api-preview/src/auth.mjs'

const now = 2_000_000_000
const env = {
  KVS_AUTH_ISSUER: 'https://identity.example.test',
  KVS_AUTH_AUDIENCE: 'kirthiverse-preview',
}
const policy = {
  issuer: env.KVS_AUTH_ISSUER,
  audience: env.KVS_AUTH_AUDIENCE,
}

const baseClaims = {
  iss: env.KVS_AUTH_ISSUER,
  aud: env.KVS_AUTH_AUDIENCE,
  sub: 'adult-subject-001',
  exp: now + 600,
}

function expectAuthError(fn, code, status) {
  try {
    fn()
    assert.fail(`Expected ${code}`)
  } catch (error) {
    assert.ok(error instanceof AuthError)
    assert.equal(error.code, code)
    assert.equal(error.status, status)
  }
}

expectAuthError(
  () => validateVerifiedIdentityClaims({ ...baseClaims, iss: 'https://wrong.example' }, policy, now),
  'issuer_mismatch',
  401,
)
expectAuthError(
  () => validateVerifiedIdentityClaims({ ...baseClaims, aud: 'wrong-audience' }, policy, now),
  'audience_mismatch',
  401,
)
expectAuthError(
  () => validateVerifiedIdentityClaims({ ...baseClaims, exp: now - 1 }, policy, now),
  'token_expired',
  401,
)

const identity = validateVerifiedIdentityClaims(baseClaims, policy, now)
assert.deepEqual(identity, {
  subject: 'adult-subject-001',
  providerIssuer: env.KVS_AUTH_ISSUER,
  authenticationTime: null,
})

const guardian = validateResolvedActor({
  actorId: 'kvs_actor_guardian001',
  accountType: 'adult',
  role: 'guardian',
})
assert.deepEqual(guardian, {
  actorId: 'kvs_actor_guardian001',
  role: 'guardian',
  tenantId: null,
})
requireRole(guardian, ['guardian'])
expectAuthError(() => requireRole(guardian, ['teacher']), 'forbidden', 403)

expectAuthError(
  () => validateResolvedActor({ actorId: 'kvs_actor_teacher001', accountType: 'adult', role: 'teacher' }),
  'tenant_context_required',
  403,
)
expectAuthError(
  () => validateResolvedActor({ actorId: 'kvs_actor_learner001', accountType: 'learner', role: 'guardian' }),
  'adult_account_required',
  403,
)

const request = new Request('https://api.example.test/api/v1/identity/whoami', {
  headers: { authorization: 'Bearer synthetic-signed-token' },
})
const authenticated = await authenticateAdultRequest(request, env, {
  nowSeconds: now,
  verifyToken: async (token) => {
    assert.equal(token, 'synthetic-signed-token')
    return baseClaims
  },
  resolveActor: async ({ subject, providerIssuer }) => {
    assert.equal(subject, baseClaims.sub)
    assert.equal(providerIssuer, baseClaims.iss)
    return {
      actorId: 'kvs_actor_guardian001',
      accountType: 'adult',
      role: 'guardian',
      tenantId: null,
    }
  },
})
assert.equal(authenticated.actorId, 'kvs_actor_guardian001')
assert.equal('subject' in authenticated, false)

await assert.rejects(
  () => authenticateAdultRequest(new Request('https://api.example.test/'), env, { verifyToken: async () => baseClaims }),
  (error) => error instanceof AuthError && error.code === 'missing_or_invalid_bearer_token',
)
await assert.rejects(
  () => authenticateAdultRequest(request, env),
  (error) => error instanceof AuthError && error.code === 'auth_verifier_not_configured' && error.status === 503,
)
await assert.rejects(
  () => authenticateAdultRequest(request, env, { verifyToken: async () => baseClaims }),
  (error) => error instanceof AuthError && error.code === 'actor_resolver_not_configured' && error.status === 503,
)

console.log('Adult authentication boundary validation passed')
