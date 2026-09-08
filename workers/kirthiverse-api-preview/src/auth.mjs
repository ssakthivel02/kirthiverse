import { createExternalProviderVerifier, ExternalVerifierError } from './jwt-verifier.mjs'

const ALLOWED_ROLES = new Set(['guardian', 'teacher', 'school_admin', 'platform_admin'])
const ACTOR_ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/

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

export function validateVerifiedIdentityClaims(claims, config, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!claims || typeof claims !== 'object') throw new AuthError('invalid_verified_claims', 401)
  if (!config?.issuer || !config?.audience) throw new AuthError('auth_policy_not_configured', 503)
  if (claims.iss !== config.issuer) throw new AuthError('issuer_mismatch', 401)
  if (!matchesAudience(claims.aud, config.audience)) throw new AuthError('audience_mismatch', 401)
  if (!claims.sub || typeof claims.sub !== 'string' || claims.sub.length > 512) throw new AuthError('subject_missing', 401)
  if (!Number.isFinite(claims.exp) || claims.exp <= nowSeconds) throw new AuthError('token_expired', 401)
  if (Number.isFinite(claims.nbf) && claims.nbf > nowSeconds + 60) throw new AuthError('token_not_yet_valid', 401)
  if (Number.isFinite(claims.iat) && claims.iat > nowSeconds + 60) throw new AuthError('token_issued_in_future', 401)

  return {
    subject: claims.sub,
    providerIssuer: claims.iss,
    authenticationTime: Number.isFinite(claims.auth_time) ? claims.auth_time : null,
  }
}

export function validateResolvedActor(actor) {
  if (!actor || typeof actor !== 'object') throw new AuthError('actor_mapping_not_found', 403)
  if (actor.accountType !== 'adult') throw new AuthError('adult_account_required', 403)
  if (typeof actor.actorId !== 'string' || !ACTOR_ID_PATTERN.test(actor.actorId)) {
    throw new AuthError('actor_id_invalid', 503)
  }
  if (!ALLOWED_ROLES.has(actor.role)) throw new AuthError('role_not_allowed', 403)

  const tenantId = typeof actor.tenantId === 'string' && actor.tenantId.trim()
    ? actor.tenantId.trim()
    : null
  if ((actor.role === 'teacher' || actor.role === 'school_admin') && !tenantId) {
    throw new AuthError('tenant_context_required', 403)
  }

  return {
    actorId: actor.actorId,
    role: actor.role,
    tenantId,
  }
}

function resolveVerifier(env, options) {
  if (typeof options.verifyToken === 'function') return options.verifyToken
  if (typeof env.KVS_AUTH_VERIFY_TOKEN === 'function') return env.KVS_AUTH_VERIFY_TOKEN
  if (!env.KVS_AUTH_JWKS_URL) return null
  return createExternalProviderVerifier(env, { fetchImpl: options.fetchImpl })
}

function resolveActorResolver(env, options) {
  if (typeof options.resolveActor === 'function') return options.resolveActor
  if (typeof env.KVS_AUTH_RESOLVE_ACTOR === 'function') return env.KVS_AUTH_RESOLVE_ACTOR
  return null
}

export async function authenticateAdultRequest(request, env = {}, options = {}) {
  const token = parseBearerToken(request)

  let verifyToken
  try {
    verifyToken = resolveVerifier(env, options)
  } catch (error) {
    if (error instanceof ExternalVerifierError) throw new AuthError(error.code, error.status)
    throw error
  }
  if (typeof verifyToken !== 'function') throw new AuthError('auth_verifier_not_configured', 503)

  let claims
  try {
    claims = await verifyToken(token)
  } catch (error) {
    if (error instanceof ExternalVerifierError) throw new AuthError(error.code, error.status)
    throw error
  }

  const identity = validateVerifiedIdentityClaims(claims, {
    issuer: env.KVS_AUTH_ISSUER,
    audience: env.KVS_AUTH_AUDIENCE,
  }, options.nowSeconds)

  const resolveActor = resolveActorResolver(env, options)
  if (typeof resolveActor !== 'function') throw new AuthError('actor_resolver_not_configured', 503)

  let actor
  try {
    actor = await resolveActor({
      subject: identity.subject,
      providerIssuer: identity.providerIssuer,
      authenticationTime: identity.authenticationTime,
    })
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError('actor_resolver_failed', 503)
  }

  return validateResolvedActor(actor)
}

export function requireRole(context, allowedRoles) {
  const allowed = new Set(allowedRoles)
  if (!context || !allowed.has(context.role)) throw new AuthError('forbidden', 403)
  return context
}
