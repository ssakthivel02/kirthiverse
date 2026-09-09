const KVS_ID_PATTERN = /^kvs_[A-Za-z0-9_-]{12,96}$/
const TENANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,95}$/

export class TenantAuthorizationError extends Error {
  constructor(code, status = 403) {
    super(code)
    this.name = 'TenantAuthorizationError'
    this.code = code
    this.status = status
  }
}

function requireKvsId(value, code) {
  if (typeof value !== 'string' || !KVS_ID_PATTERN.test(value)) {
    throw new TenantAuthorizationError(code, 403)
  }
  return value
}

function requireTenantId(value, code = 'tenant_id_invalid') {
  if (typeof value !== 'string' || !TENANT_ID_PATTERN.test(value)) {
    throw new TenantAuthorizationError(code, 503)
  }
  return value
}

export function validateTenantActor(actor) {
  if (!actor || typeof actor !== 'object') throw new TenantAuthorizationError('actor_context_required', 403)
  requireKvsId(actor.actorId, 'actor_id_invalid')

  if (actor.role !== 'teacher' && actor.role !== 'school_admin') {
    throw new TenantAuthorizationError('tenant_role_required', 403)
  }

  return {
    actorId: actor.actorId,
    role: actor.role,
    tenantId: requireTenantId(actor.tenantId, 'actor_tenant_invalid'),
  }
}

export function validateTenantResource(resource) {
  if (!resource || typeof resource !== 'object') throw new TenantAuthorizationError('tenant_resource_invalid', 503)
  return {
    tenantId: requireTenantId(resource.tenantId, 'resource_tenant_invalid'),
    resourceId: resource.resourceId == null ? null : requireKvsId(resource.resourceId, 'resource_id_invalid'),
  }
}

export function authorizeTenantResource(actor, resource) {
  const normalizedActor = validateTenantActor(actor)
  const normalizedResource = validateTenantResource(resource)

  if (normalizedActor.tenantId !== normalizedResource.tenantId) {
    throw new TenantAuthorizationError('cross_tenant_access_denied', 403)
  }

  return {
    actorId: normalizedActor.actorId,
    role: normalizedActor.role,
    tenantId: normalizedActor.tenantId,
    resourceId: normalizedResource.resourceId,
  }
}

export async function authorizeSchoolLearnerAccess(actor, learnerId, options = {}) {
  const normalizedActor = validateTenantActor(actor)
  const normalizedLearnerId = requireKvsId(learnerId, 'learner_id_invalid')
  const resolveLearnerTenant = options.resolveLearnerTenant

  if (typeof resolveLearnerTenant !== 'function') {
    throw new TenantAuthorizationError('learner_tenant_resolver_not_configured', 503)
  }

  let mapping
  try {
    mapping = await resolveLearnerTenant({
      learnerId: normalizedLearnerId,
      actorId: normalizedActor.actorId,
      actorTenantId: normalizedActor.tenantId,
    })
  } catch (error) {
    if (error instanceof TenantAuthorizationError) throw error
    throw new TenantAuthorizationError('learner_tenant_resolver_failed', 503)
  }

  if (!mapping || typeof mapping !== 'object') {
    throw new TenantAuthorizationError('school_learner_mapping_not_found', 403)
  }

  const learnerTenantId = requireTenantId(mapping.tenantId, 'learner_tenant_invalid')
  if (mapping.membershipStatus !== 'active') {
    throw new TenantAuthorizationError('school_learner_membership_inactive', 403)
  }
  if (learnerTenantId !== normalizedActor.tenantId) {
    throw new TenantAuthorizationError('cross_tenant_access_denied', 403)
  }

  return {
    actorId: normalizedActor.actorId,
    role: normalizedActor.role,
    tenantId: normalizedActor.tenantId,
    learnerId: normalizedLearnerId,
  }
}

export async function authorizeGuardianLearnerLink(actor, learnerId, options = {}) {
  if (!actor || actor.role !== 'guardian') throw new TenantAuthorizationError('guardian_role_required', 403)
  const guardianActorId = requireKvsId(actor.actorId, 'actor_id_invalid')
  const normalizedLearnerId = requireKvsId(learnerId, 'learner_id_invalid')
  const resolveGuardianLearnerLink = options.resolveGuardianLearnerLink

  if (typeof resolveGuardianLearnerLink !== 'function') {
    throw new TenantAuthorizationError('guardian_link_resolver_not_configured', 503)
  }

  let link
  try {
    link = await resolveGuardianLearnerLink({
      guardianActorId,
      learnerId: normalizedLearnerId,
    })
  } catch (error) {
    if (error instanceof TenantAuthorizationError) throw error
    throw new TenantAuthorizationError('guardian_link_resolver_failed', 503)
  }

  if (!link || typeof link !== 'object') throw new TenantAuthorizationError('guardian_learner_link_not_found', 403)
  if (link.guardianActorId !== guardianActorId || link.learnerId !== normalizedLearnerId) {
    throw new TenantAuthorizationError('guardian_learner_link_mismatch', 403)
  }
  if (link.linkStatus !== 'active') throw new TenantAuthorizationError('guardian_learner_link_inactive', 403)

  return {
    actorId: guardianActorId,
    role: 'guardian',
    tenantId: null,
    learnerId: normalizedLearnerId,
  }
}

export function tenantIsolationPolicy() {
  return {
    schoolRoles: ['teacher', 'school_admin'],
    platformAdminCrossTenantAccess: false,
    guardianUsesTenantAuthorization: false,
    remoteTeacherMonitoringEnabled: false,
    browserDirectDatabaseAccessAllowed: false,
    realChildDataAllowed: false,
  }
}
