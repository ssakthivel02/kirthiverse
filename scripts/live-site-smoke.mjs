import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(root, 'artifacts', 'live-site-smoke')
const reportPath = path.join(outputDir, 'report.json')
const summaryPath = path.join(outputDir, 'summary.md')
const sourceRelease = JSON.parse(fs.readFileSync(path.join(root, 'public', 'release-status.json'), 'utf8'))
const sourceServiceWorker = fs.readFileSync(path.join(root, 'public', 'sw.js'), 'utf8')
const sourceCacheName = sourceServiceWorker.match(/const CACHE_NAME = '([^']+)'/)?.[1] ?? ''
const baseUrl = new URL(process.env.KVS_LIVE_URL || 'https://kirthiverse.omsaravanabhava.org/')
const expectedCommit = (process.env.KVS_EXPECTED_COMMIT || '').trim()
const maxAttempts = Number.parseInt(process.env.KVS_MAX_ATTEMPTS || '3', 10)
const retryMs = Number.parseInt(process.env.KVS_RETRY_MS || '15000', 10)
const timeoutMs = Number.parseInt(process.env.KVS_REQUEST_TIMEOUT_MS || '15000', 10)
const releaseMarker = 'name="kvs-release-shell" content="KVS-PLATFORM-001"'
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const origin = baseUrl.origin.replace(/\/+$/, '')

function ensureDirectory() {
  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })
}

async function request(pathname) {
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
        'User-Agent': 'KirthiVerse-Release-Smoke/3.0',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
      },
    })
    return {
      status: response.status,
      url: response.url,
      contentType: response.headers.get('content-type') || '',
      text: await response.text(),
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
    check(false, `${label} returned invalid JSON`, failures, checks, result.status)
    return null
  }
}

