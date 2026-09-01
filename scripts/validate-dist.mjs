import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { legacyPages } from './legacy-pages.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.resolve(projectRoot, 'dist')

function validateFile(filePath, description, allowEmpty = false) {
  const fullPath = path.resolve(distDir, filePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing: ${description} (${filePath})`)
  const stats = fs.statSync(fullPath)
  if (stats.size === 0 && !allowEmpty) throw new Error(`Empty: ${description} (${filePath})`)
  console.log(`✓ ${description}`)
  return stats.size
}

function compiledAssets(indexHtml) {
  return [...indexHtml.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+\.(?:js|css))["']/gi)]
    .map((match) => match[1].split(/[?#]/)[0].replace(/^\//, ''))
    .filter((value, index, values) => values.indexOf(value) === index)
}

function validateCompiledIndex() {
  const indexPath = path.resolve(distDir, 'index.html')
  const indexHtml = fs.readFileSync(indexPath, 'utf8')
  if (/\/src\/|\.tsx(?:["'?#]|$)/i.test(indexHtml)) throw new Error('index.html still references source TypeScript instead of compiled production assets')
  const assets = compiledAssets(indexHtml)
  if (!assets.some((asset) => asset.endsWith('.js')) || !assets.some((asset) => asset.endsWith('.css'))) throw new Error('index.html does not reference compiled JavaScript and CSS assets')
  for (const asset of assets) validateFile(asset, `compiled index asset ${asset}`)
  console.log(`✓ index.html references ${assets.length} compiled production assets`)
  return { indexHtml, assets }
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

try {
  console.log('Validating dist/ output...\n')
  if (!fs.existsSync(distDir)) throw new Error('dist/ directory not found')

  console.log('Required files:')
  validateFile('index.html', 'index.html')
  validateFile('CNAME', 'CNAME')
  validateFile('.nojekyll', '.nojekyll', true)
  validateFile('js/config.js', 'js/config.js')
  validateFile('js/api-client.js', 'js/api-client.js')
  validateFile('js/main.js', 'js/main.js')
  const { indexHtml, assets: indexAssets } = validateCompiledIndex()

  console.log('\nProgressive web app files:')
  validateFile('manifest.webmanifest', 'PWA manifest')
  validateFile('sw.js', 'service worker')
  validateFile('offline.html', 'offline fallback page')
  validateFile('reset-site.html', 'browser recovery page')
  validateFile('opensearch.xml', 'OpenSearch descriptor')
  validateFile('icons/kirthiverse-icon.svg', 'application icon')

  console.log('\nTrust, support and release files:')
  validateFile('parent-guide.html', 'parent and guardian guide')
  validateFile('acceptable-use.html', 'acceptable-use guidance')
  validateFile('device-storage.html', 'device-storage explanation')
  validateFile('child-privacy.html', 'child-readable privacy notice')
  validateFile('accessibility.html', 'accessibility statement')
  validateFile('data-retention.html', 'data-retention explanation')
  validateFile('grievance.html', 'support and grievance guidance')
  validateFile('.well-known/security.txt', 'canonical security contact')
  validateFile('security.txt', 'root security contact fallback')
  validateFile('robots.txt', 'robots.txt')
  validateFile('sitemap.xml', 'sitemap.xml')
  validateFile('release-status.json', 'machine-readable release status')
  validateFile('deployment-metadata.json', 'deployment metadata')

  if (!indexHtml.includes('rel="manifest"')) throw new Error('index.html does not reference the PWA manifest')
  if (!indexHtml.includes('rel="canonical" href="https://arivukids.omsaravanabhava.org/"')) throw new Error('index.html canonical URL is missing or incorrect')
  if (!indexHtml.includes('rel="search"') || !indexHtml.includes('/opensearch.xml')) throw new Error('index.html does not reference OpenSearch discovery')
  if (!indexHtml.includes('name="robots" content="index, follow')) throw new Error('index.html crawler metadata is missing')
  if (!indexHtml.includes('property="og:title"') || !indexHtml.includes('name="twitter:card"')) throw new Error('index.html social metadata is incomplete')
  if (!indexHtml.includes('type="application/ld+json"') || !indexHtml.includes('"@type": "WebApplication"')) throw new Error('index.html structured data is incomplete')
  if (!indexHtml.includes('name="kvs-release-shell" content="KVS-PLATFORM-001"')) throw new Error('index.html does not expose the exact release shell marker')
  if (!indexHtml.includes('name="kvs-cache-generation"')) throw new Error('index.html does not expose a cache generation marker')
  if (!indexHtml.includes('href="/reset-site.html"')) throw new Error('index.html does not expose browser recovery')
  if (/maximum-scale|user-scalable\s*=\s*no/i.test(indexHtml)) throw new Error('index.html blocks browser zoom')
  if (/<script[^>]+src=["']https?:\/\//i.test(indexHtml)) throw new Error('index.html loads a third-party script')
  if (!indexHtml.includes('kirthiverse-icon.svg')) throw new Error('index.html does not reference the application icon')
  if (!indexHtml.includes('id="root"')) throw new Error('index.html does not contain the React root element')

  const serviceWorker = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf8')
  const installHandler = serviceWorker.match(/self\.addEventListener\('install',[\s\S]*?\n\}\)/)?.[0] ?? ''
  if (!serviceWorker.includes("const CACHE_NAME = 'kirthiverse-shell-v4-runtime-20260729'")) throw new Error('service worker cache version is not the dated runtime recovery contract')
  if (!serviceWorker.includes("const RELEASE_MARKER = 'name=\"kvs-release-shell\" content=\"KVS-PLATFORM-001\"'")) throw new Error('service worker does not validate the release shell marker')
  if (!serviceWorker.includes("event.data?.type === 'SKIP_WAITING'")) throw new Error('service worker does not support controlled activation messages')
  if (!installHandler.includes('event.waitUntil(precacheShell())')) throw new Error('service worker install does not wait for complete shell precaching')
  if (installHandler.includes('skipWaiting')) throw new Error('service worker install forces unsafe immediate activation')
  if (!serviceWorker.includes('/parent-guide.html') || !serviceWorker.includes('/device-storage.html')) throw new Error('service worker is missing core family guidance assets')
  if (!serviceWorker.includes('/security.txt') || !serviceWorker.includes('/.well-known/security.txt')) throw new Error('service worker is missing security contact resources')
  if (!serviceWorker.includes('/reset-site.html')) throw new Error('service worker is missing the browser recovery page')
  if (!serviceWorker.includes('/offline.html')) throw new Error('service worker does not include the offline fallback')
  if (!serviceWorker.includes('/opensearch.xml')) throw new Error('service worker does not cache search discovery metadata')
  if (!serviceWorker.includes('compiledAssetUrls') || !serviceWorker.includes('/assets/')) throw new Error('service worker does not discover compiled production assets')
  if (!serviceWorker.includes('fetchAndCache') || !serviceWorker.includes("cache: 'reload'")) throw new Error('service worker does not precache the current compiled shell')
  if (!serviceWorker.includes('networkFirstNavigation') || !serviceWorker.includes('staleWhileRevalidate')) throw new Error('service worker recovery strategies are incomplete')
  if (!serviceWorker.includes("fetch(request, { cache: 'no-store' })")) throw new Error('service worker navigation does not bypass stale HTTP cache')
  if (!serviceWorker.includes('stale or incomplete KirthiVerse application shell')) throw new Error('service worker does not reject stale application shells')
  if (!serviceWorker.includes('notifyAllClients')) throw new Error('service worker does not notify open clients after takeover')
  if (!serviceWorker.includes('event.waitUntil(refresh)')) throw new Error('service worker does not keep asset refresh work alive')

  const resetHtml = fs.readFileSync(path.join(distDir, 'reset-site.html'), 'utf8')
  if (!resetHtml.includes('registration.unregister()')) throw new Error('browser recovery page does not unregister stale workers')
  if (!resetHtml.includes("cacheName.indexOf('kirthiverse-') === 0")) throw new Error('browser recovery page does not limit cache deletion to KirthiVerse')
  if (resetHtml.includes('localStorage.clear') || resetHtml.includes('localStorage.removeItem')) throw new Error('browser recovery page clears learner local storage')
  if (!resetHtml.includes("window.location.replace('/?kvs-recovered=' + Date.now())")) throw new Error('browser recovery page does not reopen production with cache busting')
  if (!resetHtml.includes('role="status" aria-live="polite"')) throw new Error('browser recovery status is not announced accessibly')
  if (!resetHtml.includes('noindex, nofollow')) throw new Error('browser recovery page must be excluded from indexing')

  const canonicalSecurity = fs.readFileSync(path.join(distDir, '.well-known/security.txt'), 'utf8')
  const fallbackSecurity = fs.readFileSync(path.join(distDir, 'security.txt'), 'utf8')
  if (canonicalSecurity !== fallbackSecurity) throw new Error('root security contact fallback differs from canonical security contact')
  if (!canonicalSecurity.includes('Canonical: https://arivukids.omsaravanabhava.org/.well-known/security.txt')) throw new Error('security contact has an invalid canonical URL')

  const offlineHtml = fs.readFileSync(path.join(distDir, 'offline.html'), 'utf8')
  if (!/<main(?:\s|>)/i.test(offlineHtml) || !offlineHtml.includes('Connection unavailable')) throw new Error('offline fallback is missing its primary recovery content')
  if (!offlineHtml.includes('name="kvs-offline-recovery"')) throw new Error('offline fallback is missing its recovery metadata marker')
  if (!/role=["']status["']/i.test(offlineHtml)) throw new Error('offline fallback is missing an announced status region')
  if (!offlineHtml.includes('noindex, nofollow')) throw new Error('offline fallback must be excluded from indexing')
  if (/(?:src|href)=["']https?:\/\//i.test(offlineHtml)) throw new Error('offline fallback must not require third-party assets')

  const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.webmanifest'), 'utf8'))
  if (manifest.name !== 'ArivuKids Learning Universe') throw new Error('PWA manifest name is incorrect')
  if (manifest.start_url !== '/' || manifest.scope !== '/') throw new Error('PWA manifest start_url/scope must target the site root')
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) throw new Error('PWA manifest has no icons')

  const openSearch = fs.readFileSync(path.join(distDir, 'opensearch.xml'), 'utf8')
  if (!openSearch.includes('<ShortName>ArivuKids</ShortName>') || !openSearch.includes('/search?q={searchTerms}')) throw new Error('OpenSearch descriptor is invalid')
  if (!openSearch.includes('https://arivukids.omsaravanabhava.org/')) throw new Error('OpenSearch descriptor does not target the production domain')

  const releaseStatus = JSON.parse(fs.readFileSync(path.join(distDir, 'release-status.json'), 'utf8'))
  const expectedArtifactStatus = releaseStatus.channel === 'production'
    ? 'production-runtime-recovery-artifact'
    : 'runtime-recovery-preview-artifact'
  if (releaseStatus.release !== 'KVS-PLATFORM-001' || releaseStatus.localFirst !== true) throw new Error('release-status.json has an invalid release or privacy boundary')
  if (releaseStatus.status !== expectedArtifactStatus) throw new Error(`release-status.json has invalid ${releaseStatus.channel} artifact status`)
  if (releaseStatus.runtimeRecoveryReady !== true) throw new Error('release-status.json does not declare runtime recovery readiness')
  if (releaseStatus.cloudChildProfiles !== false || releaseStatus.schoolRosters !== false) throw new Error('release-status.json enables unsupported cloud identity or school functionality')
  if (releaseStatus.rootDomainDeploymentContract !== true) throw new Error('release-status.json does not declare the root-domain deployment contract')
  if (releaseStatus.runtimeShellMarker !== 'KVS-PLATFORM-001') throw new Error('release-status.json has an invalid runtime shell marker')
  if (releaseStatus.browserRecoveryPage !== '/reset-site.html') throw new Error('release-status.json has an invalid browser recovery path')
  if (releaseStatus.productionDriftWatchHours !== 2) throw new Error('release-status.json has an invalid drift-watch interval')
  if (!['preview', 'production'].includes(releaseStatus.channel)) throw new Error('release-status.json has an unsupported channel')
  if (typeof releaseStatus.buildCommit !== 'string' || releaseStatus.buildCommit.length < 7) throw new Error('release-status.json is missing a build commit')
  if (Number.isNaN(Date.parse(releaseStatus.builtAt))) throw new Error('release-status.json has an invalid build timestamp')
  for (const gate of ['metadata-and-discoverability-contract', 'tracking-free-public-shell', 'deployment-metadata-integrity', 'hidden-trust-resource-deployment', 'root-security-contact-fallback', 'runtime-shell-identity', 'stale-service-worker-recovery', 'cache-bypass-navigation', 'browser-repair-flow', 'scheduled-production-drift-watch']) {
    if (!releaseStatus.qualityGates?.includes(gate)) throw new Error(`release-status.json does not publish ${gate}`)
  }
  if (releaseStatus.remainingGates?.length !== 1 || releaseStatus.remainingGates[0] !== 'assistive-technology-review') throw new Error('release-status.json does not accurately record the sole remaining manual gate')

  const deployment = JSON.parse(fs.readFileSync(path.join(distDir, 'deployment-metadata.json'), 'utf8'))
  if (deployment.product !== 'KirthiVerse' || deployment.release !== 'KVS-PLATFORM-001') throw new Error('deployment-metadata.json has an invalid product or release')
  if (deployment.channel !== releaseStatus.channel) throw new Error('deployment metadata channel does not match release status')
  if (deployment.status !== releaseStatus.status) throw new Error('deployment metadata status does not match release status')
  if (deployment.runtimeRecoveryReady !== true) throw new Error('deployment metadata does not declare runtime recovery readiness')
  if (deployment.runtimeShellMarker !== 'KVS-PLATFORM-001') throw new Error('deployment metadata has an invalid runtime shell marker')
  if (deployment.browserRecoveryPage !== '/reset-site.html') throw new Error('deployment metadata has an invalid browser recovery path')
  if (deployment.commit !== releaseStatus.buildCommit) throw new Error('deployment metadata commit does not match release status')
  if (deployment.builtAt !== releaseStatus.builtAt || Number.isNaN(Date.parse(deployment.builtAt))) throw new Error('deployment metadata timestamp is invalid')
  if (deployment.customDomain !== 'https://arivukids.omsaravanabhava.org/') throw new Error('deployment metadata custom domain is incorrect')
  if (deployment.localFirst !== true || deployment.cloudChildProfiles !== false || deployment.schoolRosters !== false) throw new Error('deployment metadata violates local-first safety boundaries')

  console.log(`\nLegacy pages (${legacyPages.length} expected):`)
  let legacyCount = 0
  const missingPages = []
  for (const page of legacyPages) {
    const fullPath = path.resolve(distDir, page)
    if (fs.existsSync(fullPath)) { console.log(`✓ ${page}`); legacyCount++ } else missingPages.push(page)
  }
  if (missingPages.length > 0) throw new Error(`Missing legacy pages: ${missingPages.join(', ')}`)
  console.log(`\n✓ Legacy pages: ${legacyCount}/${legacyPages.length}`)

  console.log('\nReact bundles:')
  const assetsDir = path.resolve(distDir, 'assets')
  if (!fs.existsSync(assetsDir)) throw new Error('assets/ directory not found')
  const jsFiles = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.js'))
  const cssFiles = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.css'))
  if (jsFiles.length === 0) throw new Error('No compiled JavaScript found')
  if (cssFiles.length === 0) throw new Error('No compiled CSS found')
  if (indexAssets.length !== jsFiles.length + cssFiles.length) console.log(`ℹ Compiled directory contains ${jsFiles.length + cssFiles.length} bundles; index loads ${indexAssets.length}.`)
  console.log(`✓ JavaScript bundles: ${jsFiles.length}`)
  console.log(`✓ CSS bundles: ${cssFiles.length}`)

  const files = walk(distDir)
  const totalSize = files.reduce((sum, file) => sum + fs.statSync(file).size, 0)
  const largestJavaScript = Math.max(...jsFiles.map((file) => fs.statSync(path.join(assetsDir, file)).size))
  if (largestJavaScript > 1_500_000) throw new Error(`Largest JavaScript bundle exceeds 1.5 MB (${largestJavaScript} bytes)`)
  if (totalSize > 10_000_000) throw new Error(`Production artifact exceeds 10 MB (${totalSize} bytes)`)
  console.log(`✓ Largest JavaScript bundle: ${Math.ceil(largestJavaScript / 1024)} KB`)
  console.log(`✓ Total artifact size: ${Math.ceil(totalSize / 1024)} KB`)

  console.log('\n✓ All validations passed')
  process.exit(0)
} catch (error) {
  console.error('\n✗ Validation failed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}