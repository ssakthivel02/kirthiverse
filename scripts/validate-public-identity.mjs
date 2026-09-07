import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.resolve(projectRoot, 'public')
const runtimeRoots = [path.resolve(projectRoot, 'index.html'), publicDir]
const forbidden = [
  { label: 'legacy ArivuKids product name', pattern: /ArivuKids/i },
  { label: 'legacy ArivuKids production domain', pattern: /arivukids\.omsaravanabhava\.org/i },
]

function filesUnder(target) {
  const stats = fs.statSync(target)
  if (stats.isFile()) return [target]
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name)
    return entry.isDirectory() ? filesUnder(fullPath) : [fullPath]
  })
}

const textExtensions = new Set(['.html', '.htm', '.js', '.json', '.txt', '.xml', '.webmanifest', '.svg', '.css'])
const runtimeFiles = runtimeRoots.flatMap(filesUnder).filter((file) => textExtensions.has(path.extname(file).toLowerCase()) || path.basename(file) === 'CNAME')
const violations = []

for (const file of runtimeFiles) {
  const content = fs.readFileSync(file, 'utf8')
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) {
      violations.push(`${path.relative(projectRoot, file)}: ${rule.label}`)
    }
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf8'))
if (manifest.name !== 'KirthiVerse Learning Universe') violations.push('public/manifest.webmanifest: incorrect KirthiVerse PWA name')
if (manifest.short_name !== 'KirthiVerse') violations.push('public/manifest.webmanifest: incorrect KirthiVerse short name')

const openSearch = fs.readFileSync(path.join(publicDir, 'opensearch.xml'), 'utf8')
if (!openSearch.includes('<ShortName>KirthiVerse</ShortName>')) violations.push('public/opensearch.xml: incorrect KirthiVerse ShortName')
if (!openSearch.includes('https://kirthiverse.omsaravanabhava.org/search?q={searchTerms}')) violations.push('public/opensearch.xml: incorrect production search URL')

const indexHtml = fs.readFileSync(path.resolve(projectRoot, 'index.html'), 'utf8')
if (!indexHtml.includes('rel="canonical" href="https://kirthiverse.omsaravanabhava.org/"')) violations.push('index.html: incorrect KirthiVerse canonical URL')

const security = fs.readFileSync(path.join(publicDir, '.well-known', 'security.txt'), 'utf8')
if (!security.includes('Canonical: https://kirthiverse.omsaravanabhava.org/.well-known/security.txt')) violations.push('public/.well-known/security.txt: incorrect canonical security URL')

if (violations.length) {
  console.error('KirthiVerse public identity validation failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`✓ KirthiVerse public identity: ${runtimeFiles.length} runtime/public text assets are free of legacy ArivuKids identity`)
console.log('✓ PWA, OpenSearch, canonical and security metadata target kirthiverse.omsaravanabhava.org')
