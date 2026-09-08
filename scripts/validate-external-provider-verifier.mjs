import assert from 'node:assert/strict'
import {
  ExternalVerifierError,
  clearVerifierCacheForTests,
  createExternalProviderVerifier,
} from '../workers/kirthiverse-api-preview/src/jwt-verifier.mjs'
import { authenticateAdultRequest, AuthError } from '../workers/kirthiverse-api-preview/src/auth.mjs'

function encodeBase64Url(bytes) {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function encodeJson(value) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)))
}

async function createRsaKey(kid) {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  return {
    privateKey: pair.privateKey,
    publicJwk: { ...publicJwk, kid, use: 'sig', alg: 'RS256' },
  }
}

async function signJwt(privateKey, header, payload) {
  const encodedHeader = encodeJson(header)
  const encodedPayload = encodeJson(payload)
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput),
  )
  return `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`
}

async function expectVerifierError(promiseFactory, code, status = 401) {
  await assert.rejects(
    promiseFactory,
    (error) => error instanceof ExternalVerifierError && error.code === code && error.status === status,
  )
}

const issuer = 'https://identity.example.test'
const audience = 'kirthiverse-preview'
const jwksUrl = 'https://identity.example.test/.well-known/jwks.json'
const now = Math.floor(Date.now() / 1000)
const claims = {
  iss: issuer,
  aud: audience,
  sub: 'adult-subject-001',
  exp: now + 600,
  iat: now,
  kvs_account_type: 'adult',
  kvs_role: 'platform_admin',
  kvs_tenant_id: 'provider-controlled-tenant',
}

const key1 = await createRsaKey('key-1')
const key2 = await createRsaKey('key-2')
const token1 = await signJwt(key1.privateKey, { alg: 'RS256', typ: 'JWT', kid: 'key-1' }, claims)
const token2 = await signJwt(key2.privateKey, { alg: 'RS256', typ: 'JWT', kid: 'key-2' }, claims)

clearVerifierCacheForTests()
let fetchCount = 0
const fetchStable = async (url, init) => {
  fetchCount += 1
  assert.equal(url, jwksUrl)
  assert.equal(init.redirect, 'error')
  return new Response(JSON.stringify({ keys: [key1.publicJwk] }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
  })
}

const verifier = createExternalProviderVerifier({
  KVS_AUTH_JWKS_URL: jwksUrl,
  KVS_AUTH_ALLOWED_ALGORITHMS: 'RS256',
}, { fetchImpl: fetchStable })
const verified = await verifier(token1)
assert.equal(verified.sub, claims.sub)
assert.equal(fetchCount, 1)
await verifier(token1)
assert.equal(fetchCount, 1, 'JWKS should be cached inside the bounded TTL')

const tampered = `${token1.split('.')[0]}.${encodeJson({ ...claims, sub: 'tampered' })}.${token1.split('.')[2]}`
await expectVerifierError(() => verifier(tampered), 'jwt_signature_invalid')

const noneToken = `${encodeJson({ alg: 'none', typ: 'JWT', kid: 'key-1' })}.${encodeJson(claims)}.${encodeBase64Url(new Uint8Array([1]))}`
await expectVerifierError(() => verifier(noneToken), 'jwt_algorithm_rejected')

const noKidToken = await signJwt(key1.privateKey, { alg: 'RS256', typ: 'JWT' }, claims)
await expectVerifierError(() => verifier(noKidToken), 'jwt_kid_invalid')

await expectVerifierError(
  () => Promise.resolve().then(() => createExternalProviderVerifier({ KVS_AUTH_JWKS_URL: 'http://identity.example.test/jwks' })),
  'jwks_url_invalid',
  503,
)
await expectVerifierError(
  () => Promise.resolve().then(() => createExternalProviderVerifier({
    KVS_AUTH_JWKS_URL: jwksUrl,
    KVS_AUTH_ALLOWED_ALGORITHMS: 'HS256',
  })),
  'auth_algorithm_policy_invalid',
  503,
)

clearVerifierCacheForTests()
let rotationFetchCount = 0
const fetchRotating = async () => {
  rotationFetchCount += 1
  const keys = rotationFetchCount === 1 ? [key1.publicJwk] : [key1.publicJwk, key2.publicJwk]
  return new Response(JSON.stringify({ keys }), {
    status: 200,
    headers: { 'cache-control': 'max-age=300' },
  })
}
const rotatingVerifier = createExternalProviderVerifier({ KVS_AUTH_JWKS_URL: jwksUrl }, { fetchImpl: fetchRotating })
const rotatedClaims = await rotatingVerifier(token2)
assert.equal(rotatedClaims.sub, claims.sub)
assert.equal(rotationFetchCount, 2, 'unknown kid should force one JWKS refresh for key rotation')

clearVerifierCacheForTests()
const env = {
  KVS_AUTH_ISSUER: issuer,
  KVS_AUTH_AUDIENCE: audience,
  KVS_AUTH_JWKS_URL: jwksUrl,
  KVS_AUTH_ALLOWED_ALGORITHMS: 'RS256',
}
const request = new Request('https://api.example.test/api/v1/identity/whoami', {
  headers: { authorization: `Bearer ${token1}` },
})
const trustedResolveActor = async (identity) => {
  assert.equal(identity.subject, claims.sub)
  assert.equal(identity.providerIssuer, issuer)
  return {
    actorId: 'kvs_guardian_000001',
    accountType: 'adult',
    role: 'guardian',
    tenantId: null,
  }
}
const context = await authenticateAdultRequest(request, env, {
  fetchImpl: fetchStable,
  nowSeconds: now,
  resolveActor: trustedResolveActor,
})
assert.equal(context.actorId, 'kvs_guardian_000001')
assert.equal(context.role, 'guardian')
assert.equal(context.tenantId, null)
assert.notEqual(context.role, claims.kvs_role, 'provider-controlled role claim must not grant application privilege')

const futureToken = await signJwt(key1.privateKey, { alg: 'RS256', typ: 'JWT', kid: 'key-1' }, {
  ...claims,
  iat: now + 120,
})
await assert.rejects(
  () => authenticateAdultRequest(
    new Request('https://api.example.test/', { headers: { authorization: `Bearer ${futureToken}` } }),
    env,
    { fetchImpl: fetchStable, nowSeconds: now, resolveActor: trustedResolveActor },
  ),
  (error) => error instanceof AuthError && error.code === 'token_issued_in_future',
)

console.log('External provider JWKS verifier validation passed')
