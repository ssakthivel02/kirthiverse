import assert from 'node:assert/strict'
import {
  PersistenceSecurityError,
  executeRestrictedPersistenceOperation,
  persistenceSecurityContract,
  validateNetworkAttestation,
  validatePersistenceAdapter,
} from '../workers/kirthiverse-api-preview/src/persistence-security.mjs'

function expectError(code, fn) {
  return assert.rejects(async () => fn(), (error) => error instanceof PersistenceSecurityError && error.code === code)
}

const privateAttestation = {
  source: 'trusted-server-network-policy',
  tlsRequired: true,
  browserReachable: false,
  publicInternetReachable: false,
  allowedCidrs: ['10.20.0.0/24', '172.20.10.0/24'],
}

const network = validateNetworkAttestation(privateAttestation)
assert.equal(network.tlsRequired, true)
assert.equal(network.publicInternetReachable, false)

assert.throws(() => validateNetworkAttestation({ ...privateAttestation, tlsRequired: false }), (e) => e.code === 'database_tls_required')
assert.throws(() => validateNetworkAttestation({ ...privateAttestation, browserReachable: true }), (e) => e.code === 'browser_database_reachability_rejected')
assert.throws(() => validateNetworkAttestation({ ...privateAttestation, publicInternetReachable: true }), (e) => e.code === 'public_database_reachability_rejected')
assert.throws(() => validateNetworkAttestation({ ...privateAttestation, allowedCidrs: ['0.0.0.0/0'] }), (e) => e.code === 'public_database_cidr_rejected')
assert.throws(() => validateNetworkAttestation({ ...privateAttestation, allowedCidrs: ['::/0'] }), (e) => e.code === 'public_database_cidr_rejected')
assert.throws(() => validateNetworkAttestation({ ...privateAttestation, allowedCidrs: ['203.0.113.10/32'] }), (e) => e.code === 'database_private_network_required')

const calls = []
const adapter = {
  syntheticPreview: true,
  browserCallable: false,
  networkAttestation: privateAttestation,
  async executeOperation(input) {
    calls.push(input)
    return { ok: true, operation: input.operation }
  },
}

validatePersistenceAdapter(adapter, { trustedServer: true })
assert.throws(() => validatePersistenceAdapter(adapter, { trustedServer: false }), (e) => e.code === 'trusted_server_persistence_required')
assert.throws(() => validatePersistenceAdapter({ ...adapter, browserCallable: true }, { trustedServer: true }), (e) => e.code === 'browser_callable_adapter_rejected')
assert.throws(() => validatePersistenceAdapter(adapter, { trustedServer: true, clientInput: { databaseUrl: 'mysql://attacker' } }), (e) => e.code === 'client_persistence_override_rejected')

const result = await executeRestrictedPersistenceOperation(adapter, {
  operation: 'consent_ledger.resolve',
  parameters: { learnerId: 'synthetic-learner' },
  context: { trustedAuthorization: true, realChildData: false, tenantId: 'synthetic-tenant', actorId: 'synthetic-adult' },
}, { trustedServer: true })
assert.equal(result.ok, true)
assert.equal(calls.length, 1)
assert.equal(calls[0].operation, 'consent_ledger.resolve')
assert.equal(calls[0].context.realChildData, false)

await expectError('arbitrary_sql_rejected', () => executeRestrictedPersistenceOperation(adapter, {
  operation: 'consent_ledger.resolve', sql: 'SELECT * FROM consent_ledger',
  context: { trustedAuthorization: true, realChildData: false },
}, { trustedServer: true }))
await expectError('persistence_operation_not_allowed', () => executeRestrictedPersistenceOperation(adapter, {
  operation: 'database.raw_query', context: { trustedAuthorization: true, realChildData: false },
}, { trustedServer: true }))
await expectError('trusted_authorization_context_required', () => executeRestrictedPersistenceOperation(adapter, {
  operation: 'learner_progress.read', context: { trustedAuthorization: false, realChildData: false },
}, { trustedServer: true }))
await expectError('real_child_cloud_data_rejected', () => executeRestrictedPersistenceOperation(adapter, {
  operation: 'learner_progress.write', context: { trustedAuthorization: true, realChildData: true },
}, { trustedServer: true }))
await expectError('persistence_authorization_bypass_rejected', () => executeRestrictedPersistenceOperation(adapter, {
  operation: 'adult_account.resolve', context: { trustedAuthorization: true, realChildData: false, platformAdminBypass: true },
}, { trustedServer: true }))

const contract = persistenceSecurityContract()
assert.equal(contract.trustedServerPersistenceRequired, true)
assert.equal(contract.tlsRequired, true)
assert.equal(contract.publicInternetDatabaseAccessAllowed, false)
assert.equal(contract.publicWildcardCidrsAllowed, false)
assert.equal(contract.browserDirectDatabaseAccessAllowed, false)
assert.equal(contract.browserDatabaseCredentialsAllowed, false)
assert.equal(contract.arbitrarySqlAllowed, false)
assert.equal(contract.operationAllowListRequired, true)
assert.equal(contract.realChildCloudDataAllowed, false)
assert.equal(contract.liveDatabaseBindingEnabled, false)
assert.equal(contract.liveAivenConnectivityClaimed, false)
assert.equal(contract.schemaAppliedClaimed, false)
assert.equal(contract.syntheticPreviewOnly, true)

console.log('Restricted database network & persistence boundary validation passed.')
