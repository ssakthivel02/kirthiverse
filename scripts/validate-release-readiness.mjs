import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const failures = []
const pass = (message) => console.log(`✓ ${message}`)
const check = (condition, message) => condition ? pass(message) : failures.push(message)

const packageJson = JSON.parse(read('package.json'))
const status = JSON.parse(read('public/release-status.json'))
const app = read('src/app/App.tsx')
const robots = read('public/robots.txt')
const sitemap = read('public/sitemap.xml')
const workflow = read('.github/workflows/deploy-frontend.yml')
const driftWatch = read('.github/workflows/production-drift-watch.yml')
const browserSmoke = read('scripts/browser-smoke.mjs')
const serviceWorker = read('public/sw.js')
const resetPage = read('public/reset-site.html')
const contentValidator = read('scripts/validate-content.mjs')
const pwaValidator = read('scripts/validate-pwa-contract.mjs')
const webValidator = read('scripts/validate-web-quality.mjs')
const operationsValidator = read('scripts/validate-release-operations.mjs')
const runtimeValidator = read('scripts/validate-runtime-recovery.mjs')
const copyScript = read('scripts/copy-static-production-files.mjs')

check(status.product === 'KirthiVerse', 'Release status identifies KirthiVerse')
check(status.release === 'KVS-PLATFORM-001', 'Release status identifies KVS-PLATFORM-001')
check(status.status === 'runtime-recovery-source-candidate', 'Release source identifies the runtime recovery candidate')
check(status.runtimeRecoveryReady === true, 'Release source declares runtime recovery readiness')
check(status.localFirst === true, 'Release status preserves local-first boundary')
check(status.cloudChildProfiles === false, 'Cloud child profiles remain disabled')
check(status.schoolRosters === false, 'School rosters remain disabled')
check(status.remoteTeacherMonitoring === false, 'Remote teacher monitoring remains disabled')
check(status.subjects === 10 && status.lessons === 77 && status.quizQuestions === 77, 'Published catalogue totals match the validated release baseline')
check(status.quizCoveragePercent === 100, 'Every published lesson has quiz coverage')
check(status.browserRouteChecks === 116, 'Release status records the 116 route/viewport checks')
check(status.automatedLearnerRecoveryJourney === true, 'Release status records the automated learner recovery journey')
check(status.automatedOfflineRecovery === true, 'Release status records automated offline recovery')
check(status.rootDomainDeploymentContract === true, 'Release status records the root-domain deployment contract')
check(status.runtimeShellMarker === 'KVS-PLATFORM-001', 'Release status records the exact runtime shell marker')
check(status.browserRecoveryPage === '/reset-site.html', 'Release status records the browser recovery page')
check(status.productionDriftWatchHours === 2, 'Release status records the two-hour drift-watch interval')
check(Array.isArray(status.qualityGates) && status.qualityGates.length >= 33, 'Release status lists the expanded automated quality gates')
for (const gate of [
  'complete-lesson-quiz-coverage',
  'form-label-and-aria-reference-smoke',
  'learner-mistake-recovery-parent-journey',
  'xp-anti-farming-regression',
  'compiled-shell-offline-recovery',
  'offline-trust-resource-recovery',
  'pwa-root-deployment-contract',
  'service-worker-cache-safety',
  'metadata-and-discoverability-contract',
  'tracking-free-public-shell',
  'search-query-deep-link-contract',
  'crawler-indexing-boundary',
  'deployment-metadata-integrity',
  'live-custom-domain-smoke-configured',
  'rollback-runbook-validated',
  'runtime-shell-identity',
  'stale-service-worker-recovery',
  'cache-bypass-navigation',
  'browser-repair-flow',
  'scheduled-production-drift-watch',
  'screen-reader-evidence-template',
]) check(status.qualityGates.includes(gate), `Release status records quality gate: ${gate}`)
check(Array.isArray(status.remainingGates) && status.remainingGates.length === 1, 'Release status lists only the remaining manual accessibility gate')
check(status.remainingGates[0] === 'assistive-technology-review', 'Release status retains the physical assistive-technology review')
check(!status.remainingGates.includes('controlled-production-deployment'), 'Completed production deployment is no longer marked pending')
check(!status.remainingGates.includes('live-post-deployment-verification'), 'Completed live verification is no longer marked pending')
check(!status.remainingGates.includes('rollback-readiness-verification'), 'Completed rollback-readiness verification is no longer marked pending')

const requiredScripts = ['validate:content', 'validate:experience', 'validate:trust', 'validate:data', 'validate:a11y', 'validate:web', 'validate:release', 'validate:pwa', 'validate:ops', 'validate:entry', 'validate:runtime', 'validate:dist', 'test:browser', 'test:live']
for (const script of requiredScripts) check(Boolean(packageJson.scripts?.[script]), `Package script registered: ${script}`)

const requiredRoutes = ['/today', '/practice', '/bookmarks', '/progress-report', '/weekly-review', '/family-goals', '/wellbeing', '/help', '/platform-health', '/teacher-resources']
for (const route of requiredRoutes) check(app.includes(`path="${route}"`), `Application route registered: ${route}`)

