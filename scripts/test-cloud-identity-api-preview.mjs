import assert from 'node:assert/strict'
import worker from '../workers/kirthiverse-api-preview/src/index.mjs'

const baseEnv = {
  KVS_CLOUD_IDENTITY_PREVIEW: 'false',
  KVS_ALLOWED_ORIGINS: 'https://kirthiverse.omsaravanabhava.org',
}

async function call(path, init = {}, env = baseEnv) {
  const request = new Request(`https://preview.invalid${path}`, init)
  return worker.fetch(request, env)
}

{
  const response = await call('/health')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.equal(body.service, 'kirthiverse-cloud-identity-api-preview')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
}

{
  const response = await call('/api/v1/status')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.previewEnabled, false)
  assert.equal(body.realChildDataAllowed, false)
  assert.equal(body.browserDirectDatabaseAccessAllowed, false)
  assert.equal(body.persistenceState, 'not-connected')
}

{
  const response = await call('/api/v1/identity/me')
  assert.equal(response.status, 503)
  const body = await response.json()
  assert.equal(body.code, 'preview_disabled')
}

{
  const response = await call('/api/v1/identity/me', {}, { ...baseEnv, KVS_CLOUD_IDENTITY_PREVIEW: 'true' })
  assert.equal(response.status, 501)
  const body = await response.json()
  assert.equal(body.code, 'protected_route_not_enabled')
}

{
  const response = await call('/api/v1/status', { headers: { origin: 'https://kirthiverse.omsaravanabhava.org' } })
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://kirthiverse.omsaravanabhava.org')
}

{
  const response = await call('/api/v1/status', { headers: { origin: 'https://evil.invalid' } })
  assert.equal(response.headers.get('access-control-allow-origin'), null)
}

{
  const response = await call('/unknown')
  assert.equal(response.status, 404)
}

console.log('Cloud identity API preview safety tests: PASS')
