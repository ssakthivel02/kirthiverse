import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const failures = []
let checks = 0

function check(condition, message) {
  checks += 1
  if (condition) console.log(`✓ ${message}`)
  else failures.push(message)
}

const index = read('index.html')
const main = read('src/main.tsx')
const serviceWorker = read('public/sw.js')
const resetPage = read('public/reset-site.html')
const release = JSON.parse(read('public/release-status.json'))
const driftWatch = read('.github/workflows/production-drift-watch.yml')
const installHandler = serviceWorker.match(/self\.addEventListener\('install',[\s\S]*?\n\}\)/)?.[0] ?? ''

check(index.includes('name="kvs-release-shell" content="KVS-PLATFORM-001"'), 'Application shell publishes an exact release identity marker')
check(index.includes('name="kvs-cache-generation"'), 'Application shell publishes a cache generation marker')
check(index.includes('href="/reset-site.html"'), 'Application fallback exposes one-click browser repair')
check(index.includes('Repair this browser'), 'Fallback explains stale-browser recovery in plain language')

check(main.includes("updateViaCache: 'none'"), 'Service-worker registration bypasses stale HTTP cache')
check(main.includes('registration.update()'), 'Application checks for a fresh worker at startup')
check(main.includes("registration.waiting?.postMessage({ type: 'SKIP_WAITING' })"), 'Application activates an already waiting worker')
check(main.includes("registration.addEventListener('updatefound'"), 'Application observes new service-worker installations')
check(main.includes("navigator.serviceWorker.addEventListener('controllerchange'"), 'Application observes service-worker takeover')
check(main.includes('SERVICE_WORKER_RELOAD_GUARD'), 'Application prevents controller-change reload loops')
check(main.includes('window.location.reload()'), 'Application reloads once after a new worker takes control')

check(serviceWorker.includes("const CACHE_NAME = 'kirthiverse-shell-v4-runtime-20260729'"), 'Service worker uses a new browser-smoke-compatible recovery cache generation')
check(serviceWorker.includes("const RELEASE_MARKER = 'name=\"kvs-release-shell\" content=\"KVS-PLATFORM-001\"'"), 'Service worker knows the exact release shell marker')
check(serviceWorker.includes("'/reset-site.html'"), 'Browser-repair page is available offline')
check(serviceWorker.includes('requiresCurrentApplicationShell'), 'Service worker distinguishes app routes from static documents')
check(serviceWorker.includes('isCurrentApplicationShell'), 'Service worker validates returned application HTML')
check(serviceWorker.includes("fetch(request, { cache: 'no-store' })"), 'Navigation and runtime fetches bypass stale browser HTTP cache')
check(serviceWorker.includes('stale or incomplete KirthiVerse application shell'), 'Stale or incomplete network shells are rejected')
check(installHandler.includes('event.waitUntil(precacheShell())'), 'Install waits for complete recovery-shell precaching')
check(!installHandler.includes('skipWaiting'), 'Install does not force unsafe immediate activation')
check(serviceWorker.includes("event.data?.type === 'SKIP_WAITING'"), 'Waiting recovery worker supports controlled activation')
check(serviceWorker.includes('self.clients.claim()'), 'Recovery worker claims open KirthiVerse pages')
check(serviceWorker.includes('notifyAllClients'), 'Recovery worker informs open pages about the new release')
check(serviceWorker.includes("key.startsWith('kirthiverse-')"), 'Recovery deletes only obsolete KirthiVerse caches')

check(resetPage.includes("navigator.serviceWorker.getRegistrations()"), 'Repair page enumerates service-worker registrations')
check(resetPage.includes('registration.unregister()'), 'Repair page unregisters stale workers')
check(resetPage.includes('caches.keys()'), 'Repair page enumerates browser caches')
check(resetPage.includes("cacheName.indexOf('kirthiverse-') === 0"), 'Repair page deletes only KirthiVerse caches')
check(!resetPage.includes('localStorage.clear'), 'Repair page does not clear learner local storage')
check(!resetPage.includes('localStorage.removeItem'), 'Repair page does not remove individual learner records')
check(resetPage.includes('learner profile, lesson progress, quiz attempts, bookmarks and family settings'), 'Repair page explains preserved learner data')
check(resetPage.includes("window.location.replace('/?kvs-recovered=' + Date.now())"), 'Repair page reopens production with a cache-busting URL')
check(resetPage.includes('role="status" aria-live="polite"'), 'Repair status is announced accessibly')
check(resetPage.includes('noindex, nofollow'), 'Repair page is excluded from indexing')

check(driftWatch.includes("cron: '17 */2 * * *'"), 'Production drift watch runs every two hours')
check(driftWatch.includes('KVS_EXPECTED_COMMIT: ${{ github.sha }}'), 'Drift watch compares production with current main')
check(driftWatch.includes('KVS_MAX_ATTEMPTS: 3'), 'Drift watch retries transient failures')
check(driftWatch.includes('production-drift-watch-${{ github.run_id }}'), 'Drift watch retains evidence')
check(driftWatch.includes('ArivuKids production drift detected'), 'Drift watch reports confirmed mismatches')
check(driftWatch.includes('before changing DNS, Workers, Pages settings or certificates'), 'Drift watch prevents unrelated infrastructure changes')

for (const gate of [
  'runtime-shell-identity',
  'stale-service-worker-recovery',
  'cache-bypass-navigation',
  'browser-repair-flow',
  'scheduled-production-drift-watch',
]) {
  check(release.qualityGates.includes(gate), `Release status publishes ${gate}`)
}

if (failures.length) {
  console.error('\nRuntime recovery validation failed:')
  failures.forEach((failure) => console.error(`✗ ${failure}`))
  process.exit(1)
}

console.log(`\n✓ Runtime recovery gate passed (${checks} controls)`)
