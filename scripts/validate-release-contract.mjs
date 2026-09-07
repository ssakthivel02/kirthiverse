import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))
const parse = (relativePath) => JSON.parse(read(relativePath))
const failures = []
let checks = 0

function check(condition, message) {
  checks += 1
  if (condition) console.log(`✓ ${message}`)
  else failures.push(message)
}

const ORIGIN = 'https://kirthiverse.omsaravanabhava.org'
const DOMAIN = 'kirthiverse.omsaravanabhava.org'
const index = read('index.html')
const serviceWorker = read('public/sw.js')
const manifest = parse('public/manifest.webmanifest')
const openSearch = read('public/opensearch.xml')
const security = read('public/.well-known/security.txt')
const securityFallback = read('public/security.txt')
const release = parse('public/release-status.json')
const copyScript = read('scripts/copy-static-production-files.mjs')
const liveSmoke = read('scripts/live-site-smoke.mjs')
const searchPage = read('src/pages/Search.tsx')
const packageJson = parse('package.json')
const deploy = read('.github/workflows/deploy-pages.yml')
const seedWorkflow = read('.github/workflows/validate-kvs-production-seed.yml')
const driftWatch = read('.github/workflows/production-drift-watch.yml')
const cname = read('CNAME').trim()

const cacheName = serviceWorker.match(/const CACHE_NAME = '([^']+)'/)?.[1] ?? ''
const shellCacheName = index.match(/name="kvs-cache-generation" content="([^"]+)"/)?.[1] ?? ''

check(index.includes('name="application-name" content="KirthiVerse"'), 'Application shell identifies KirthiVerse')
check(index.includes(`rel="canonical" href="${ORIGIN}/"`), 'Canonical URL uses the KirthiVerse production origin')
check(index.includes(`property="og:url" content="${ORIGIN}/"`), 'Open Graph URL uses the KirthiVerse production origin')
check(!/ArivuKids|arivukids\.omsaravanabhava\.org/i.test(index), 'Application shell contains no legacy donor identity')
check(cacheName.startsWith('kirthiverse-shell-'), 'Service worker publishes a KirthiVerse cache generation')
check(shellCacheName === cacheName, 'Application shell cache generation exactly matches the active service worker')
check(serviceWorker.includes("const RELEASE_MARKER = 'name=\"kvs-release-shell\" content=\"KVS-PLATFORM-001\"'"), 'Service worker validates the runtime shell marker')
check(serviceWorker.includes("fetch(request, { cache: 'no-store' })"), 'Service worker bypasses stale HTTP cache for navigation')
check(serviceWorker.includes('stale or incomplete KirthiVerse application shell'), 'Service worker rejects stale application shells')
check(serviceWorker.includes("event.data?.type === 'SKIP_WAITING'"), 'Service worker supports controlled activation')
check(serviceWorker.includes("keys.filter((key) => key.startsWith('kirthiverse-')"), 'Service worker deletes only obsolete KirthiVerse caches')

check(manifest.name === 'KirthiVerse Learning Universe', 'PWA manifest has the current product name')
check(manifest.short_name === 'KirthiVerse', 'PWA short name is KirthiVerse')
check(manifest.start_url === '/' && manifest.scope === '/', 'PWA manifest targets the root custom domain')
check(Array.isArray(manifest.icons) && manifest.icons.some((icon) => icon.src === '/icons/kirthiverse-icon.svg'), 'PWA manifest includes the KirthiVerse application icon')
check(openSearch.includes('<ShortName>KirthiVerse</ShortName>'), 'OpenSearch identifies KirthiVerse')
check(openSearch.includes(`${ORIGIN}/search?q={searchTerms}`), 'OpenSearch targets the KirthiVerse production search route')
check(!/ArivuKids|arivukids\.omsaravanabhava\.org/i.test(openSearch), 'OpenSearch contains no legacy donor identity')
check(security === securityFallback, 'Root and canonical security contacts match')
check(security.includes(`Canonical: ${ORIGIN}/.well-known/security.txt`), 'Security contact declares the current canonical location')
check(cname === DOMAIN, 'CNAME matches the KirthiVerse production domain')

