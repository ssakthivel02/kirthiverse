import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { legacyPages } from './legacy-pages.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const sourceRelease = JSON.parse(fs.readFileSync(path.join(root, 'public', 'release-status.json'), 'utf8'))
const ORIGIN = 'https://kirthiverse.omsaravanabhava.org'

function requireFile(relativePath, allowEmpty = false) {
  const fullPath = path.join(dist, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing distribution file: ${relativePath}`)
  if (!allowEmpty && fs.statSync(fullPath).size === 0) throw new Error(`Empty distribution file: ${relativePath}`)
  return fullPath
}

function read(relativePath) {
  return fs.readFileSync(requireFile(relativePath), 'utf8')
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

try {
  if (!fs.existsSync(dist)) throw new Error('dist/ directory not found')

  for (const file of ['index.html', 'CNAME', 'manifest.webmanifest', 'sw.js', 'offline.html', 'reset-site.html', 'opensearch.xml', 'icons/kirthiverse-icon.svg', 'release-status.json', 'deployment-metadata.json', 'security.txt', '.well-known/security.txt', 'robots.txt', 'sitemap.xml']) requireFile(file)
  requireFile('.nojekyll', true)

  const index = read('index.html')
  if (/\/src\/|\.tsx(?:["'?#]|$)/i.test(index)) throw new Error('Distribution index still references source TypeScript')
  if (!index.includes(`rel="canonical" href="${ORIGIN}/"`)) throw new Error('Distribution canonical URL is not the KirthiVerse production origin')
  if (!index.includes('name="application-name" content="KirthiVerse"')) throw new Error('Distribution application identity is not KirthiVerse')
  if (/ArivuKids|arivukids\.omsaravanabhava\.org/i.test(index)) throw new Error('Legacy donor identity leaked into distribution index')
  if (!index.includes('name="robots" content="index, follow')) throw new Error('Distribution index is missing public crawler metadata')
  if (!index.includes('rel="manifest" href="/manifest.webmanifest"')) throw new Error('Distribution index is missing the PWA manifest')
  if (!index.includes('rel="search"') || !index.includes('/opensearch.xml')) throw new Error('Distribution index is missing OpenSearch discovery')
  if (!index.includes('name="kvs-release-shell" content="KVS-PLATFORM-001"')) throw new Error('Distribution index is missing the runtime shell marker')

  const serviceWorker = read('sw.js')
  const cacheName = serviceWorker.match(/const CACHE_NAME = '([^']+)'/)?.[1] ?? ''
  const shellCacheName = index.match(/name="kvs-cache-generation" content="([^"]+)"/)?.[1] ?? ''
  if (!cacheName.startsWith('kirthiverse-shell-')) throw new Error('Service worker has an invalid KirthiVerse cache generation')
  if (shellCacheName !== cacheName) throw new Error(`Shell/service-worker cache generation drift: shell=${shellCacheName || 'missing'} worker=${cacheName || 'missing'}`)
  for (const marker of ['compiledAssetUrls', 'fetchAndCache', 'networkFirstNavigation', 'staleWhileRevalidate', 'stale or incomplete KirthiVerse application shell', "fetch(request, { cache: 'no-store' })", "event.data?.type === 'SKIP_WAITING'", 'notifyAllClients']) {
    if (!serviceWorker.includes(marker)) throw new Error(`Service worker is missing required runtime control: ${marker}`)
  }
  for (const asset of ['/offline.html', '/reset-site.html', '/manifest.webmanifest', '/opensearch.xml', '/security.txt', '/.well-known/security.txt']) {
    if (!serviceWorker.includes(`'${asset}'`)) throw new Error(`Service worker does not precache ${asset}`)
  }

  const manifest = JSON.parse(read('manifest.webmanifest'))
  if (manifest.name !== 'KirthiVerse Learning Universe' || manifest.short_name !== 'KirthiVerse') throw new Error('PWA manifest has stale product identity')
  if (manifest.start_url !== '/' || manifest.scope !== '/') throw new Error('PWA manifest does not target the root custom domain')
  if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.src === '/icons/kirthiverse-icon.svg')) throw new Error('PWA manifest is missing the KirthiVerse icon')

  const openSearch = read('opensearch.xml')
  if (!openSearch.includes('<ShortName>KirthiVerse</ShortName>') || !openSearch.includes(`${ORIGIN}/search?q={searchTerms}`)) throw new Error('OpenSearch does not target current KirthiVerse search')
  if (/ArivuKids|arivukids\.omsaravanabhava\.org/i.test(openSearch)) throw new Error('Legacy donor identity leaked into OpenSearch')

  const security = read('.well-known/security.txt')
  if (security !== read('security.txt')) throw new Error('Root security contact differs from canonical security contact')
  if (!security.includes(`Canonical: ${ORIGIN}/.well-known/security.txt`)) throw new Error('Security contact canonical URL is stale')

  const release = JSON.parse(read('release-status.json'))
  if (release.product !== 'KirthiVerse' || release.release !== sourceRelease.release) throw new Error('Distribution release identity differs from checked-out source contract')
  if (release.runtimeShellMarker !== 'KVS-PLATFORM-001' || release.runtimeRecoveryReady !== true) throw new Error('Distribution runtime recovery contract is invalid')
  if (release.localFirst !== true || release.cloudChildProfiles !== false || release.schoolRosters !== false || release.remoteTeacherMonitoring !== false) throw new Error('Distribution violates local-first child-data boundaries')
  if (release.subjects !== sourceRelease.subjects || release.lessons !== sourceRelease.lessons || release.quizQuestions !== sourceRelease.quizQuestions) throw new Error('Distribution catalogue totals differ from checked-out source contract')
  if (!['preview', 'production'].includes(release.channel)) throw new Error('Distribution release channel is unsupported')
  const expectedStatus = release.channel === 'production' ? 'production-runtime-recovery-artifact' : 'runtime-recovery-preview-artifact'
  if (release.status !== expectedStatus) throw new Error(`Distribution status does not match ${release.channel} channel`)
  if (typeof release.buildCommit !== 'string' || release.buildCommit.length < 7 || Number.isNaN(Date.parse(release.builtAt))) throw new Error('Distribution build provenance is incomplete')
  for (const pending of sourceRelease.remainingGates ?? []) {
    if (!release.remainingGates?.includes(pending)) throw new Error(`Distribution omitted source pending gate: ${pending}`)
  }

  const deployment = JSON.parse(read('deployment-metadata.json'))
  if (deployment.product !== 'KirthiVerse' || deployment.release !== release.release) throw new Error('Deployment metadata release identity is invalid')
  if (deployment.channel !== release.channel || deployment.status !== release.status) throw new Error('Deployment metadata channel/status differs from release status')
  if (deployment.commit !== release.buildCommit || deployment.builtAt !== release.builtAt) throw new Error('Deployment provenance differs from release status')
  if (deployment.customDomain !== `${ORIGIN}/`) throw new Error('Deployment metadata custom domain is stale')
  if (deployment.localFirst !== true || deployment.cloudChildProfiles !== false || deployment.schoolRosters !== false) throw new Error('Deployment metadata violates local-first boundaries')

  const reset = read('reset-site.html')
  if (!reset.includes('registration.unregister()') || !reset.includes("cacheName.indexOf('kirthiverse-') === 0")) throw new Error('Browser recovery does not safely clear KirthiVerse workers/caches')
  if (reset.includes('localStorage.clear') || reset.includes('localStorage.removeItem')) throw new Error('Browser recovery can erase learner local data')
  if (!reset.includes('noindex, nofollow') || !reset.includes('role="status" aria-live="polite"')) throw new Error('Browser recovery accessibility/indexing contract is incomplete')

  const offline = read('offline.html')
  if (!offline.includes('Connection unavailable') || !offline.includes('name="kvs-offline-recovery"') || !offline.includes('noindex, nofollow')) throw new Error('Offline fallback recovery contract is incomplete')
  if (/(?:src|href)=["']https?:\/\//i.test(offline)) throw new Error('Offline fallback depends on a network asset')

  for (const page of legacyPages) requireFile(page)

  const assetsDir = path.join(dist, 'assets')
  if (!fs.existsSync(assetsDir)) throw new Error('Distribution assets directory is missing')
  const jsFiles = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.js'))
  const cssFiles = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.css'))
  if (!jsFiles.length || !cssFiles.length) throw new Error('Compiled JS/CSS assets are missing')
  const largestJavaScript = Math.max(...jsFiles.map((file) => fs.statSync(path.join(assetsDir, file)).size))
  if (largestJavaScript > 550 * 1024) throw new Error(`Largest JavaScript chunk exceeds the production 550 KiB gate (${Math.ceil(largestJavaScript / 1024)} KiB)`)
  const totalSize = walk(dist).reduce((sum, file) => sum + fs.statSync(file).size, 0)
  if (totalSize > 10_000_000) throw new Error(`Production artifact exceeds 10 MB (${totalSize} bytes)`)

  console.log(`✓ Distribution contract: ${legacyPages.length} legacy bridges, ${jsFiles.length} JS chunks, ${cssFiles.length} CSS chunks`)
  console.log(`✓ Cache generation aligned: ${cacheName}`)
  console.log(`✓ Release: ${release.release} · ${release.subjects} subjects · ${release.lessons} lessons · ${release.quizQuestions} questions`)
  console.log(`✓ Largest JavaScript chunk: ${(largestJavaScript / 1024).toFixed(1)} KiB (gate 550 KiB)`)
  console.log(`✓ Total artifact: ${(totalSize / 1024).toFixed(1)} KiB`)
} catch (error) {
  console.error(`\n✗ Distribution validation failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
