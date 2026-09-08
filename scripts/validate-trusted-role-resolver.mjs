import assert from 'node:assert/strict'
import {
  AuthError,
  authenticateAdultRequest,
  validateResolvedActor,
} from '../workers/kirthiverse-api-preview/src/auth.mjs'

const now = 2_000_000_000
const env = {
  KVS_AUTH_ISSUER: 'https://identity.example.test',
  KVS_AUTH_AUDIENCE: 'kirthiverse-preview',
}
const claims = {
  iss: env.KVS_AUTH_ISSUER,
  aud: env.KVS_AUTH_AUDIENCE,
  sub: 'provider-subject-001',
  exp: now + 600,
  // These provider-controlled application claims must have no authority.
  kvs_account_type: 'adult',
  kvs_role: 'platform_admin',
  kvs_tenant_id: 'attacker-selected-tenant',
}
const request = new Request('https://api.example.test/api/v1/identity/whoami', {
  headers: { authorization: 'Bearer synthetic-token' },
})

const context = await authenticateAdultRequest(request, env, {
  nowSeconds: now,
  verifyToken: async () => claims,
  resolveActor: async ({ subject, providerIssuer }) => {
    assert.equal(subject, claims.sub)
    assert.equal(providerIssuer, claims.iss)
    return {
      actorId: 'kvs_actor_guardian001',
      accountType: 'adult',
      role: 'guardian',
      tenantId: null,
    }
  },
})
assert.deepEqual(context, {
  actorId: 'kvs_actor_guardian001',
  role: 'guardian',
  tenantId: null,
})
assert.notEqual(context.role, claims.kvs_role)
assert.equal('subject' in context, false)
assert.equal('providerIssuer' in context, false)

await assert.rejects(
  () => authenticateAdultRequest(request, env, {
    nowSeconds: now,
    verifyToken: async () => claims,
  }),
  (error) => error instanceof AuthError && error.code === 'actor_resolver_not_configured' && error.status === 503,
)

await assert.rejects(
  () => authenticateAdultRequest(request, env, {
    nowSeconds: now,
    verifyToken: async () => claims,
    resolveActor: async () => null,
  }),
  (error) => error instanceof AuthError && error.code === 'actor_mapping_not_found' && error.status === 403,
)

await assert.rejects(
  () => authenticateAdultRequest(request, env, {
    nowSeconds: now,
    verifyToken: async () => claims,
    resolveActor: async () => { throw new Error('store unavailable') },
  }),
  (error) => error instanceof AuthError && error.code === 'actor_resolver_failed' && error.status === 503,
)

assert.deepEqual(validateResolvedActor({
  actorId: 'kvs_actor_teacher0001',
  accountType: 'adult',
  role: 'teacher',
  tenantId: 'school-preview-001',
}), {
  actorId: 'kvs_actor_teacher0001',
  role: 'teacher',
  tenantId: 'school-preview-001',
})

assert.throws(
  () => validateResolvedActor({
    actorId: 'provider-subject-001',
    accountType: 'adult',
    role: 'guardian',
  }),
  (error) => error instanceof AuthError && error.code === 'actor_id_invalid' && error.status === 503,
)

console.log('Trusted application role resolver validation passed')
