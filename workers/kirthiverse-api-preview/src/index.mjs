import { AuthError, authenticateAdultRequest } from './auth.mjs'

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

function json(body, init = {}) {
  const headers = new Headers(init.headers || {})
  for (const [key, value] of Object.entries(JSON_HEADERS)) headers.set(key, value)
  headers.set('cache-control', 'no-store')
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'no-referrer')
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('cross-origin-resource-policy', 'same-site')
  return new Response(JSON.stringify(body), { ...init, headers })
}

function parseAllowedOrigins(env) {
  return String(env.KVS_ALLOWED_ORIGINS || 'https://kirthiverse.omsaravanabhava.org')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function withCors(request, response, env) {
  const origin = request.headers.get('origin')
  if (!origin) return response

  const allowedOrigins = parseAllowedOrigins(env)
  if (!allowedOrigins.includes(origin)) return response

  const headers = new Headers(response.headers)
  headers.set('access-control-allow-origin', origin)
  headers.set('vary', 'Origin')
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS')
  headers.set('access-control-allow-headers', 'authorization,content-type,x-request-id')
  headers.set('access-control-max-age', '600')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

function previewEnabled(env) {
  return String(env.KVS_CLOUD_IDENTITY_PREVIEW || 'false').toLowerCase() === 'true'
}

function requestId(request) {
  const supplied = request.headers.get('x-request-id')
  return supplied && /^[A-Za-z0-9._:-]{8,96}$/.test(supplied) ? supplied : crypto.randomUUID()
}

function statusPayload(env, id) {
  return {
    ok: true,
    service: 'kirthiverse-cloud-identity-api-preview',
    version: '1.2.0-preview',
    requestId: id,
    previewEnabled: previewEnabled(env),
    realChildDataAllowed: false,
    browserDirectDatabaseAccessAllowed: false,
    authenticationMode: 'adult-owned-external-provider',
    authenticationBoundary: 'jwks-signature-verification-fail-closed',
    externalProviderVerifierConfigured: Boolean(env.KVS_AUTH_JWKS_URL && env.KVS_AUTH_ISSUER && env.KVS_AUTH_AUDIENCE),
    persistenceState: 'not-connected',
  }
}

async function protectedPreviewRoute(request, env, id, pathname) {
  if (!previewEnabled(env)) {
    return json({
      ok: false,
      code: 'preview_disabled',
      requestId: id,
      message: 'Cloud identity preview is disabled by release policy.',
    }, { status: 503 })
  }

  try {
    const context = await authenticateAdultRequest(request, env)

    if (request.method === 'GET' && pathname === '/api/v1/identity/whoami') {
      return json({
        ok: true,
        requestId: id,
        adult: {
          subject: context.subject,
          role: context.role,
          tenantId: context.tenantId,
        },
        persistenceState: 'not-connected',
      })
    }

    return json({
      ok: false,
      code: 'identity_route_not_implemented',
      requestId: id,
    }, { status: 501 })
  } catch (error) {
    if (error instanceof AuthError) {
      return json({
        ok: false,
        code: error.code,
        requestId: id,
      }, { status: error.status })
    }
    throw error
  }
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url)
    const id = requestId(request)

    if (request.method === 'OPTIONS') {
      const response = new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
      return withCors(request, response, env)
    }

    let response
    if (request.method === 'GET' && url.pathname === '/health') {
      response = json({ ok: true, service: 'kirthiverse-cloud-identity-api-preview', requestId: id })
    } else if (request.method === 'GET' && url.pathname === '/api/v1/status') {
      response = json(statusPayload(env, id))
    } else if (url.pathname.startsWith('/api/v1/identity/')) {
      response = await protectedPreviewRoute(request, env, id, url.pathname)
    } else {
      response = json({ ok: false, code: 'not_found', requestId: id }, { status: 404 })
    }

    return withCors(request, response, env)
  },
}
