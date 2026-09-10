const ENVIRONMENTS = new Set(['preview', 'staging', 'production'])
const SECRET_NAME_PATTERN = /(?:SECRET|TOKEN|PASSWORD|PRIVATE|KEY_MATERIAL|DATABASE_URL|DB_PASSWORD|RATE_LIMIT_SALT)$/i
const FORBIDDEN_CLIENT_HINTS = new Set([
  'environment', 'configEnvironment', 'secret', 'secrets', 'databaseUrl', 'dbPassword',
  'keyMaterial', 'rateLimitSalt', 'authIssuer', 'authAudience', 'authJwksUrl',
])
const PLACEHOLDER_PATTERN = /^(?:changeme|change-me|placeholder|example|example-secret|default|secret|test|testing|dev|development|preview|sample|dummy|synthetic|todo|replace-me|replace_me)$/i
const PLACEHOLDER_FRAGMENT_PATTERN = /(?:placeholder|changeme|replace[-_ ]?me|example-secret|dummy-secret|synthetic|test-secret|sample-secret)/i
const MAX_VALUE_LENGTH = 8192

export class ConfigSecurityError extends Error {
  constructor(code, status = 503) {
    super(code)
    this.name = 'ConfigSecurityError'
    this.code = code
    this.status = status
  }
}

function boundedString(value, code, { min = 1, max = MAX_VALUE_LENGTH } = {}) {
  if (typeof value !== 'string') throw new ConfigSecurityError(code)
  const normalized = value.trim()
  if (normalized.length < min || normalized.length > max) throw new ConfigSecurityError(code)
  return normalized
}

function requireHttps(value, code) {
  let url
  try { url = new URL(boundedString(value, code, { min: 8, max: 2048 })) } catch { throw new ConfigSecurityError(code) }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new ConfigSecurityError(code)
  return url.toString()
}

function rejectClientOverrides(clientInput = {}) {
  if (!clientInput || typeof clientInput !== 'object' || Array.isArray(clientInput)) return
  for (const key of Object.keys(clientInput)) {
    if (FORBIDDEN_CLIENT_HINTS.has(key)) throw new ConfigSecurityError('client_configuration_override_rejected', 400)
  }
}

function validateSecretValue(name, value, environment) {
  const secret = boundedString(value, `config_${name.toLowerCase()}_invalid`, { min: 16 })
  if (environment === 'production' && (PLACEHOLDER_PATTERN.test(secret) || PLACEHOLDER_FRAGMENT_PATTERN.test(secret))) {
    throw new ConfigSecurityError(`config_${name.toLowerCase()}_placeholder_rejected`)
  }
  return secret
}

export function isSensitiveConfigName(name) {
  return typeof name === 'string' && SECRET_NAME_PATTERN.test(name)
}

