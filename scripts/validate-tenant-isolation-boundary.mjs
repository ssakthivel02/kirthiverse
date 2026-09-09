import assert from 'node:assert/strict'
import {
  TenantAuthorizationError,
  authorizeGuardianLearnerLink,
  authorizeSchoolLearnerAccess,
  authorizeTenantResource,
  tenantIsolationPolicy,
  validateTenantActor,
} from '../workers/kirthiverse-api-preview/src/tenant-authorization.mjs'

async function expectTenantError(promiseFactory, code, status) {
  await assert.rejects(
    promiseFactory,
    (error) => error instanceof TenantAuthorizationError && error.code === code && error.status === status,
  )
}

const teacher = {
  actorId: 'kvs_teacher_actor_001',
  role: 'teacher',
  tenantId: 'school-alpha',
}
const schoolAdmin = {
  actorId: 'kvs_school_admin_001',
  role: 'school_admin',
  tenantId: 'school-alpha',
}
const guardian = {
  actorId: 'kvs_guardian_actor_001',
  role: 'guardian',
  tenantId: null,
}
const platformAdmin = {
  actorId: 'kvs_platform_admin_001',
  role: 'platform_admin',
  tenantId: null,
}
const learner = 'kvs_learner_profile_001'

const sameTenant = authorizeTenantResource(teacher, {
  tenantId: 'school-alpha',
  resourceId: 'kvs_assignment_000001',
})
assert.equal(sameTenant.tenantId, 'school-alpha')
assert.equal(sameTenant.role, 'teacher')

await expectTenantError(
  () => Promise.resolve().then(() => authorizeTenantResource(teacher, {
    tenantId: 'school-beta',
    resourceId: 'kvs_assignment_000002',
  })),
  'cross_tenant_access_denied',
  403,
)

const adminSameTenant = authorizeTenantResource(schoolAdmin, {
  tenantId: 'school-alpha',
  resourceId: 'kvs_assignment_000003',
})
assert.equal(adminSameTenant.role, 'school_admin')

await expectTenantError(
  () => Promise.resolve().then(() => validateTenantActor(guardian)),
  'tenant_role_required',
  403,
)
await expectTenantError(
  () => Promise.resolve().then(() => validateTenantActor(platformAdmin)),
  'tenant_role_required',
  403,
)

const schoolLearner = await authorizeSchoolLearnerAccess(teacher, learner, {
  resolveLearnerTenant: async ({ learnerId, actorTenantId }) => {
    assert.equal(learnerId, learner)
    assert.equal(actorTenantId, 'school-alpha')
    return { tenantId: 'school-alpha', membershipStatus: 'active' }
  },
})
assert.equal(schoolLearner.learnerId, learner)
assert.equal(schoolLearner.tenantId, 'school-alpha')

await expectTenantError(
  () => authorizeSchoolLearnerAccess(teacher, learner),
  'learner_tenant_resolver_not_configured',
  503,
)
await expectTenantError(
  () => authorizeSchoolLearnerAccess(teacher, learner, {
    resolveLearnerTenant: async () => null,
  }),
  'school_learner_mapping_not_found',
  403,
)
await expectTenantError(
  () => authorizeSchoolLearnerAccess(teacher, learner, {
    resolveLearnerTenant: async () => ({ tenantId: 'school-beta', membershipStatus: 'active' }),
  }),
  'cross_tenant_access_denied',
  403,
)
await expectTenantError(
  () => authorizeSchoolLearnerAccess(teacher, learner, {
    resolveLearnerTenant: async () => ({ tenantId: 'school-alpha', membershipStatus: 'revoked' }),
  }),
  'school_learner_membership_inactive',
  403,
)

const guardianLearner = await authorizeGuardianLearnerLink(guardian, learner, {
  resolveGuardianLearnerLink: async ({ guardianActorId, learnerId }) => ({
    guardianActorId,
    learnerId,
    linkStatus: 'active',
  }),
})
assert.equal(guardianLearner.actorId, guardian.actorId)
assert.equal(guardianLearner.learnerId, learner)
assert.equal(guardianLearner.tenantId, null)

await expectTenantError(
  () => authorizeGuardianLearnerLink(guardian, learner),
  'guardian_link_resolver_not_configured',
  503,
)
await expectTenantError(
  () => authorizeGuardianLearnerLink(guardian, learner, {
    resolveGuardianLearnerLink: async () => ({
      guardianActorId: 'kvs_guardian_actor_999',
      learnerId: learner,
      linkStatus: 'active',
    }),
  }),
  'guardian_learner_link_mismatch',
  403,
)
await expectTenantError(
  () => authorizeGuardianLearnerLink(guardian, learner, {
    resolveGuardianLearnerLink: async () => ({
      guardianActorId: guardian.actorId,
      learnerId: learner,
      linkStatus: 'revoked',
    }),
  }),
  'guardian_learner_link_inactive',
  403,
)
await expectTenantError(
  () => authorizeGuardianLearnerLink(teacher, learner, {
    resolveGuardianLearnerLink: async () => ({
      guardianActorId: teacher.actorId,
      learnerId: learner,
      linkStatus: 'active',
    }),
  }),
  'guardian_role_required',
  403,
)

let observedActorTenant = null
await authorizeSchoolLearnerAccess(teacher, learner, {
  requestedTenantId: 'school-beta',
  resolveLearnerTenant: async ({ actorTenantId }) => {
    observedActorTenant = actorTenantId
    return { tenantId: actorTenantId, membershipStatus: 'active' }
  },
})
assert.equal(observedActorTenant, 'school-alpha', 'caller-supplied tenant hints must not override the trusted actor tenant')

const policy = tenantIsolationPolicy()
assert.equal(policy.platformAdminCrossTenantAccess, false)
assert.equal(policy.remoteTeacherMonitoringEnabled, false)
assert.equal(policy.browserDirectDatabaseAccessAllowed, false)
assert.equal(policy.realChildDataAllowed, false)

console.log('Tenant isolation and learner authorization boundary validation passed')
