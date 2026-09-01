import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(root, 'artifacts', 'live-site-smoke')
const reportPath = path.join(outputDir, 'report.json')
const summaryPath = path.join(outputDir, 'summary.md')
const baseUrl = new URL(process.env.KVS_LIVE_URL || 'https://arivukids.omsaravanabhava.org/')
const expectedCommit = (process.env.KVS_EXPECTED_COMMIT || '').trim()
const maxAttempts = Number.parseInt(process.env.KVS_MAX_ATTEMPTS || '12', 10)
const retryMs = Number.parseInt(process.env.KVS_RETRY_MS || '10000', 10)
const timeoutMs = Number.parseInt(process.env.KVS_REQUEST_TIMEOUT_MS || '15000', 10)
const releaseMarker = 'name="kvs-release-shell" content="KVS-PLATFORM-001"'
const runtimeCacheName = 'kirthiverse-shell-v4-runtime-20260729'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const trimSlash = (value) => value.replace(/\/+$/, '')
const origin = trimSlash(baseUrl.origin)

function ensureDirectory() {
  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })
}

async function request(pathname, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const url = new URL(pathname, `${origin}/`)
  url.searchParams.set('__kvs_verify', `${Date.now()}-${Math.random().toString(36).slice(2)}`)

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ArivuKids-Release-Smoke/2.1',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
        ...(options.headers || {}),
      },
    })
    const text = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      contentType: response.headers.get('content-type') || '',
      cacheControl: response.headers.get('cache-control') || '',
      etag: response.headers.get('etag') || '',
      age: response.headers.get('age') || '',
      text,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function check(condition, message, failures, checks, detail = undefined) {
  checks.push({ message, passed: Boolean(condition), detail })
  if (!condition) failures.push(message)
}

function parseJson(result, label, failures, checks) {
  try {
    return JSON.parse(result.text)
  } catch {
    check(false, `${label} returned invalid JSON`, failures, checks, { status: result.status, body: result.text.slice(0, 180) })
    return null
  }
}