const personalisedRoutes = ['/today', '/practice', '/mistake-review', '/study-planner', '/activity', '/learning-notes', '/bookmarks', '/progress-report', '/weekly-review', '/family-goals', '/wellbeing', '/platform-health', '/dashboard', '/parent-dashboard', '/teacher-dashboard', '/profile', '/settings', '/onboarding', '/achievements', '/leaderboards']
for (const route of personalisedRoutes) check(robots.includes(`Disallow: ${route}`), `Personalised route excluded from indexing: ${route}`)

for (const publicPath of ['/teacher-resources', '/help', '/child-privacy.html', '/accessibility.html', '/data-retention.html', '/grievance.html']) {
  check(sitemap.includes(publicPath), `Public trust/support resource discoverable: ${publicPath}`)
}

const requiredPublicFiles = [
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/offline.html',
  'public/reset-site.html',
  'public/opensearch.xml',
  'public/.well-known/security.txt',
  'public/security.txt',
  'public/child-privacy.html',
  'public/accessibility.html',
  'public/data-retention.html',
  'public/grievance.html',
  'public/release-status.json',
]
for (const file of requiredPublicFiles) check(exists(file), `Required release file exists: ${file}`)

for (const file of ['src/content/supplementalQuizzes.ts', 'src/content/registerSupplementalQuizzes.ts']) {
  check(exists(file), `Required quiz-coverage source exists: ${file}`)
}

for (const file of ['scripts/live-site-smoke.mjs', 'scripts/validate-release-operations.mjs', 'scripts/validate-runtime-recovery.mjs', '.github/workflows/production-drift-watch.yml', 'docs/KVS_PLATFORM_001_RELEASE_OPERATIONS_RUNBOOK.md', 'docs/KVS_SCREEN_READER_REVIEW_CHECKLIST.md', 'docs/KVS_ROLLBACK_RUNBOOK.md']) {
  check(exists(file), `Required release-operations file exists: ${file}`)
}

