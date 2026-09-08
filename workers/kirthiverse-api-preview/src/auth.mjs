const ALLOWED_ROLES = new Set(['guardian', 'teacher', 'school_admin', 'platform_admin'])

export class AuthError extends Error {
  constructor(code, status = 401) {
    super(code)
    this.name = 'AuthError'
    this.code = code
    this.status = status
  }
}

export function parseBearerToken(request) {
  const authorization = request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i)
  if (!match) throw new AuthError('missing_or_invalid_bearer_token', 401)
  return match[1]
}

function matchesAudience(actual, expected) {
  if (!expected) return false
  if (Array.isArray(actual)) return actual.includes(expected)
  return actual === expected
}

export function validateVerifiedClaims(claims, config, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!claims || typeof claims !== 'object') throw new AuthError('invalid_verified_claims', 401)
  if (!config?.issuer || !config?.audience) throw new AuthError('auth_policy_not_configured', 503)
  if (claims.iss !== config.issuer) throw new AuthError('issuer_mismatch', 401)
  if (!matchesAudience(claims.aud, config.audience)) throw new AuthError('audience_mismatch', 401)
  if (!claims.sub || typeof claims.sub !== 'string') throw new AuthError('subject_missing', 401)
  if (!Number.isFinite(claims.exp) || claims.exp <= nowSeconds) throw new AuthError('token_expired', 401)
  if (Number.isFinite(claims.nbf) && claims.nbf > nowSeconds + 60) throw new AuthError('token_not_yet_valid', 401)
  if (claims.kvs_account_type !== 'adult') throw new AuthError('adult_account_required', 403)

  const role = claims.kvs_role
  if (!ALLOWED_ROLES.has(role)) throw new AuthError('role_not_allowed', 403)

  const tenantId = typeof claims.kvs_tenant_id === 'string' && claims.kvs_tenant_id.trim()
    ? claims.kvs_tenant_id.trim()
    : null
  if ((role === 'teacher' || role === 'school_admin') && !tenantId) {
    throw new AuthError('tenant_context_required', 403)
  }

  return {
    subject: claims.sub,
    role,
    tenantId,
    providerIssuer: claims.iss,
    authenticationTime: Number.isFinite(claims.auth_time) ? claims.auth_time : null,
  }
}

export async function authenticateAdultRequest(request, env = {}, options = {}) {
  const token = parseBearerToken(request)
  const verifyToken = options.verifyToken || env.KVS_AUTH_VERIFY_TOKEN
  if (typeof verifyToken !== 'function') throw new AuthError('auth_verifier_not_configured', 503)

  const claims = await verifyToken(token)
  return validateVerifiedClaims(claims, {
    issuer: env.KVS_AUTH_ISSUER,
    audience: env.KVS_AUTH_AUDIENCE,
  }, options.nowSeconds)
}

export function requireRole(context, allowedRoles) {
  const allowed = new Set(allowedRoles)
  if (!context || !allowed.has(context.role)) throw new AuthError('forbidden', 403)
  return context
}
