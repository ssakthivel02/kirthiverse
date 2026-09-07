import fs from 'node:fs'
import path from 'node:path'

const assetsDir = path.resolve('dist/assets')
const MAX_JS_CHUNK_BYTES = 550 * 1024

if (!fs.existsSync(assetsDir)) {
  console.error('Bundle budget failed: dist/assets does not exist.')
  process.exit(1)
}

const jsFiles = fs.readdirSync(assetsDir).filter((name) => name.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error('Bundle budget failed: no JavaScript chunks found in dist/assets.')
  process.exit(1)
}

const chunks = jsFiles
  .map((name) => {
    const bytes = fs.statSync(path.join(assetsDir, name)).size
    return { name, bytes }
  })
  .sort((a, b) => b.bytes - a.bytes)

console.log('KirthiVerse JavaScript chunk budget:')
for (const chunk of chunks) {
  console.log(`- ${chunk.name}: ${(chunk.bytes / 1024).toFixed(1)} KiB`)
}

const offenders = chunks.filter((chunk) => chunk.bytes > MAX_JS_CHUNK_BYTES)
if (offenders.length > 0) {
  console.error(`Bundle budget failed: JavaScript chunks must be <= ${MAX_JS_CHUNK_BYTES / 1024} KiB.`)
  for (const chunk of offenders) {
    console.error(`- ${chunk.name}: ${(chunk.bytes / 1024).toFixed(1)} KiB`)
  }
  process.exit(1)
}

console.log(`Bundle budget passed: ${chunks.length} JavaScript chunks, largest ${(chunks[0].bytes / 1024).toFixed(1)} KiB.`)
