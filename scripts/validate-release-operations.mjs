import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))
const failures = []
let checks = 0

function check(condition, message) {
  checks += 1
  if (condition) console.log(`✓ ${message}`)
  else failures.push(message)
}

const packageJson = JSON.parse(read('package.json'))
const release = JSON.parse(read('public/release-status.json'))
const workflow = read('.github/workflows/deploy-frontend.yml')
const driftWatch = read('.github/workflows/production-drift-watch.yml')
const copyScript = read('scripts/copy-static-production-files.mjs')
const liveSmoke = read('scripts/live-site-smoke.mjs')
const runtimeRecovery = read('scripts/validate-runtime-recovery.mjs')
const releaseRunbook = read('docs/KVS_PLATFORM_001_RELEASE_OPERATIONS_RUNBOOK.md')
const screenReader = read('docs/KVS_SCREEN_READER_REVIEW_CHECKLIST.md')
const rollback = read('docs/KVS_ROLLBACK_RUNBOOK.md')
const canonicalSecurity = read('public/.well-known/security.txt')
const fallbackSecurity = read('public/security.txt')

check(exists('scripts/live-site-smoke.mjs'), 'Live custom-domain smoke script exists')
check(exists('scripts/validate-runtime-recovery.mjs'), 'Runtime recovery validator exists')
check(exists('.github/workflows/production-drift-watch.yml'), 'Scheduled production drift workflow exists')
check(exists('docs/KVS_PLATFORM_001_RELEASE_OPERATIONS_RUNBOOK.md'), 'Release operations runbook exists')
check(exists('docs/KVS_SCREEN_READER_REVIEW_CHECKLIST.md'), 'Screen-reader review checklist exists')
check(exists('docs/KVS_ROLLBACK_RUNBOOK.md'), 'Rollback runbook exists')
check(exists('public/.well-known/security.txt'), 'Canonical security contact exists')
check(exists('public/security.txt'), 'Root security contact fallback exists')
check(canonicalSecurity === fallbackSecurity, 'Root security contact fallback matches canonical content')
check(Boolean(packageJson.scripts?.['validate:ops']), 'validate:ops package script is registered')
check(Boolean(packageJson.scripts?.['validate:runtime']), 'validate:runtime package script is registered')
check(Boolean(packageJson.scripts?.['test:live']), 'test:live package script is registered')
check(packageJson.scripts?.check?.includes('validate:ops'), 'Aggregate check includes release operations validation')
check(packageJson.scripts?.check?.includes('validate:runtime'), 'Aggregate check includes runtime recovery validation')
check(workflow.includes("if: github.event_name != 'pull_request'"), 'Deployment remains disabled for pull requests')
check(workflow.includes('needs: build'), 'Deployment waits for the complete build gate')
check(workflow.includes('needs: deploy'), 'Live verification waits for deployment')
check(workflow.includes('KVS_RELEASE_CHANNEL: production'), 'Main deployment stamps the production channel')
check(workflow.includes('KVS_EXPECTED_COMMIT: ${{ github.sha }}'), 'Live verification compares the deployed commit')
check(workflow.includes('pnpm run test:live'), 'Workflow executes live custom-domain verification')
check(workflow.includes('pnpm run validate:runtime'), 'Workflow executes runtime recovery validation')
check(workflow.includes('runtime-recovery.log'), 'Workflow retains runtime recovery diagnostics')
check(workflow.includes('live-site-smoke-${{ github.run_id }}'), 'Workflow preserves live verification evidence')
check(workflow.includes('release-operations.log'), 'Workflow preserves release operations diagnostics')
check(workflow.includes('Package GitHub Pages artifact with hidden trust resources'), 'Workflow has a dedicated Pages packaging step')
check(workflow.includes('tar --dereference --hard-dereference'), 'Workflow builds a Pages-compatible tar archive')
check(workflow.includes("test -f dist/.well-known/security.txt"), 'Workflow requires the canonical security contact before packaging')
check(workflow.includes("test -f dist/.nojekyll"), 'Workflow requires .nojekyll before packaging')
check(workflow.includes("cmp --silent dist/.well-known/security.txt dist/security.txt"), 'Workflow compares canonical and fallback security contacts')
check(workflow.includes("grep -Fx './.well-known/security.txt'"), 'Workflow inspects the tar for the canonical security contact')
check(workflow.includes("grep -Fx './.nojekyll'"), 'Workflow inspects the tar for .nojekyll')
check(workflow.includes('name: github-pages') && workflow.includes('path: ${{ runner.temp }}/artifact.tar'), 'Workflow uploads the expected Pages artifact name and tar')
check(workflow.includes('compression-level: 0'), 'Workflow avoids redundant artifact compression')
check(!workflow.includes('uses: actions/upload-pages-artifact@v4'), 'Workflow bypasses the composite action that omitted hidden paths')
check(copyScript.includes('deployment-metadata.json'), 'Build creates deployment metadata')
check(copyScript.includes('KVS_RELEASE_CHANNEL'), 'Build channel is supplied explicitly')
check(copyScript.includes('KVS_BUILD_COMMIT'), 'Build records the source commit')
check(copyScript.includes("['preview', 'production']"), 'Build rejects unsupported release channels')
check(liveSmoke.includes('https://arivukids.omsaravanabhava.org/'), 'Live smoke targets the ArivuKids production custom domain')
check(liveSmoke.includes("release.channel === 'production'"), 'Live smoke requires a production release stamp')
check(liveSmoke.includes('deployment.commit === expectedCommit'), 'Live smoke verifies the expected commit')
check(liveSmoke.includes('kvs-release-shell'), 'Live smoke verifies the exact application shell marker')
check(liveSmoke.includes('reset-site.html'), 'Live smoke verifies browser recovery availability')
check(liveSmoke.includes('cloudChildProfiles === false'), 'Live smoke protects the cloud-child-profile boundary')
check(liveSmoke.includes('schoolRosters === false'), 'Live smoke protects the school-roster boundary')
check(liveSmoke.includes("['/.well-known/security.txt', 'canonical security contact']"), 'Live smoke checks the canonical security contact')
check(liveSmoke.includes("['/security.txt', 'root security contact fallback']"), 'Live smoke checks the root security contact fallback')
check(liveSmoke.includes('canonicalSecurity?.text === fallbackSecurity?.text'), 'Live smoke compares both security contact representations')
check(liveSmoke.includes('maxAttempts'), 'Live smoke retries deployment propagation')
check(liveSmoke.includes("'artifacts', 'live-site-smoke'") && liveSmoke.includes('reportPath') && liveSmoke.includes('summaryPath'), 'Live smoke writes durable evidence')
check(runtimeRecovery.includes('stale-service-worker-recovery'), 'Runtime validator enforces stale-worker recovery')
check(runtimeRecovery.includes('scheduled-production-drift-watch'), 'Runtime validator enforces drift monitoring')
check(driftWatch.includes("cron: '17 */2 * * *'"), 'Drift watch runs every two hours')
check(driftWatch.includes('KVS_EXPECTED_COMMIT: ${{ github.sha }}'), 'Drift watch compares production with current main')
check(driftWatch.includes('production-drift-watch-${{ github.run_id }}'), 'Drift watch retains evidence')
check(driftWatch.includes('ArivuKids production drift detected'), 'Drift watch reports confirmed production drift')
for (const gate of [
  'deployment-metadata-integrity',
  'live-custom-domain-smoke-configured',
  'rollback-runbook-validated',
  'hidden-trust-resource-deployment',
  'root-security-contact-fallback',
  'runtime-shell-identity',
  'stale-service-worker-recovery',
  'cache-bypass-navigation',
  'browser-repair-flow',
  'scheduled-production-drift-watch',
]) {
  check(release.qualityGates.includes(gate), `Release status publishes ${gate}`)
}
check(release.remainingGates.includes('assistive-technology-review'), 'Assistive-technology review remains manual')
check(release.remainingGates.length === 1, 'Completed production, live verification and rollback gates are no longer marked pending')
check(!release.remainingGates.includes('controlled-production-deployment'), 'Controlled production deployment is recorded as completed')
check(!release.remainingGates.includes('live-post-deployment-verification'), 'Live post-deployment verification is recorded as completed')
check(!release.remainingGates.includes('rollback-readiness-verification'), 'Rollback readiness is recorded as completed')
check(/KVS-PLATFORM-001/.test(releaseRunbook), 'Release runbook identifies the controlled KVS-PLATFORM-001 release')
check(/subsequent production hotfixes/i.test(releaseRunbook), 'Release runbook covers subsequent production hotfixes')
check(/product owner has asked to fix the remaining page failure and move to the next stage/i.test(releaseRunbook), 'Release runbook records the product-owner promotion instruction')
check(/physical screen-reader listening exercise remains an outstanding manual follow-up/i.test(releaseRunbook), 'Release runbook does not misrepresent the manual screen-reader status')
check(/do not change DNS/i.test(rollback), 'Rollback runbook prohibits unrelated DNS changes')
check(/revert/i.test(rollback), 'Rollback runbook documents a Git revert path')
check(/screen reader/i.test(screenReader), 'Assistive-technology checklist is explicitly screen-reader based')
check(/Narrator/i.test(screenReader), 'Checklist includes the built-in Windows Narrator path')
check(/NVDA/i.test(screenReader), 'Checklist includes an NVDA review path')
check(/PASS|FAIL/.test(screenReader), 'Checklist records a clear pass/fail decision')

if (failures.length) {
  console.error('\nRelease operations validation failed:')
  failures.forEach((failure) => console.error(`✗ ${failure}`))
  process.exit(1)
}

console.log(`\n✓ Release operations gate passed (${checks} controls)`)
