import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { legacyPages, requiredFiles, requiredDirs } from './legacy-pages.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.resolve(projectRoot, 'dist')
const srcDir = projectRoot

const optionalFiles = [
  'robots.txt',
]

function copyFile(src, dst) {
  const srcPath = path.resolve(srcDir, src)
  const dstPath = path.resolve(distDir, dst || src)

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Required file missing: ${src}`)
  }

  const dstDirPath = path.dirname(dstPath)
  if (!fs.existsSync(dstDirPath)) {
    fs.mkdirSync(dstDirPath, { recursive: true })
  }

  fs.copyFileSync(srcPath, dstPath)
  console.log(`✓ Copied: ${src}`)
}

function copyDir(src) {
  const srcPath = path.resolve(srcDir, src)
  const dstPath = path.resolve(distDir, src)

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Required directory missing: ${src}`)
  }

  if (fs.existsSync(dstPath)) {
    fs.rmSync(dstPath, { recursive: true })
  }

  fs.cpSync(srcPath, dstPath, { recursive: true })
  console.log(`✓ Copied directory: ${src}`)
}

function cleanEnvironmentValue(value, fallback) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized || fallback
}

function stampDeploymentMetadata() {
  const channel = cleanEnvironmentValue(process.env.KVS_RELEASE_CHANNEL, 'preview')
  if (!['preview', 'production'].includes(channel)) throw new Error(`Unsupported KVS_RELEASE_CHANNEL: ${channel}`)

  const commit = cleanEnvironmentValue(process.env.KVS_BUILD_COMMIT || process.env.GITHUB_SHA, 'local-build')
  const runId = cleanEnvironmentValue(process.env.KVS_BUILD_RUN_ID || process.env.GITHUB_RUN_ID, 'local')
  const sourceRef = cleanEnvironmentValue(process.env.KVS_SOURCE_REF || process.env.GITHUB_REF_NAME, 'local')
  const builtAt = new Date().toISOString()

  const releasePath = path.resolve(distDir, 'release-status.json')
  if (!fs.existsSync(releasePath)) throw new Error('dist/release-status.json is missing before deployment stamping')
  const releaseStatus = JSON.parse(fs.readFileSync(releasePath, 'utf8'))
  if (releaseStatus.runtimeRecoveryReady !== true) throw new Error('Release source has not declared runtime recovery readiness')
  releaseStatus.channel = channel
  releaseStatus.status = channel === 'production'
    ? 'production-runtime-recovery-artifact'
    : 'runtime-recovery-preview-artifact'
  releaseStatus.buildCommit = commit
  releaseStatus.buildRunId = runId
  releaseStatus.builtAt = builtAt
  fs.writeFileSync(releasePath, `${JSON.stringify(releaseStatus, null, 2)}\n`)

  const deploymentMetadata = {
    product: 'KirthiVerse',
    release: releaseStatus.release,
    channel,
    status: releaseStatus.status,
    runtimeRecoveryReady: releaseStatus.runtimeRecoveryReady === true,
    runtimeShellMarker: releaseStatus.runtimeShellMarker,
    browserRecoveryPage: releaseStatus.browserRecoveryPage,
    commit,
    runId,
    sourceRef,
    builtAt,
    customDomain: 'https://arivukids.omsaravanabhava.org/',
    localFirst: releaseStatus.localFirst === true,
    cloudChildProfiles: releaseStatus.cloudChildProfiles === true,
    schoolRosters: releaseStatus.schoolRosters === true,
  }
  fs.writeFileSync(path.resolve(distDir, 'deployment-metadata.json'), `${JSON.stringify(deploymentMetadata, null, 2)}\n`)
  console.log(`✓ Stamped ${channel} runtime recovery artifact for ${commit}`)
}

try {
  console.log('Copying static production files...')

  for (const file of requiredFiles) {
    copyFile(file)
  }

  for (const dir of requiredDirs) {
    copyDir(dir)
  }

  for (const file of optionalFiles) {
    try {
      copyFile(file)
    } catch {
      console.log(`⊘ Optional file not found: ${file}`)
    }
  }

  console.log(`\nCopying ${legacyPages.length} legacy pages...`)
  let copiedCount = 0
  for (const page of legacyPages) {
    const srcPath = path.resolve(srcDir, page)
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing legacy page: ${page}`)
    }
    copyFile(page)
    copiedCount += 1
  }

  stampDeploymentMetadata()

  console.log('\n✓ All static files copied successfully')
  console.log(`✓ Legacy pages: ${copiedCount}/${legacyPages.length}`)
  process.exit(0)
} catch (error) {
  console.error('\n✗ Error copying static files:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