check(contentValidator.includes('lessonsWithoutQuiz.length === 0'), 'Content validation blocks any published lesson without a quiz')
check(contentValidator.includes('artifacts') && contentValidator.includes('content-coverage'), 'Content validation publishes coverage evidence')
check(exists('scripts/browser-smoke.mjs'), 'Dependency-free browser quality suite exists')
check(exists('scripts/validate-pwa-contract.mjs'), 'PWA deployment-contract validator exists')
check(exists('scripts/validate-web-quality.mjs'), 'Web metadata and discoverability validator exists')
check(pwaValidator.includes('pwa-root-deployment-contract') && pwaValidator.includes('service-worker-cache-safety'), 'PWA validator enforces published release gates')
check(pwaValidator.includes('runtime-shell-identity') && pwaValidator.includes('stale-service-worker-recovery'), 'PWA validator enforces runtime shell and stale-worker recovery')
check(pwaValidator.includes("manifest.start_url === '/'") && pwaValidator.includes("manifest.scope === '/'"), 'PWA validator enforces the custom-domain root contract')
check(pwaValidator.includes("request.method !== 'GET'") && pwaValidator.includes("url.pathname.startsWith('/api/')"), 'PWA validator enforces cache-safety exclusions')
check(webValidator.includes('metadata-and-discoverability-contract') && webValidator.includes('tracking-free-public-shell'), 'Web validator enforces published metadata and privacy gates')
check(webValidator.includes('new URLSearchParams') && webValidator.includes('OpenSearch'), 'Web validator enforces local search deep links and discovery')
check(webValidator.includes('maximum-scale') && webValidator.includes('user-scalable'), 'Web validator blocks viewport zoom restrictions')
check(operationsValidator.includes('deployment-metadata-integrity') && operationsValidator.includes('rollback-runbook-validated'), 'Operations validator enforces deployment and rollback controls')
check(operationsValidator.includes('scheduled-production-drift-watch'), 'Operations validator enforces scheduled production drift monitoring')
check(runtimeValidator.includes('stale-service-worker-recovery') && runtimeValidator.includes('browser-repair-flow'), 'Runtime validator enforces stale-worker and browser-repair controls')
check(copyScript.includes("'production-runtime-recovery-artifact'"), 'Production build stamps a truthful runtime recovery artifact status')
check(copyScript.includes("'runtime-recovery-preview-artifact'"), 'Preview build stamps a truthful runtime recovery artifact status')
check(copyScript.includes('runtimeRecoveryReady'), 'Deployment metadata preserves runtime recovery readiness')
check(resetPage.includes('registration.unregister()') && resetPage.includes("cacheName.indexOf('kirthiverse-') === 0"), 'Browser repair removes only KirthiVerse workers and caches')
check(!resetPage.includes('localStorage.clear') && !resetPage.includes('localStorage.removeItem'), 'Browser repair preserves learner data')
check(driftWatch.includes("cron: '17 */2 * * *'"), 'Production drift watch runs every two hours')
check(driftWatch.includes('KVS_EXPECTED_COMMIT: ${{ github.sha }}'), 'Production drift watch checks current main')
check(browserSmoke.includes("'/lesson/math-001'") && browserSmoke.includes("'/quiz/math-001'"), 'Browser suite includes real lesson and quiz routes')
check(browserSmoke.includes("'/parent-dashboard'"), 'Browser suite includes Parent View')
check(browserSmoke.includes("'/teacher-dashboard'"), 'Browser suite includes Teacher Workspace')
check(browserSmoke.includes('mobile-320') && browserSmoke.includes('desktop-1440'), 'Browser suite covers mobile through desktop viewports')
check(browserSmoke.includes('horizontalOverflow'), 'Browser suite checks responsive overflow')
check(browserSmoke.includes('unnamedButtons') && browserSmoke.includes('unnamedLinks'), 'Browser suite checks accessible control names')
check(browserSmoke.includes('unlabelledControls') && browserSmoke.includes('invalidAriaReferences'), 'Browser suite checks labels and ARIA references')
check(browserSmoke.includes('imagesWithoutAlt') && browserSmoke.includes('positiveTabIndex'), 'Browser suite checks image alternatives and focus order')
check(browserSmoke.includes('Input.dispatchKeyEvent'), 'Browser suite performs keyboard focus traversal')
check(browserSmoke.includes('Page.captureScreenshot'), 'Browser suite captures visual-review evidence')
check(browserSmoke.includes('runLearnerRecoveryJourney'), 'Browser suite executes the learner mistake-recovery journey')
check(browserSmoke.includes('xp-anti-farming') || browserSmoke.includes('retry farming'), 'Browser suite verifies quiz reward anti-farming')
check(browserSmoke.includes('runOfflineJourney'), 'Browser suite executes offline recovery')
check(browserSmoke.includes('Network.emulateNetworkConditions'), 'Browser suite emulates a real offline network state')
check(browserSmoke.includes('kirthiverse-shell-v4'), 'Browser suite validates the current compatible service-worker cache prefix')
check(serviceWorker.includes('compiledAssetUrls') && serviceWorker.includes('fetchAndCache'), 'Service worker precaches compiled application assets')
check(serviceWorker.includes('/offline.html') && serviceWorker.includes('networkFirstNavigation'), 'Service worker provides explicit offline navigation recovery')
check(serviceWorker.includes('/reset-site.html') && serviceWorker.includes('stale or incomplete KirthiVerse application shell'), 'Service worker provides browser and stale-shell recovery')
check(serviceWorker.includes('/opensearch.xml'), 'Service worker makes local search discovery available offline')
check(workflow.includes('browser-actions/setup-chrome@v2'), 'GitHub Actions provisions Chrome for browser QA')
check(workflow.includes('pnpm run test:browser'), 'GitHub Actions executes the browser quality gate')
check(workflow.includes('browser-smoke-${{ github.run_id }}'), 'GitHub Actions preserves browser QA evidence')
check(workflow.includes('artifacts/content-coverage'), 'GitHub Actions preserves content-coverage evidence')
check(workflow.includes('pnpm run validate:web'), 'GitHub Actions executes the web-quality gate')
check(workflow.includes('web-quality.log'), 'GitHub Actions preserves web-quality diagnostics')
check(workflow.includes('pnpm run validate:release'), 'GitHub Actions executes the release-readiness gate')
check(workflow.includes('release-readiness.log'), 'GitHub Actions preserves release-readiness diagnostics')
check(workflow.includes('pnpm run validate:pwa'), 'GitHub Actions executes the PWA deployment-contract gate')
check(workflow.includes('pwa-contract.log'), 'GitHub Actions preserves PWA deployment-contract diagnostics')
check(workflow.includes('pnpm run validate:ops'), 'GitHub Actions executes release operations validation')
check(workflow.includes('pnpm run validate:runtime'), 'GitHub Actions executes runtime recovery validation')
check(workflow.includes('runtime-recovery.log'), 'GitHub Actions preserves runtime recovery diagnostics')
check(workflow.includes('pnpm run test:live'), 'GitHub Actions executes live custom-domain verification after deployment')
check(workflow.includes('needs: deploy'), 'Live verification waits for production deployment')
check(!/production-ready|fully compliant|all-country compliant/i.test([read('index.html'), app].join('\n')), 'Public application shell avoids unsupported production/compliance claims')

if (failures.length) {
  console.error('\nRelease-readiness validation failed:')
  failures.forEach((failure) => console.error(`✗ ${failure}`))
  process.exit(1)
}

console.log(`\n✓ Release-readiness gate passed (${requiredRoutes.length} premium routes, ${personalisedRoutes.length} protected routes, ${requiredPublicFiles.length} required public files, complete quiz coverage, truthful artifact stamping, runtime recovery, drift monitoring, metadata/search controls, learner recovery, offline QA and controlled release operations enabled)`)
