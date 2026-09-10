const ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const TOKEN_ID_PATTERN = /^[A-Za-z0-9._:-]{8,160}$/
const PURPOSE_PATTERN = /^[A-Za-z0-9._:-]{3,96}$/
const MAX_CLOCK_SKEW_SECONDS = 60

export class SessionSecurityError extends Error {
  constructor(code, status = 403) {
    super(code)
    this.name = 'SessionSecurityError'
    this.code = code
    this.status = status
  }
}

function requireActor(actor) {
  if (!actor || typeof actor !== 'object') throw new SessionSecurityError('security_actor_required', 401)
  if (!ID_PATTERN.test(String(actor.actorId || ''))) throw new SessionSecurityError('security_actor_id_invalid', 503)
  return actor
}

function requireTokenMetadata(token) {
  if (!token || typeof token !== 'object') throw new SessionSecurityError('security_token_metadata_required', 401)
  const tokenId = String(token.tokenId || '')
  const issuedAt = Number(token.issuedAt)
  const expiresAt = Number(token.expiresAt)
  if (!TOKEN_ID_PATTERN.test(tokenId)) throw new SessionSecurityError('security_token_id_invalid', 401)
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    throw new SessionSecurityError('security_token_time_invalid', 401)
  }
  return { tokenId, issuedAt, expiresAt }
}

function requirePurpose(purpose) {
  if (!PURPOSE_PATTERN.test(String(purpose || ''))) throw new SessionSecurityError('security_purpose_invalid', 400)
  return String(purpose)
}

export async function authorizeSessionUse(actor, token, options = {}) {
  const trustedActor = requireActor(actor)
  const metadata = requireTokenMetadata(token)
  const nowSeconds = Number.isFinite(options.nowSeconds) ? options.nowSeconds : Math.floor(Date.now() / 1000)

  if (metadata.issuedAt > nowSeconds + MAX_CLOCK_SKEW_SECONDS) throw new SessionSecurityError('security_token_issued_in_future', 401)
  if (metadata.expiresAt <= nowSeconds) throw new SessionSecurityError('security_token_expired', 401)

  const resolveSessionState = options.resolveSessionState
  if (typeof resolveSessionState !== 'function') throw new SessionSecurityError('session_state_resolver_not_configured', 503)

  let state
  try {
    state = await resolveSessionState({ actorId: trustedActor.actorId, tokenId: metadata.tokenId })
  } catch (error) {
    if (error instanceof SessionSecurityError) throw error
    throw new SessionSecurityError('session_state_resolver_failed', 503)
  }

  if (!state || typeof state !== 'object') throw new SessionSecurityError('session_state_missing', 403)
  if (state.actorId !== trustedActor.actorId || state.tokenId !== metadata.tokenId) {
    throw new SessionSecurityError('session_state_mismatch', 403)
  }
  if (state.status !== 'active') {
    if (state.status === 'revoked') throw new SessionSecurityError('session_revoked', 401)
    throw new SessionSecurityError('session_not_active', 403)
  }

  return Object.freeze({ actorId: trustedActor.actorId, tokenId: metadata.tokenId, expiresAt: metadata.expiresAt })
}

export async function authorizeOneTimeSecurityOperation(actor, token, purpose, options = {}) {
  const base = await authorizeSessionUse(actor, token, options)
  const operationPurpose = requirePurpose(purpose)
  const consumeReplayKey = options.consumeReplayKey
  if (typeof consumeReplayKey !== 'function') throw new SessionSecurityError('replay_store_not_configured', 503)

  let consumed
  try {
    consumed = await consumeReplayKey({
      actorId: base.actorId,
      tokenId: base.tokenId,
      purpose: operationPurpose,
      expiresAt: base.expiresAt,
    })
  } catch (error) {
    if (error instanceof SessionSecurityError) throw error
    throw new SessionSecurityError('replay_store_failed', 503)
  }

  if (consumed !== true) throw new SessionSecurityError('replay_detected', 409)
  return Object.freeze({ ...base, purpose: operationPurpose, replayProtected: true })
}

export function sessionSecurityContract() {
  return Object.freeze({
    trustedServerStateRequired: true,
    revokedSessionsDenied: true,
    oneTimeOperationsRequireAtomicReplayConsume: true,
    genericJwtReplayPreventionClaimed: false,
    persistenceEnabled: false,
  })
}
