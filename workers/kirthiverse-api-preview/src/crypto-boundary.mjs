const VERSION_PATTERN = /^[A-Za-z0-9._-]{1,32}$/
const CONTEXT_PATTERN = /^[A-Za-z0-9._:-]{1,96}$/
const MAX_PLAINTEXT_BYTES = 16 * 1024
const IV_BYTES = 12

export class CryptoBoundaryError extends Error {
  constructor(code, status = 503) {
    super(code)
    this.name = 'CryptoBoundaryError'
    this.code = code
    this.status = status
  }
}

function encodeBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new CryptoBoundaryError('ciphertext_encoding_invalid')
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  let binary
  try { binary = atob(padded) } catch { throw new CryptoBoundaryError('ciphertext_encoding_invalid') }
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function validateVersion(version) {
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) throw new CryptoBoundaryError('encryption_key_version_invalid')
  return version
}

function validateContext(context) {
  if (typeof context !== 'string' || !CONTEXT_PATTERN.test(context)) throw new CryptoBoundaryError('encryption_context_invalid')
  return context
}

function validatePlaintext(value) {
  if (typeof value !== 'string') throw new CryptoBoundaryError('plaintext_invalid', 400)
  const encoded = new TextEncoder().encode(value)
  if (encoded.byteLength === 0 || encoded.byteLength > MAX_PLAINTEXT_BYTES) throw new CryptoBoundaryError('plaintext_size_invalid', 400)
  return encoded
}

function validateCryptoKey(key) {
  if (!(key instanceof CryptoKey)) throw new CryptoBoundaryError('encryption_key_invalid')
  if (key.algorithm?.name !== 'AES-GCM') throw new CryptoBoundaryError('encryption_key_algorithm_invalid')
  if (key.algorithm?.length !== 256) throw new CryptoBoundaryError('encryption_key_length_invalid')
  if (!key.usages.includes('encrypt') || !key.usages.includes('decrypt')) throw new CryptoBoundaryError('encryption_key_usage_invalid')
  return key
}

async function resolveKey(keyVersion, options) {
  const resolveKey = options?.resolveKey
  if (typeof resolveKey !== 'function') throw new CryptoBoundaryError('encryption_key_resolver_not_configured')
  let key
  try { key = await resolveKey({ keyVersion }) } catch (error) {
    if (error instanceof CryptoBoundaryError) throw error
    throw new CryptoBoundaryError('encryption_key_resolver_failed')
  }
  if (!key) throw new CryptoBoundaryError('encryption_key_not_found')
  return validateCryptoKey(key)
}

function aadBytes(context, keyVersion) {
  return new TextEncoder().encode(`kirthiverse:v1:${context}:${keyVersion}`)
}

export async function encryptSensitiveString(value, context, keyVersion, options = {}) {
  const plaintext = validatePlaintext(value)
  const normalizedContext = validateContext(context)
  const normalizedVersion = validateVersion(keyVersion)
  const key = await resolveKey(normalizedVersion, options)
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  let encrypted
  try {
    encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aadBytes(normalizedContext, normalizedVersion), tagLength: 128 }, key, plaintext)
  } catch { throw new CryptoBoundaryError('encryption_failed') }
  return Object.freeze({ algorithm: 'A256GCM', keyVersion: normalizedVersion, context: normalizedContext, iv: encodeBase64Url(iv), ciphertext: encodeBase64Url(new Uint8Array(encrypted)) })
}

export async function decryptSensitiveString(envelope, expectedContext, options = {}) {
  if (!envelope || typeof envelope !== 'object') throw new CryptoBoundaryError('ciphertext_envelope_invalid')
  if (envelope.algorithm !== 'A256GCM') throw new CryptoBoundaryError('ciphertext_algorithm_invalid')
  const keyVersion = validateVersion(envelope.keyVersion)
  const context = validateContext(envelope.context)
  const normalizedExpectedContext = validateContext(expectedContext)
  if (context !== normalizedExpectedContext) throw new CryptoBoundaryError('ciphertext_context_mismatch', 403)
  const iv = decodeBase64Url(envelope.iv)
  if (iv.byteLength !== IV_BYTES) throw new CryptoBoundaryError('ciphertext_iv_invalid')
  const ciphertext = decodeBase64Url(envelope.ciphertext)
  if (ciphertext.byteLength < 17 || ciphertext.byteLength > MAX_PLAINTEXT_BYTES + 16) throw new CryptoBoundaryError('ciphertext_size_invalid')
  const key = await resolveKey(keyVersion, options)
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aadBytes(context, keyVersion), tagLength: 128 }, key, ciphertext)
    return new TextDecoder('utf-8', { fatal: true }).decode(decrypted)
  } catch { throw new CryptoBoundaryError('decryption_failed', 403) }
}

export function assertCiphertextOnlyRecord(record, encryptedFields) {
  if (!record || typeof record !== 'object' || !Array.isArray(encryptedFields) || encryptedFields.length === 0) throw new CryptoBoundaryError('ciphertext_record_policy_invalid')
  for (const field of encryptedFields) {
    if (typeof field !== 'string' || field.length < 1) throw new CryptoBoundaryError('ciphertext_field_policy_invalid')
    for (const name of [field, `${field}Plaintext`, `${field}_plaintext`]) {
      if (Object.prototype.hasOwnProperty.call(record, name)) throw new CryptoBoundaryError('plaintext_storage_field_forbidden', 500)
    }
    const envelope = record[`${field}Ciphertext`]
    if (!envelope || typeof envelope !== 'object' || envelope.algorithm !== 'A256GCM') throw new CryptoBoundaryError('ciphertext_storage_field_required', 500)
    validateVersion(envelope.keyVersion)
    validateContext(envelope.context)
  }
  return true
}

export function supportedEncryptionContract() {
  return Object.freeze({ algorithm: 'A256GCM', keyBits: 256, ivBytes: IV_BYTES, maxPlaintextBytes: MAX_PLAINTEXT_BYTES, keyResolverRequired: true, plaintextPersistenceAllowed: false })
}