export function redactConfigValue(name, value) {
  if (value == null) return value
  if (isSensitiveConfigName(name)) return '[REDACTED]'
  if (typeof value === 'string' && /(?:bearer\s+[A-Za-z0-9._~-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i.test(value)) return '[REDACTED]'
  return value
}

export function redactConfigObject(input, depth = 0) {
  if (depth > 6) return '[REDACTED]'
  if (input == null || typeof input !== 'object') return input
  if (Array.isArray(input)) return input.map((value) => (typeof value === 'object' ? redactConfigObject(value, depth + 1) : value))
  const output = {}
  for (const [key, value] of Object.entries(input)) {
    if (isSensitiveConfigName(key)) output[key] = '[REDACTED]'
    else if (value && typeof value === 'object') output[key] = redactConfigObject(value, depth + 1)
    else output[key] = redactConfigValue(key, value)
  }
  return output
}

export function validateTrustedServerConfiguration(env = {}, options = {}) {
  rejectClientOverrides(options.clientInput)
  if (options.trustedServer !== true) throw new ConfigSecurityError('trusted_server_configuration_required')

  const environment = boundedString(env.KVS_ENVIRONMENT || 'preview', 'config_environment_invalid', { min: 4, max: 16 }).toLowerCase()
  if (!ENVIRONMENTS.has(environment)) throw new ConfigSecurityError('config_environment_invalid')

  const previewEnabled = String(env.KVS_CLOUD_IDENTITY_PREVIEW || 'false').toLowerCase() === 'true'
  if (environment === 'production' && previewEnabled) throw new ConfigSecurityError('production_preview_mode_rejected')

  const allowedOrigins = boundedString(env.KVS_ALLOWED_ORIGINS || 'https://kirthiverse.omsaravanabhava.org', 'config_allowed_origins_invalid', { max: 4096 })
    .split(',').map((v) => v.trim()).filter(Boolean)
  if (allowedOrigins.length === 0 || allowedOrigins.length > 20) throw new ConfigSecurityError('config_allowed_origins_invalid')
  for (const origin of allowedOrigins) {
    const parsed = new URL(requireHttps(origin, 'config_allowed_origins_invalid'))
    if (parsed.pathname !== '/' || parsed.search || parsed.hash) throw new ConfigSecurityError('config_allowed_origins_invalid')
  }

  const authConfigured = Boolean(env.KVS_AUTH_JWKS_URL || env.KVS_AUTH_ISSUER || env.KVS_AUTH_AUDIENCE)
  let auth = null
  if (authConfigured) {
    if (!env.KVS_AUTH_JWKS_URL || !env.KVS_AUTH_ISSUER || !env.KVS_AUTH_AUDIENCE) throw new ConfigSecurityError('auth_configuration_incomplete')
    auth = Object.freeze({
      jwksUrl: requireHttps(env.KVS_AUTH_JWKS_URL, 'config_auth_jwks_url_invalid'),
      issuer: boundedString(env.KVS_AUTH_ISSUER, 'config_auth_issuer_invalid', { max: 2048 }),
      audience: boundedString(env.KVS_AUTH_AUDIENCE, 'config_auth_audience_invalid', { max: 512 }),
    })
  }

  const keyVersion = env.KVS_ENCRYPTION_KEY_VERSION == null ? null : boundedString(env.KVS_ENCRYPTION_KEY_VERSION, 'config_encryption_key_version_invalid', { max: 128 })
  const keyMaterial = env.KVS_ENCRYPTION_KEY_MATERIAL == null ? null : validateSecretValue('ENCRYPTION_KEY_MATERIAL', env.KVS_ENCRYPTION_KEY_MATERIAL, environment)
  if (keyMaterial && !keyVersion) throw new ConfigSecurityError('encryption_key_version_required')

  const rateLimitSalt = env.KVS_RATE_LIMIT_SALT == null ? null : validateSecretValue('RATE_LIMIT_SALT', env.KVS_RATE_LIMIT_SALT, environment)
  const databaseUrl = env.KVS_DATABASE_URL == null ? null : validateSecretValue('DATABASE_URL', env.KVS_DATABASE_URL, environment)

  if (environment === 'production') {
    if (!auth) throw new ConfigSecurityError('production_auth_configuration_required')
    if (!keyVersion || !keyMaterial) throw new ConfigSecurityError('production_encryption_configuration_required')
    if (!rateLimitSalt) throw new ConfigSecurityError('production_rate_limit_salt_required')
  }

  return Object.freeze({
    environment,
    previewEnabled,
    allowedOrigins: Object.freeze([...allowedOrigins]),
    auth,
    encryption: Object.freeze({ keyVersion, keyMaterialConfigured: Boolean(keyMaterial) }),
    rateLimiting: Object.freeze({ saltConfigured: Boolean(rateLimitSalt) }),
    persistence: Object.freeze({ databaseConfigured: Boolean(databaseUrl), browserDirectDatabaseAccessAllowed: false }),
  })
}

export function configurationSecurityContract() {
  return Object.freeze({
    trustedServerConfigurationRequired: true,
    environmentSeparationRequired: true,
    clientConfigurationOverridesAllowed: false,
    browserSecretExposureAllowed: false,
    browserDatabaseCredentialsAllowed: false,
    productionPlaceholderSecretsAllowed: false,
    productionSyntheticSecretsAllowed: false,
    secretValuesAllowedInLogsAuditOrErrors: false,
    keyVersionSeparatedFromKeyMaterial: true,
    productionSecuritySensitiveMissingConfigFailureMode: 'closed',
    liveSecretsManagerConfigured: false,
    liveKmsConfigured: false,
    liveProductionSecretsProvisioned: false,
    syntheticPreviewOnly: true,
  })
}
