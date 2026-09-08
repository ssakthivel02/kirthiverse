const DEFAULT_ALLOWED_ALGORITHMS = ['RS256']
const DEFAULT_CACHE_TTL_SECONDS = 300
const MAX_CACHE_TTL_SECONDS = 900
const MAX_JWKS_KEYS = 50
const MAX_TOKEN_LENGTH = 16384

const jwksCache = new Map()

export class ExternalVerifierError extends Error {
  constructor(code, status = 401) {
    super(code)
    this.name = 'ExternalVerifierError'
    this.code = code
    this.status = status
  }
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new ExternalVerifierError('jwt_encoding_invalid', 401)
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  try {
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
    return bytes
  } catch {
    throw new ExternalVerifierError('jwt_encoding_invalid', 401)
  }
}

function parseJsonSegment(segment, code) {
  try {
    const text = new TextDecoder().decode(decodeBase64Url(segment))
    const value = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object required')
    return value
  } catch (error) {
    if (error instanceof ExternalVerifierError) throw error
    throw new ExternalVerifierError(code, 401)
  }
}

function parseAllowedAlgorithms(env) {
  const raw = String(env.KVS_AUTH_ALLOWED_ALGORITHMS || DEFAULT_ALLOWED_ALGORITHMS.join(','))
  const algorithms = raw.split(',').map((value) => value.trim()).filter(Boolean)
  if (algorithms.length === 0 || algorithms.some((value) => value !== 'RS256')) {
    throw new ExternalVerifierError('auth_algorithm_policy_invalid', 503)
  }
  return new Set(algorithms)
}

function requireHttpsUrl(value) {
  let url
  try {
    url = new URL(String(value || ''))
  } catch {
    throw new ExternalVerifierError('jwks_url_invalid', 503)
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new ExternalVerifierError('jwks_url_invalid', 503)
  }
  return url.toString()
}

function parseCacheTtl(response) {
  const cacheControl = response.headers.get('cache-control') || ''
  const match = cacheControl.match(/(?:^|,)\s*max-age=(\d+)/i)
  const requested = match ? Number(match[1]) : DEFAULT_CACHE_TTL_SECONDS
  if (!Number.isFinite(requested) || requested < 0) return DEFAULT_CACHE_TTL_SECONDS
  return Math.min(requested, MAX_CACHE_TTL_SECONDS)
}

async function fetchJwks(url, fetchImpl) {
  let response
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      redirect: 'error',
    })
  } catch {
    throw new ExternalVerifierError('jwks_fetch_failed', 503)
  }
  if (!response || response.status !== 200) throw new ExternalVerifierError('jwks_fetch_failed', 503)

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new ExternalVerifierError('jwks_payload_invalid', 503)
  }
  if (!payload || !Array.isArray(payload.keys) || payload.keys.length === 0 || payload.keys.length > MAX_JWKS_KEYS) {
    throw new ExternalVerifierError('jwks_payload_invalid', 503)
  }

  const ttlSeconds = parseCacheTtl(response)
  const record = {
    keys: payload.keys,
    expiresAt: Date.now() + ttlSeconds * 1000,
  }
  jwksCache.set(url, record)
  return record
}

async function getJwks(url, fetchImpl, forceRefresh = false) {
  const cached = jwksCache.get(url)
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached
  return fetchJwks(url, fetchImpl)
}

function selectSigningJwk(keys, header) {
  const matches = keys.filter((key) => key && key.kid === header.kid)
  if (matches.length === 0) return null
  if (matches.length !== 1) throw new ExternalVerifierError('jwks_key_ambiguous', 503)
  const key = matches[0]
  if (key.kty !== 'RSA') throw new ExternalVerifierError('jwks_key_type_rejected', 401)
  if (key.use && key.use !== 'sig') throw new ExternalVerifierError('jwks_key_use_rejected', 401)
  if (key.alg && key.alg !== header.alg) throw new ExternalVerifierError('jwks_key_algorithm_mismatch', 401)
  return key
}

async function importSigningKey(jwk) {
  try {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
  } catch {
    throw new ExternalVerifierError('jwks_key_import_failed', 503)
  }
}

export function clearVerifierCacheForTests() {
  jwksCache.clear()
}

export function createExternalProviderVerifier(env = {}, options = {}) {
  const jwksUrl = requireHttpsUrl(env.KVS_AUTH_JWKS_URL)
  const allowedAlgorithms = parseAllowedAlgorithms(env)
  const fetchImpl = options.fetchImpl || fetch

  return async function verifyToken(token) {
    if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      throw new ExternalVerifierError('jwt_size_invalid', 401)
    }

    const parts = token.split('.')
    if (parts.length !== 3 || parts.some((part) => !part)) {
      throw new ExternalVerifierError('jwt_compact_format_invalid', 401)
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const header = parseJsonSegment(encodedHeader, 'jwt_header_invalid')
    const claims = parseJsonSegment(encodedPayload, 'jwt_payload_invalid')

    if (typeof header.alg !== 'string' || header.alg === 'none' || !allowedAlgorithms.has(header.alg)) {
      throw new ExternalVerifierError('jwt_algorithm_rejected', 401)
    }
    if (typeof header.kid !== 'string' || header.kid.length < 1 || header.kid.length > 256) {
      throw new ExternalVerifierError('jwt_kid_invalid', 401)
    }
    if (header.typ && String(header.typ).toUpperCase() !== 'JWT') {
      throw new ExternalVerifierError('jwt_type_rejected', 401)
    }

    let jwks = await getJwks(jwksUrl, fetchImpl)
    let jwk = selectSigningJwk(jwks.keys, header)
    if (!jwk) {
      jwks = await getJwks(jwksUrl, fetchImpl, true)
      jwk = selectSigningJwk(jwks.keys, header)
    }
    if (!jwk) throw new ExternalVerifierError('jwks_key_not_found', 401)

    const key = await importSigningKey(jwk)
    const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    const signature = decodeBase64Url(encodedSignature)

    let valid = false
    try {
      valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
    } catch {
      valid = false
    }
    if (!valid) throw new ExternalVerifierError('jwt_signature_invalid', 401)

    return claims
  }
}
