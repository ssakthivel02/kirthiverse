import assert from 'node:assert/strict'
import {
  CryptoBoundaryError,
  assertCiphertextOnlyRecord,
  decryptSensitiveString,
  encryptSensitiveString,
  supportedEncryptionContract,
} from '../workers/kirthiverse-api-preview/src/crypto-boundary.mjs'

async function createAesKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

async function expectCryptoError(factory, code, status = 503) {
  await assert.rejects(
    factory,
    (error) => error instanceof CryptoBoundaryError && error.code === code && error.status === status,
  )
}

const keyV1 = await createAesKey()
const keyV2 = await createAesKey()
const keys = new Map([
  ['2026-09-k1', keyV1],
  ['2026-10-k2', keyV2],
])
const resolveKey = async ({ keyVersion }) => keys.get(keyVersion) || null

const plaintext = 'synthetic-adult-contact@example.test'
const context = 'adult_private_contacts.email_ciphertext'
const envelopeV1 = await encryptSensitiveString(plaintext, context, '2026-09-k1', { resolveKey })

assert.equal(envelopeV1.algorithm, 'A256GCM')
assert.equal(envelopeV1.keyVersion, '2026-09-k1')
assert.equal(envelopeV1.context, context)
assert.ok(envelopeV1.iv.length > 0)
assert.ok(envelopeV1.ciphertext.length > 0)
assert.ok(!JSON.stringify(envelopeV1).includes(plaintext), 'envelope must never contain plaintext')
assert.equal(await decryptSensitiveString(envelopeV1, context, { resolveKey }), plaintext)

await expectCryptoError(
  () => decryptSensitiveString(envelopeV1, 'learner_profiles.display_name_ciphertext', { resolveKey }),
  'ciphertext_context_mismatch',
  403,
)

const tampered = {
  ...envelopeV1,
  ciphertext: `${envelopeV1.ciphertext.slice(0, -1)}${envelopeV1.ciphertext.endsWith('A') ? 'B' : 'A'}`,
}
await expectCryptoError(() => decryptSensitiveString(tampered, context, { resolveKey }), 'decryption_failed', 403)

await expectCryptoError(
  () => encryptSensitiveString(plaintext, context, 'missing-key', { resolveKey }),
  'encryption_key_not_found',
)
await expectCryptoError(
  () => encryptSensitiveString(plaintext, context, '2026-09-k1'),
  'encryption_key_resolver_not_configured',
)

const envelopeV2 = await encryptSensitiveString(plaintext, context, '2026-10-k2', { resolveKey })
assert.equal(envelopeV2.keyVersion, '2026-10-k2')
assert.equal(await decryptSensitiveString(envelopeV2, context, { resolveKey }), plaintext)
assert.equal(await decryptSensitiveString(envelopeV1, context, { resolveKey }), plaintext, 'old ciphertext remains decryptable while old key is retained')

assert.equal(assertCiphertextOnlyRecord({ emailCiphertext: envelopeV1 }, ['email']), true)
assert.throws(
  () => assertCiphertextOnlyRecord({ email: plaintext, emailCiphertext: envelopeV1 }, ['email']),
  (error) => error instanceof CryptoBoundaryError && error.code === 'plaintext_storage_field_forbidden',
)
assert.throws(
  () => assertCiphertextOnlyRecord({}, ['email']),
  (error) => error instanceof CryptoBoundaryError && error.code === 'ciphertext_storage_field_required',
)

const contract = supportedEncryptionContract()
assert.equal(contract.algorithm, 'A256GCM')
assert.equal(contract.ivBytes, 12)
assert.equal(contract.keyResolverRequired, true)
assert.equal(contract.plaintextPersistenceAllowed, false)

console.log('Encryption key management and sensitive data boundary validation passed')
