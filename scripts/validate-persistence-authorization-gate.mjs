import assert from 'node:assert/strict'
import {
  PersistenceAuthorizationGateError,
  authorizeFuturePersistence,
  persistenceAuthorizationGateContract,
} from '../workers/kirthiverse-api-preview/src/persistence-authorization-gate.mjs'

const actorId = 'kvs_guardian_000001'
const tenantId = 'kvs_tenant_000001'
const request = {
  operation: 'learner_progress.write',
  actorId,
  tenantId,
  realChildData: false,
}
const attestations = {
  authorization: {
    source: 'trusted-kirthiverse-authorization',
    verified: true,
    allowed: true,
    operation: request.operation,
    actorId,
    tenantId,
  },
  persistence: {
    source: 'trusted-persistence-security-boundary',
    verified: true,
    networkRestricted: true,
    liveBindingEnabled: false,
  },
  consent: {
    source: 'trusted-guardian-consent-ledger',
    verified: true,
    active: true,
    purpose: 'learner_progress_persistence',
    actorId,
    tenantId,
  },
  encryption: {
    source: 'trusted-encryption-boundary',
    verified: true,
    ciphertextOnly: true,
    keyResolvedServerSide: true,
    browserKeyMaterialPresent: false,
  },
  audit: {
    source: 'trusted-audit-integrity-boundary',
    verified: true,
    actorId,
    tenantId,
    operation: request.operation,
    readyForAtomicAppend: true,
  },
}

function expectCode(fn, code) {
  assert.throws(fn, (error) => error instanceof PersistenceAuthorizationGateError && error.code === code)
}

const authorized = authorizeFuturePersistence(request, attestations)
assert.deepEqual(authorized, {
  trustedAuthorization: true,
  operation: 'learner_progress.write',
  actorId,
  tenantId,
  realChildData: false,
  tenantBypass: false,
  platformAdminBypass: false,
  previewOnly: true,
})

expectCode(() => authorizeFuturePersistence({ ...request, realChildData: true }, attestations), 'real_child_cloud_data_rejected')
expectCode(() => authorizeFuturePersistence({ ...request, tenantBypass: true }, attestations), 'persistence_authorization_bypass_rejected')
expectCode(() => authorizeFuturePersistence({ ...request, actorId: 'child@example.test' }, attestations), 'persistence_actor_id_invalid')
expectCode(() => authorizeFuturePersistence(request, { ...attestations, authorization: { ...attestations.authorization, actorId: 'kvs_guardian_999999' } }), 'authorization_context_mismatch')
expectCode(() => authorizeFuturePersistence(request, { ...attestations, consent: { ...attestations.consent, active: false } }), 'guardian_consent_not_authorized')
expectCode(() => authorizeFuturePersistence(request, { ...attestations, encryption: { ...attestations.encryption, ciphertextOnly: false } }), 'encryption_boundary_not_satisfied')
expectCode(() => authorizeFuturePersistence(request, { ...attestations, encryption: { ...attestations.encryption, browserKeyMaterialPresent: true } }), 'encryption_boundary_not_satisfied')
expectCode(() => authorizeFuturePersistence(request, { ...attestations, audit: { ...attestations.audit, readyForAtomicAppend: false } }), 'audit_boundary_not_satisfied')
expectCode(() => authorizeFuturePersistence(request, { ...attestations, persistence: { ...attestations.persistence, networkRestricted: false } }), 'persistence_boundary_not_ready')
expectCode(() => authorizeFuturePersistence({ ...request, operation: 'unknown.write' }, attestations), 'persistence_write_operation_not_allowed')

const dsrRequest = { operation: 'data_subject_request.write', actorId, tenantId, realChildData: false }
const dsrAttestations = {
  authorization: { ...attestations.authorization, operation: dsrRequest.operation },
  persistence: attestations.persistence,
  audit: { ...attestations.audit, operation: dsrRequest.operation },
}
assert.equal(authorizeFuturePersistence(dsrRequest, dsrAttestations).trustedAuthorization, true)

const contract = persistenceAuthorizationGateContract()
assert.equal(contract.syntheticPreviewOnly, true)
assert.equal(contract.liveWritesEnabled, false)
assert.equal(contract.realChildCloudDataAllowed, false)
assert.equal(contract.guardianConsentRequiredForLearnerProgress, true)
assert.equal(contract.ciphertextOnlyRequiredForLearnerProgress, true)
assert.equal(contract.auditIntegrityRequiredBeforeFutureWrite, true)
assert.equal(contract.implicitPlatformAdminBypassAllowed, false)

console.log('Future persistence authorization gate validation passed')
