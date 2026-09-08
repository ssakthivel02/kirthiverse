import assert from 'node:assert/strict'
import {
  AuthError,
  authenticateAdultRequest,
  requireRole,
  validateVerifiedClaims,
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
  kvs_account_type: 'adult',
  kvs_role: 'guardian',
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
  () => validateVerifiedClaims({ ...baseClaims, iss: 'https://wrong.example' }, policy, now),
  'issuer_mismatch',
  401,
)
expectAuthError(
  () => validateVerifiedClaims({ ...baseClaims, aud: 'wrong-audience' }, policy, now),
  'audience_mismatch',
  401,
)
expectAuthError(
  () => validateVerifiedClaims({ ...baseClaims, exp: now - 1 }, policy, now),
  'token_expired',
  401,
)
expectAuthError(
  () => validateVerifiedClaims({ ...baseClaims, kvs_account_type: 'learner' }, policy, now),
  'adult_account_required',
  403,
)
expectAuthError(
  () => validateVerifiedClaims({ ...baseClaims, kvs_role: 'teacher' }, policy, now),
  'tenant_context_required',
  403,
)

const guardian = validateVerifiedClaims(baseClaims, policy, now)
assert.deepEqual(guardian, {
  subject: 'adult-subject-001',
  role: 'guardian',
  tenantId: null,
  providerIssuer: env.KVS_AUTH_ISSUER,
  authenticationTime: null,
})
requireRole(guardian, ['guardian'])
expectAuthError(() => requireRole(guardian, ['teacher']), 'forbidden', 403)

const teacherClaims = {
  ...baseClaims,
  sub: 'adult-subject-002',
  kvs_role: 'teacher',
  kvs_tenant_id: 'school-preview-001',
}
const teacher = validateVerifiedClaims(teacherClaims, policy, now)
assert.equal(teacher.tenantId, 'school-preview-001')

const request = new Request('https://api.example.test/api/v1/identity/whoami', {
  headers: { authorization: 'Bearer synthetic-signed-token' },
})
const authenticated = await authenticateAdultRequest(request, env, {
  nowSeconds: now,
  verifyToken: async (token) => {
    assert.equal(token, 'synthetic-signed-token')
    return baseClaims
  },
})
assert.equal(authenticated.subject, baseClaims.sub)

await assert.rejects(
  () => authenticateAdultRequest(new Request('https://api.example.test/'), env, { verifyToken: async () => baseClaims }),
  (error) => error instanceof AuthError && error.code === 'missing_or_invalid_bearer_token',
)
await assert.rejects(
  () => authenticateAdultRequest(request, env),
  (error) => error instanceof AuthError && error.code === 'auth_verifier_not_configured' && error.status === 503,
)

console.log('Adult authentication boundary validation passed')
