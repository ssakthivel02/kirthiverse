import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const manifestPath = path.join(root, 'config/cloud-identity-preview.json')
const schemaPath = path.join(root, 'database/kirthiverse-preview/001_cloud_identity_preview.sql')

function fail(message) {
  console.error(`Cloud identity preview validation failed: ${message}`)
  process.exit(1)
}

if (!fs.existsSync(manifestPath)) fail('missing config/cloud-identity-preview.json')
if (!fs.existsSync(schemaPath)) fail('missing database/kirthiverse-preview/001_cloud_identity_preview.sql')

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const sql = fs.readFileSync(schemaPath, 'utf8')

const expectedManifest = {
  database: 'kirthiverse_preview',
  engine: 'mysql',
  environment: 'preview',
  featureFlag: 'KVS_CLOUD_IDENTITY_PREVIEW',
  enabledByDefault: false,
  realChildDataAllowed: false,
  browserDirectDatabaseAccessAllowed: false,
  passwordStorageAllowed: false,
  learnerDirectLoginAllowed: false,
  remoteTeacherMonitoringAllowed: false,
  schoolRosterSyncAllowed: false,
}

for (const [key, expected] of Object.entries(expectedManifest)) {
  if (manifest[key] !== expected) fail(`${key} must be ${JSON.stringify(expected)}`)
}

if (manifest.authenticationMode !== 'adult-owned-external-provider') {
  fail('authenticationMode must remain adult-owned-external-provider')
}

if (manifest.sensitiveFieldPolicy !== 'application-encrypted-before-persistence') {
  fail('sensitiveFieldPolicy must require application encryption')
}

const requiredGates = [
  'adult-authentication',
  'guardian-consent',
  'rbac',
  'tenant-isolation',
  'encryption-key-management',
  'retention-deletion-export',
  'audit-logging',
  'database-network-restriction',
  'abuse-rate-limiting',
  'security-review',
]

if (!Array.isArray(manifest.requiredReleaseGates)) fail('requiredReleaseGates must be an array')
for (const gate of requiredGates) {
  if (!manifest.requiredReleaseGates.includes(gate)) fail(`required release gate missing: ${gate}`)
}

const requiredTables = [
  'adult_accounts',
  'adult_private_contacts',
  'learner_profiles',
  'guardian_learner_links',
  'teacher_profiles',
  'schools',
  'school_memberships',
  'assignments',
  'assignment_targets',
  'consent_ledger',
  'learner_progress_sync',
  'audit_events',
  'data_subject_requests',
]

for (const table of requiredTables) {
  const pattern = new RegExp(`CREATE\\s+TABLE\\s+${table}\\s*\\(`, 'i')
  if (!pattern.test(sql)) fail(`required table missing: ${table}`)
}

const forbiddenStorage = [
  /\bpassword\b\s+(?:varchar|text|varbinary|blob)/i,
  /\bpassword_hash\b/i,
  /\bchild_email\b/i,
  /\blearner_email\b/i,
  /\bdate_of_birth\b/i,
  /\bphone_number\b/i,
]

for (const pattern of forbiddenStorage) {
  if (pattern.test(sql)) fail(`forbidden sensitive-field pattern present: ${pattern}`)
}

const requiredSafetySignals = [
  'cloud_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE',
  'provider_subject_hash BINARY(32)',
  'email_ciphertext VARBINARY',
  'email_lookup_hash BINARY(32)',
  'display_name_ciphertext VARBINARY',
  'consent_ledger',
  'audit_events',
  'data_subject_requests',
]

for (const signal of requiredSafetySignals) {
  if (!sql.includes(signal)) fail(`required safety signal missing: ${signal}`)
}

const createCount = [...sql.matchAll(/CREATE\s+TABLE\s+/gi)].length
if (createCount !== requiredTables.length) {
  fail(`expected ${requiredTables.length} tables, found ${createCount}`)
}

console.log(`Cloud identity preview contract valid: ${requiredTables.length} tables, feature disabled by default, real child data blocked.`)
