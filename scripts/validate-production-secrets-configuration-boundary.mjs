import assert from 'node:assert/strict'
import {
  ConfigSecurityError,
  configurationSecurityContract,
  isSensitiveConfigName,
  redactConfigObject,
  validateTrustedServerConfiguration,
} from '../workers/kirthiverse-api-preview/src/config-security.mjs'

function expectConfigError(code, fn) {
  assert.throws(fn, (error) => error instanceof ConfigSecurityError && error.code === code)
}

const preview = validateTrustedServerConfiguration({
  KVS_ENVIRONMENT: 'preview',
  KVS_CLOUD_IDENTITY_PREVIEW: 'false',
  KVS_ALLOWED_ORIGINS: 'https://kirthiverse.omsaravanabhava.org',
}, { trustedServer: true })
assert.equal(preview.environment, 'preview')
assert.equal(preview.persistence.browserDirectDatabaseAccessAllowed, false)

expectConfigError('trusted_server_configuration_required', () => validateTrustedServerConfiguration({}, {}))
expectConfigError('client_configuration_override_rejected', () => validateTrustedServerConfiguration({}, {
  trustedServer: true,
  clientInput: { rateLimitSalt: 'attacker-controlled' },
}))
expectConfigError('config_environment_invalid', () => validateTrustedServerConfiguration({ KVS_ENVIRONMENT: 'local-prod' }, { trustedServer: true }))
expectConfigError('production_preview_mode_rejected', () => validateTrustedServerConfiguration({
  KVS_ENVIRONMENT: 'production', KVS_CLOUD_IDENTITY_PREVIEW: 'true',
}, { trustedServer: true }))
expectConfigError('auth_configuration_incomplete', () => validateTrustedServerConfiguration({
  KVS_AUTH_JWKS_URL: 'https://id.example.com/jwks.json',
}, { trustedServer: true }))
expectConfigError('config_auth_jwks_url_invalid', () => validateTrustedServerConfiguration({
  KVS_AUTH_JWKS_URL: 'http://id.example.com/jwks.json',
  KVS_AUTH_ISSUER: 'https://id.example.com/',
  KVS_AUTH_AUDIENCE: 'kirthiverse',
}, { trustedServer: true }))
expectConfigError('config_allowed_origins_invalid', () => validateTrustedServerConfiguration({
  KVS_ALLOWED_ORIGINS: 'https://kirthiverse.omsaravanabhava.org/path',
}, { trustedServer: true }))
expectConfigError('encryption_key_version_required', () => validateTrustedServerConfiguration({
  KVS_ENCRYPTION_KEY_MATERIAL: 'preview-only-key-material-1234567890',
}, { trustedServer: true }))
expectConfigError('production_auth_configuration_required', () => validateTrustedServerConfiguration({
  KVS_ENVIRONMENT: 'production',
}, { trustedServer: true }))
expectConfigError('config_encryption_key_material_placeholder_rejected', () => validateTrustedServerConfiguration({
  KVS_ENVIRONMENT: 'production',
  KVS_AUTH_JWKS_URL: 'https://id.example.com/jwks.json',
  KVS_AUTH_ISSUER: 'https://id.example.com/',
  KVS_AUTH_AUDIENCE: 'kirthiverse',
  KVS_ENCRYPTION_KEY_VERSION: 'v1',
  KVS_ENCRYPTION_KEY_MATERIAL: 'placeholder-secret-value',
  KVS_RATE_LIMIT_SALT: 'Q2hBTmdFMlRoaXNGaXJzdFNhbHRWYWx1ZQ',
}, { trustedServer: true }))
expectConfigError('config_rate_limit_salt_placeholder_rejected', () => validateTrustedServerConfiguration({
  KVS_ENVIRONMENT: 'production',
  KVS_AUTH_JWKS_URL: 'https://id.example.com/jwks.json',
  KVS_AUTH_ISSUER: 'https://id.example.com/',
  KVS_AUTH_AUDIENCE: 'kirthiverse',
  KVS_ENCRYPTION_KEY_VERSION: 'v1',
  KVS_ENCRYPTION_KEY_MATERIAL: 'Rk9SQk9VTkRBUllWQUxJREFUSU9OT05MWQ',
  KVS_RATE_LIMIT_SALT: 'synthetic-production-salt-value',
}, { trustedServer: true }))

const production = validateTrustedServerConfiguration({
  KVS_ENVIRONMENT: 'production',
  KVS_CLOUD_IDENTITY_PREVIEW: 'false',
  KVS_ALLOWED_ORIGINS: 'https://kirthiverse.omsaravanabhava.org',
  KVS_AUTH_JWKS_URL: 'https://id.example.com/jwks.json',
  KVS_AUTH_ISSUER: 'https://id.example.com/',
  KVS_AUTH_AUDIENCE: 'kirthiverse-web',
  KVS_ENCRYPTION_KEY_VERSION: 'kms-key-v7',
  KVS_ENCRYPTION_KEY_MATERIAL: 'Rk9SQk9VTkRBUllWQUxJREFUSU9OT05MWQ',
  KVS_RATE_LIMIT_SALT: 'Q2hBTmdFMlRoaXNGaXJzdFNhbHRWYWx1ZQ',
}, { trustedServer: true })
assert.equal(production.environment, 'production')
assert.equal(production.auth.audience, 'kirthiverse-web')
assert.equal(production.encryption.keyVersion, 'kms-key-v7')
assert.equal(production.encryption.keyMaterialConfigured, true)
assert.equal(Object.hasOwn(production.encryption, 'keyMaterial'), false)
assert.equal(production.rateLimiting.saltConfigured, true)

assert.equal(isSensitiveConfigName('KVS_DB_PASSWORD'), true)
assert.equal(isSensitiveConfigName('KVS_RATE_LIMIT_SALT'), true)
const redacted = redactConfigObject({
  KVS_DB_PASSWORD: 'super-secret-password',
  nested: { KVS_ENCRYPTION_KEY_MATERIAL: 'secret-key-material' },
  tokenText: 'Bearer eyJabc.def.ghi',
  KVS_ALLOWED_ORIGINS: 'https://kirthiverse.omsaravanabhava.org',
})
assert.equal(redacted.KVS_DB_PASSWORD, '[REDACTED]')
assert.equal(redacted.nested.KVS_ENCRYPTION_KEY_MATERIAL, '[REDACTED]')
assert.equal(redacted.tokenText, '[REDACTED]')
assert.equal(redacted.KVS_ALLOWED_ORIGINS, 'https://kirthiverse.omsaravanabhava.org')

const contract = configurationSecurityContract()
assert.equal(contract.trustedServerConfigurationRequired, true)
assert.equal(contract.clientConfigurationOverridesAllowed, false)
assert.equal(contract.browserSecretExposureAllowed, false)
assert.equal(contract.browserDatabaseCredentialsAllowed, false)
assert.equal(contract.productionPlaceholderSecretsAllowed, false)
assert.equal(contract.productionSyntheticSecretsAllowed, false)
assert.equal(contract.liveSecretsManagerConfigured, false)
assert.equal(contract.liveKmsConfigured, false)
assert.equal(contract.liveProductionSecretsProvisioned, false)
assert.equal(contract.syntheticPreviewOnly, true)

console.log('Production secrets & configuration boundary validation passed.')