async function runAttempt(attempt) {
  const failures = []
  const checks = []
  const rootPage = await request('/')
  check(rootPage.status === 200, 'Homepage returns HTTP 200', failures, checks, rootPage.status)
  check(rootPage.contentType.includes('text/html'), 'Homepage returns HTML', failures, checks, rootPage.contentType)
  check(rootPage.text.includes('KirthiVerse'), 'Homepage identifies KirthiVerse', failures, checks)
  check(!/ArivuKids|arivukids\.omsaravanabhava\.org/i.test(rootPage.text), 'Homepage contains no legacy donor identity', failures, checks)
  check(rootPage.text.includes(releaseMarker), 'Homepage exposes the exact runtime shell marker', failures, checks)
  check(rootPage.text.includes(`name="kvs-cache-generation" content="${sourceCacheName}"`), 'Homepage cache generation matches checked-out service worker', failures, checks)
  check(rootPage.text.includes(`<link rel="canonical" href="${origin}/"`), 'Homepage canonical URL uses the production domain', failures, checks)
  check(/\/assets\/[^"']+\.js/.test(rootPage.text) && /\/assets\/[^"']+\.css/.test(rootPage.text), 'Homepage references compiled JavaScript and CSS', failures, checks)
  check(!/\/src\/|\.tsx(?:["'?#]|$)/i.test(rootPage.text), 'Homepage contains no source TypeScript references', failures, checks)

  const releaseResult = await request('/release-status.json')
  check(releaseResult.status === 200, 'Release status returns HTTP 200', failures, checks, releaseResult.status)
  const release = parseJson(releaseResult, 'Release status', failures, checks)
  if (release) {
    check(release.product === 'KirthiVerse', 'Release status identifies KirthiVerse', failures, checks, release.product)
    check(release.release === sourceRelease.release, 'Live release ID matches checked-out source release', failures, checks, { expected: sourceRelease.release, actual: release.release })
    check(release.channel === 'production', 'Live release is stamped production', failures, checks, release.channel)
    check(release.status === 'production-runtime-recovery-artifact', 'Live release has the production runtime artifact status', failures, checks, release.status)
    check(release.subjects === sourceRelease.subjects && release.lessons === sourceRelease.lessons && release.quizQuestions === sourceRelease.quizQuestions, 'Live catalogue totals match checked-out source release', failures, checks, { expected: { subjects: sourceRelease.subjects, lessons: sourceRelease.lessons, quizQuestions: sourceRelease.quizQuestions }, actual: { subjects: release.subjects, lessons: release.lessons, quizQuestions: release.quizQuestions } })
    check(release.localFirst === true, 'Production remains local-first', failures, checks)
    check(release.cloudChildProfiles === false, 'Cloud child profiles remain disabled', failures, checks)
    check(release.schoolRosters === false, 'School rosters remain disabled', failures, checks)
    check(release.remoteTeacherMonitoring === false, 'Remote teacher monitoring remains disabled', failures, checks)
  }

  const deploymentResult = await request('/deployment-metadata.json')
  check(deploymentResult.status === 200, 'Deployment metadata returns HTTP 200', failures, checks, deploymentResult.status)
  const deployment = parseJson(deploymentResult, 'Deployment metadata', failures, checks)
  if (deployment) {
    check(deployment.product === 'KirthiVerse', 'Deployment metadata identifies KirthiVerse', failures, checks, deployment.product)
    check(deployment.release === sourceRelease.release, 'Deployment metadata release matches checked-out source', failures, checks, deployment.release)
    check(deployment.customDomain === `${origin}/`, 'Deployment metadata uses the production custom domain', failures, checks, deployment.customDomain)
    check(deployment.channel === 'production', 'Deployment metadata is stamped production', failures, checks, deployment.channel)
    check(deployment.status === 'production-runtime-recovery-artifact', 'Deployment metadata has production artifact status', failures, checks, deployment.status)
    check(deployment.localFirst === true && deployment.cloudChildProfiles === false && deployment.schoolRosters === false, 'Deployment metadata preserves local-first safety boundaries', failures, checks)
    if (expectedCommit) check(deployment.commit === expectedCommit, 'Live deployment matches the expected commit', failures, checks, { expectedCommit, actualCommit: deployment.commit })
  }

  const staticPaths = ['/manifest.webmanifest', '/sw.js', '/reset-site.html', '/offline.html', '/opensearch.xml', '/.well-known/security.txt', '/security.txt']
  const staticResults = new Map()
  for (const pathname of staticPaths) {
    const result = await request(pathname)
    staticResults.set(pathname, result)
    check(result.status === 200 && result.text.length > 20, `${pathname} is available`, failures, checks, result.status)
  }

  const serviceWorker = staticResults.get('/sw.js')
  check(serviceWorker?.text.includes(`const CACHE_NAME = '${sourceCacheName}'`), 'Live service worker cache generation matches checked-out source', failures, checks)
  check(serviceWorker?.text.includes('stale or incomplete KirthiVerse application shell'), 'Live worker rejects stale application shells', failures, checks)
  check(serviceWorker?.text.includes("fetch(request, { cache: 'no-store' })"), 'Live worker bypasses stale navigation cache', failures, checks)

  const canonicalSecurity = staticResults.get('/.well-known/security.txt')
  const fallbackSecurity = staticResults.get('/security.txt')
  check(canonicalSecurity?.text.includes(`Canonical: ${origin}/.well-known/security.txt`), 'Canonical security contact points to production origin', failures, checks)
  check(canonicalSecurity?.text === fallbackSecurity?.text, 'Root and canonical security contacts match', failures, checks)

  const openSearch = staticResults.get('/opensearch.xml')
  check(openSearch?.text.includes('<ShortName>KirthiVerse</ShortName>'), 'Live OpenSearch identifies KirthiVerse', failures, checks)
  check(openSearch?.text.includes(`${origin}/search?q={searchTerms}`), 'Live OpenSearch targets the production search route', failures, checks)

  return { attempt, timestamp: new Date().toISOString(), passed: failures.length === 0, failures, checks, release, deployment }
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
        const report = { generatedAt: new Date().toISOString(), baseUrl: origin, expectedCommit: expectedCommit || null, sourceRelease: sourceRelease.release, sourceCacheName, passed: true, attempts }
        fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
        fs.writeFileSync(summaryPath, `# KirthiVerse live-site verification\n\n- Result: **PASS**\n- URL: ${origin}\n- Source release: ${sourceRelease.release}\n- Expected commit: ${expectedCommit || 'not supplied'}\n- Cache generation: ${sourceCacheName}\n- Attempts: ${attempts.length}\n`)
        return
      }
    } catch (error) {
      attempts.push({ attempt, timestamp: new Date().toISOString(), passed: false, failures: [error instanceof Error ? error.message : String(error)], checks: [] })
    }
    if (attempt < maxAttempts) await wait(retryMs)
  }

  const last = attempts.at(-1)
  fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: origin, expectedCommit: expectedCommit || null, sourceRelease: sourceRelease.release, sourceCacheName, passed: false, attempts }, null, 2)}\n`)
  fs.writeFileSync(summaryPath, `# KirthiVerse live-site verification\n\n- Result: **FAIL**\n- URL: ${origin}\n- Last failures:\n${(last?.failures || []).map((failure) => `  - ${failure}`).join('\n')}\n`)
  process.exit(1)
}

run().catch((error) => {
  ensureDirectory()
  fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), passed: false, fatal: error instanceof Error ? error.message : String(error) }, null, 2)}\n`)
  console.error(error)
  process.exit(1)
})