check(release.product === 'KirthiVerse', 'Release status identifies KirthiVerse')
check(typeof release.release === 'string' && release.release.startsWith('KVS-PLATFORM-001'), 'Release status uses the current KVS platform release family')
check(release.runtimeShellMarker === 'KVS-PLATFORM-001', 'Release status publishes the exact runtime shell marker')
check(release.runtimeRecoveryReady === true, 'Release status declares runtime recovery readiness')
check(release.localFirst === true, 'Release status remains local-first')
check(release.cloudChildProfiles === false, 'Cloud child profiles remain disabled')
check(release.schoolRosters === false, 'School rosters remain disabled')
check(release.remoteTeacherMonitoring === false, 'Remote teacher monitoring remains disabled')
check(release.quizCoveragePercent === 100, 'Release status publishes complete quiz coverage')
check(Number.isInteger(release.lessons) && release.lessons > 0, 'Release status publishes a valid lesson total')
check(Number.isInteger(release.quizQuestions) && release.quizQuestions >= release.lessons, 'Release status publishes a valid question total')
check(release.productionDriftWatchHours === 2, 'Release status publishes the two-hour drift-watch interval')
for (const gate of ['runtime-shell-identity', 'stale-service-worker-recovery', 'cache-bypass-navigation', 'browser-repair-flow', 'scheduled-production-drift-watch', 'root-security-contact-fallback']) {
  check(release.qualityGates?.includes(gate), `Release status publishes ${gate}`)
}
check(release.remainingGates?.includes('assistive-technology-review'), 'Physical assistive-technology review remains explicit')
check(release.remainingGates?.includes('controlled-reconciliation-for-unpromoted-staging-content'), 'Unpromoted staging reconciliation remains explicit')

check(searchPage.includes('{lessons.length} lessons') && searchPage.includes('{quizzes.length} quiz questions'), 'Learner search derives catalogue totals from current curriculum arrays')
check(!searchPage.includes('77 lessons and 77 quiz questions'), 'Learner search contains no obsolete fixed catalogue total')

check(copyScript.includes(`customDomain: '${ORIGIN}/'`), 'Deployment metadata stamps the current custom domain')
check(copyScript.includes("'production-runtime-recovery-artifact'"), 'Production builds receive an explicit production artifact status')
check(copyScript.includes("'runtime-recovery-preview-artifact'"), 'Preview builds receive an explicit preview artifact status')

check(exists('.github/workflows/production-drift-watch.yml'), 'Scheduled production drift workflow exists')
check(driftWatch.includes("cron: '17 */2 * * *'"), 'Production drift watch runs every two hours')
check(driftWatch.includes(`KVS_LIVE_URL: ${ORIGIN}/`), 'Production drift watch targets the KirthiVerse domain')
check(driftWatch.includes('KVS_EXPECTED_COMMIT: ${{ github.sha }}'), 'Production drift watch compares against current main')
check(driftWatch.includes('KVS_MAX_ATTEMPTS: 3'), 'Production drift watch bounds propagation retries')
check(driftWatch.includes('node scripts/live-site-smoke.mjs'), 'Production drift watch executes the live smoke verifier')
check(driftWatch.includes('production-drift-watch-${{ github.run_id }}'), 'Production drift watch retains evidence')

check(liveSmoke.includes(`'${ORIGIN}/'`), 'Live smoke defaults to the current KirthiVerse production domain')
check(liveSmoke.includes('sourceRelease'), 'Live smoke derives expected release data from the checked-out source contract')
check(liveSmoke.includes('sourceCacheName'), 'Live smoke derives expected cache generation from the checked-out service worker')
check(liveSmoke.includes('deployment.commit === expectedCommit'), 'Live smoke can enforce exact deployed commit parity')
check(!/ArivuKids|arivukids\.omsaravanabhava\.org/i.test(liveSmoke), 'Live smoke contains no legacy donor identity')

check(deploy.includes('KVS_RELEASE_CHANNEL: production'), 'Pages workflow stamps production release channel')
check(deploy.includes('pnpm run build'), 'Pages workflow builds the production application')
check(deploy.includes('actions/upload-pages-artifact@v3'), 'Pages workflow uses the supported Pages artifact action')
check(deploy.includes('actions/deploy-pages@v4'), 'Pages workflow deploys through GitHub Pages')
check(seedWorkflow.includes('pnpm run check'), 'PR production-seed workflow executes the aggregate release contract')

check(packageJson.scripts?.['validate:contract'] === 'node scripts/validate-release-contract.mjs', 'Package exposes the authoritative release contract validator')
check(packageJson.scripts?.check?.includes('validate:contract'), 'Aggregate check executes the authoritative release contract')
check(packageJson.scripts?.check?.includes('validate:dist'), 'Aggregate check validates generated distribution output')

if (failures.length) {
  console.error('\nRelease contract validation failed:')
  failures.forEach((failure) => console.error(`✗ ${failure}`))
  process.exit(1)
}

console.log(`\n✓ Authoritative KirthiVerse release contract passed (${checks} controls)`)