async function runAttempt(attempt) {
  const failures = []
  const checks = []
  const rootPage = await request('/')
  check(rootPage.status === 200, 'Homepage returns HTTP 200', failures, checks, rootPage.status)
  check(rootPage.contentType.includes('text/html'), 'Homepage returns HTML', failures, checks, rootPage.contentType)
  check(rootPage.text.includes('ArivuKids'), 'Homepage identifies ArivuKids', failures, checks)
  check(rootPage.text.includes(releaseMarker), 'Homepage exposes the exact KVS-PLATFORM-001 shell marker', failures, checks)
  check(rootPage.text.includes('name="kvs-cache-generation"'), 'Homepage exposes a cache generation marker', failures, checks)
  check(rootPage.text.includes('href="/reset-site.html"'), 'Homepage exposes browser recovery', failures, checks)
  check(rootPage.text.includes('kvs-route=%2Flearning-worlds'), 'Homepage exposes the cache-busting Learning Worlds entry', failures, checks)
  check(/\/assets\/[^"']+\.js/.test(rootPage.text), 'Homepage references compiled JavaScript', failures, checks)
  check(/\/assets\/[^"']+\.css/.test(rootPage.text), 'Homepage references compiled CSS', failures, checks)
  check(!/\/src\/|\.tsx(?:["'?#]|$)/i.test(rootPage.text), 'Homepage contains no source TypeScript references', failures, checks)
  check(rootPage.text.includes(`<link rel="canonical" href="${origin}/"`), 'Homepage canonical URL uses the custom domain', failures, checks)
  check(!/(google-analytics|googletagmanager|doubleclick|facebook\.net\/.*fbevents|hotjar|clarity\.ms)/i.test(rootPage.text), 'Homepage contains no behavioural tracking markers', failures, checks)

  const releaseResult = await request('/release-status.json')
  check(releaseResult.status === 200, 'Release status returns HTTP 200', failures, checks, releaseResult.status)
  const release = parseJson(releaseResult, 'Release status', failures, checks)
  if (release) {
    check(release.product === 'KirthiVerse', 'Release status identifies internal KirthiVerse platform', failures, checks, release.product)
    check(release.release === 'KVS-PLATFORM-001', 'Release status identifies KVS-PLATFORM-001', failures, checks, release.release)
    check(release.channel === 'production', 'Release status is stamped as production', failures, checks, release.channel)
    check(release.status === 'production-runtime-recovery-artifact', 'Release status identifies the production runtime recovery artifact', failures, checks, release.status)
    check(release.runtimeRecoveryReady === true, 'Release status declares runtime recovery readiness', failures, checks, release.runtimeRecoveryReady)
    check(release.localFirst === true, 'Production remains local-first', failures, checks, release.localFirst)
    check(release.cloudChildProfiles === false, 'Cloud child profiles remain disabled', failures, checks, release.cloudChildProfiles)
    check(release.schoolRosters === false, 'School rosters remain disabled', failures, checks, release.schoolRosters)
    check(release.remoteTeacherMonitoring === false, 'Remote teacher monitoring remains disabled', failures, checks, release.remoteTeacherMonitoring)
    check(release.subjects === 10 && release.lessons === 77 && release.quizQuestions === 77, 'Production catalogue totals are correct', failures, checks, { subjects: release.subjects, lessons: release.lessons, quizQuestions: release.quizQuestions })
    check(release.runtimeShellMarker === 'KVS-PLATFORM-001', 'Release status publishes the runtime shell marker', failures, checks, release.runtimeShellMarker)
    check(release.browserRecoveryPage === '/reset-site.html', 'Release status publishes the browser recovery path', failures, checks, release.browserRecoveryPage)
    check(release.productionDriftWatchHours === 2, 'Release status publishes the drift-watch interval', failures, checks, release.productionDriftWatchHours)
    for (const gate of ['hidden-trust-resource-deployment', 'root-security-contact-fallback', 'runtime-shell-identity', 'stale-service-worker-recovery', 'cache-bypass-navigation', 'browser-repair-flow', 'scheduled-production-drift-watch']) {
      check(release.qualityGates?.includes(gate), `Production publishes ${gate}`, failures, checks)
    }
  }

  const deploymentResult = await request('/deployment-metadata.json')
  check(deploymentResult.status === 200, 'Deployment metadata returns HTTP 200', failures, checks, deploymentResult.status)
  const deployment = parseJson(deploymentResult, 'Deployment metadata', failures, checks)
  if (deployment) {
    check(deployment.channel === 'production', 'Deployment metadata is stamped as production', failures, checks, deployment.channel)
    check(deployment.status === 'production-runtime-recovery-artifact', 'Deployment metadata identifies the runtime recovery artifact', failures, checks, deployment.status)
    check(deployment.runtimeRecoveryReady === true, 'Deployment metadata declares runtime recovery readiness', failures, checks, deployment.runtimeRecoveryReady)
    check(deployment.runtimeShellMarker === 'KVS-PLATFORM-001', 'Deployment metadata identifies the exact runtime shell', failures, checks, deployment.runtimeShellMarker)
    check(deployment.browserRecoveryPage === '/reset-site.html', 'Deployment metadata identifies the browser recovery page', failures, checks, deployment.browserRecoveryPage)
    check(typeof deployment.commit === 'string' && deployment.commit.length >= 7, 'Deployment metadata contains a commit SHA', failures, checks, deployment.commit)
    check(typeof deployment.builtAt === 'string' && !Number.isNaN(Date.parse(deployment.builtAt)), 'Deployment metadata contains a valid build timestamp', failures, checks, deployment.builtAt)
    if (expectedCommit) check(deployment.commit === expectedCommit, 'Live deployment matches the expected commit', failures, checks, { expectedCommit, actualCommit: deployment.commit })
  }

  const staticChecks = [
    ['/manifest.webmanifest', 'PWA manifest'],
    ['/sw.js', 'service worker'],
    ['/reset-site.html', 'browser recovery page'],
    ['/learning-worlds.html', 'Learning Worlds route bridge'],
    ['/robots.txt', 'robots.txt'],
    ['/sitemap.xml', 'sitemap'],
    ['/child-privacy.html', 'child-readable privacy notice'],
    ['/parent-guide.html', 'parent guide'],
    ['/security.html', 'security guidance'],
    ['/.well-known/security.txt', 'canonical security contact'],
    ['/security.txt', 'root security contact fallback'],
    ['/opensearch.xml', 'OpenSearch descriptor'],
  ]
  const staticResults = new Map()
  for (const [pathname, label] of staticChecks) {
    const result = await request(pathname)
    staticResults.set(pathname, result)
    check(result.status === 200 && result.text.length > 40, `${label} is available`, failures, checks, { status: result.status, bytes: result.text.length })
  }

  const serviceWorker = staticResults.get('/sw.js')
  check(serviceWorker?.text.includes(`const CACHE_NAME = '${runtimeCacheName}'`), 'Live service worker uses the recovery cache generation', failures, checks)
  check(serviceWorker?.text.includes('stale or incomplete KirthiVerse application shell'), 'Live service worker rejects stale internal application shells', failures, checks)
  check(serviceWorker?.text.includes("fetch(request, { cache: 'no-store' })"), 'Live service worker bypasses stale navigation cache', failures, checks)

  const resetPage = staticResults.get('/reset-site.html')
  check(resetPage?.text.includes('registration.unregister()'), 'Live browser recovery unregisters stale workers', failures, checks)
  check(resetPage?.text.includes("cacheName.indexOf('kirthiverse-') === 0"), 'Live browser recovery limits cache deletion to internal KirthiVerse caches', failures, checks)
  check(!resetPage?.text.includes('localStorage.clear'), 'Live browser recovery preserves learner local storage', failures, checks)

  const routeBridge = staticResults.get('/learning-worlds.html')
  check(routeBridge?.text.includes('name="kvs-route-bridge" content="/learning-worlds"'), 'Learning Worlds bridge declares its application destination', failures, checks)
  check(routeBridge?.text.includes('kvs-route=%2Flearning-worlds'), 'Learning Worlds bridge uses a cache-busting root entry', failures, checks)
  check(routeBridge?.text.includes('window.location.replace(destination)'), 'Learning Worlds bridge replaces the legacy document', failures, checks)

  const canonicalSecurity = staticResults.get('/.well-known/security.txt')
  const fallbackSecurity = staticResults.get('/security.txt')
  check(canonicalSecurity?.text.includes(`Canonical: ${origin}/.well-known/security.txt`), 'Canonical security contact declares its canonical location', failures, checks)
  check(canonicalSecurity?.text === fallbackSecurity?.text, 'Root and canonical security contacts match', failures, checks)

  const directRoutes = ['/index.html', '/learning-worlds', '/search?q=fractions', '/subject/mathematics', '/help']
  for (const pathname of directRoutes) {
    const result = await request(pathname)
    const appShell = result.status === 200 && result.text.includes(releaseMarker) && /\/assets\/[^"']+\.js/.test(result.text)
    const pagesRedirect = result.status === 404 && result.text.includes("sessionStorage.setItem('kvs_redirect'")
    const routeBridgeResponse = pathname === '/learning-worlds'
      && result.status === 200
      && result.text.includes('name="kvs-route-bridge" content="/learning-worlds"')
      && result.text.includes('kvs-route=%2Flearning-worlds')
    check(appShell || pagesRedirect || routeBridgeResponse, `Direct route ${pathname} resolves through the current app shell, Pages redirect or validated route bridge`, failures, checks, { status: result.status, finalUrl: result.url })
  }

  return { attempt, timestamp: new Date().toISOString(), passed: failures.length === 0, failures, checks, release, deployment, rootHeaders: { cacheControl: rootPage.cacheControl, etag: rootPage.etag, age: rootPage.age } }
}

async function run() {
  ensureDirectory()
  const attempts = []
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await runAttempt(attempt)
      attempts.push(result)
      console.log(`Live verification attempt ${attempt}/${maxAttempts}: ${result.passed ? 'PASS' : `FAIL (${result.failures.length})`}`)
      if (result.passed) {
        const report = { generatedAt: new Date().toISOString(), baseUrl: origin, expectedCommit: expectedCommit || null, passed: true, attempts }
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
        fs.writeFileSync(summaryPath, `# ArivuKids live-site verification\n\n- Result: **PASS**\n- URL: ${origin}\n- Attempts: ${attempts.length}\n- Expected commit: ${expectedCommit || 'not supplied'}\n- Verified: ArivuKids public identity, exact internal runtime shell marker, truthful production artifact metadata, compiled assets, privacy boundaries, browser recovery, stale-worker protection, Learning Worlds clean-URL bridge, canonical/root security contacts, trust resources and direct routes.\n`)
        return
      }
    } catch (error) {
      attempts.push({ attempt, timestamp: new Date().toISOString(), passed: false, failures: [error instanceof Error ? error.message : String(error)], checks: [] })
      console.error(`Live verification attempt ${attempt}/${maxAttempts} failed:`, error instanceof Error ? error.message : String(error))
    }
    if (attempt < maxAttempts) await wait(retryMs)
  }

  const last = attempts.at(-1)
  const report = { generatedAt: new Date().toISOString(), baseUrl: origin, expectedCommit: expectedCommit || null, passed: false, attempts }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  fs.writeFileSync(summaryPath, `# ArivuKids live-site verification\n\n- Result: **FAIL**\n- URL: ${origin}\n- Attempts: ${attempts.length}\n- Last failures:\n${(last?.failures || []).map((failure) => `  - ${failure}`).join('\n')}\n`)
  process.exit(1)
}

run().catch((error) => {
  ensureDirectory()
  fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), passed: false, fatal: error instanceof Error ? error.message : String(error) }, null, 2))
  console.error(error)
  process.exit(1)
})
