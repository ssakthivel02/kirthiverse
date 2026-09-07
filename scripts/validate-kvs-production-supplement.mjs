import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const contentFiles = [
  'src/content/kvsProductionMath.ts',
  'src/content/kvsProductionTamil.ts',
  'src/content/kvsProductionEnglish.ts',
  'src/content/kvsProductionCoding.ts',
  'src/content/kvsProductionScience.ts',
  'src/content/kvsProductionFoundations.ts',
  'src/content/kvsProductionPrerequisites.ts',
]
const provenanceFiles = [
  'src/content/kvsProductionScienceProvenance.ts',
  'src/content/kvsProductionFoundationsProvenance.ts',
  'src/content/kvsProductionPrerequisitesProvenance.ts',
]

async function loadModule(relativePath) {
  const sourcePath = path.join(root, relativePath)
  const source = await fs.readFile(sourcePath, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, moduleResolution: ts.ModuleResolutionKind.Bundler },
    fileName: sourcePath,
  }).outputText
  const temporaryPath = path.join(os.tmpdir(), `kvs-prod-${path.basename(relativePath, '.ts')}-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
  await fs.writeFile(temporaryPath, output, 'utf8')
  try { return await import(`${pathToFileURL(temporaryPath).href}?v=${Date.now()}`) }
  finally { await fs.rm(temporaryPath, { force: true }) }
}

const modules = await Promise.all(contentFiles.map(loadModule))
const [scienceProvenanceModule, foundationProvenanceModule, prerequisiteProvenanceModule] = await Promise.all(provenanceFiles.map(loadModule))
const lessons = modules.flatMap((m) => Object.entries(m).filter(([k]) => k.endsWith('Lessons')).flatMap(([, v]) => Array.isArray(v) ? v : []))
const quizzes = modules.flatMap((m) => Object.entries(m).filter(([k]) => k.endsWith('Quizzes')).flatMap(([, v]) => Array.isArray(v) ? v : []))
const scienceProvenance = Array.isArray(scienceProvenanceModule.kvsScienceProvenance) ? scienceProvenanceModule.kvsScienceProvenance : []
const foundationProvenance = Array.isArray(foundationProvenanceModule.kvsFoundationProvenance) ? foundationProvenanceModule.kvsFoundationProvenance : []
const prerequisiteProvenance = Array.isArray(prerequisiteProvenanceModule.kvsPrerequisiteProvenance) ? prerequisiteProvenanceModule.kvsPrerequisiteProvenance : []
const errors = []
const expectedSubjects = new Set(['Mathematics', 'Tamil', 'English', 'Coding', 'Science'])
const expectedScienceLessons = new Set([
  'KVS-SCI-A07-L03-LIFECYCLE-001','KVS-SCI-A09-L03-MUSCLEBONE-001','KVS-SCI-A09-L04-PLANTREPRO-001',
  'KVS-SCI-A11-L05-DIGEST-001','KVS-SCI-A13-L04-ORGSYS-001','KVS-SCI-A15-L04-MITOSIS-001',
])
const expectedFoundationLessons = new Set([
  'KVS-MATH-A03-L03-SHAPE-001','KVS-SCI-A03-L02-OBSERVE-001','KVS-TAM-A03-L03-MEI-001',
  'KVS-ENG-A03-L02-RHYME-001','KVS-MATH-A05-L04-BONDS-001','KVS-CT-A05-L02-IO-001',
])
const expectedPrerequisiteLessons = new Set([
  'KVS-MATH-A07-L04-DIV-001','KVS-TAM-A09-L03-POS-001','KVS-ENG-A13-L02-INFER-001',
  'KVS-CT-A09-L02-DEBUG-001','KVS-MATH-A13-L03-PYTHAG-001','KVS-SCI-A11-L04-FORCE-001',
])
const allowedSourceHosts = new Set([
  'www.gov.uk','openstax.org','www.niddk.nih.gov','nigms.nih.gov','www.ncbi.nlm.nih.gov',
  'www.tamilvu.org','tamilvu.org','teachcomputing.org','www.teachcomputing.org',
])
const lessonIds = new Set()
const quizIds = new Set()
const byLesson = new Map()

if (lessons.length !== 30) errors.push(`Expected 30 KVS production lessons; found ${lessons.length}.`)
if (quizzes.length !== 120) errors.push(`Expected 120 KVS production questions; found ${quizzes.length}.`)

for (const lesson of lessons) {
  if (!lesson.id?.startsWith('KVS-')) errors.push(`Invalid KVS lesson id: ${lesson.id}`)
  if (lessonIds.has(lesson.id)) errors.push(`Duplicate KVS lesson id: ${lesson.id}`)
  lessonIds.add(lesson.id)
  if (!expectedSubjects.has(lesson.subject)) errors.push(`Unsupported production subject ${lesson.subject} on ${lesson.id}`)
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 2) errors.push(`${lesson.id} needs bilingual objectives.`)
  if (!lesson.explanation || lesson.explanation.length < 40) errors.push(`${lesson.id} explanation is too short.`)
  if (!Array.isArray(lesson.examples) || lesson.examples.length < 1) errors.push(`${lesson.id} needs an example.`)
  if (!lesson.summary || lesson.summary.length < 20) errors.push(`${lesson.id} summary is too short.`)
}

for (const q of quizzes) {
  if (!q.id?.startsWith('KVS-Q-')) errors.push(`Invalid KVS question id: ${q.id}`)
  if (quizIds.has(q.id)) errors.push(`Duplicate KVS question id: ${q.id}`)
  quizIds.add(q.id)
  if (!lessonIds.has(q.lessonId)) errors.push(`${q.id} references missing production lesson ${q.lessonId}`)
  byLesson.set(q.lessonId, (byLesson.get(q.lessonId) ?? 0) + 1)
  if (!['mcq', 'short-answer'].includes(q.type)) errors.push(`${q.id} uses unsupported runtime type ${q.type}`)
  if (!q.question || q.question.trim().length < 8) errors.push(`${q.id} question is too short.`)
  if (!q.explanation || q.explanation.trim().length < 8) errors.push(`${q.id} explanation is too short.`)
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) errors.push(`${q.id} has invalid options.`)
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length ?? 0)) errors.push(`${q.id} has invalid correctAnswer index.`)
  }
  if (q.type === 'short-answer' && !String(q.correctAnswer ?? '').trim()) errors.push(`${q.id} has no short answer.`)
}
for (const lesson of lessons) {
  if ((byLesson.get(lesson.id) ?? 0) !== 4) errors.push(`${lesson.id} must have exactly 4 production questions; found ${byLesson.get(lesson.id) ?? 0}.`)
}

function requireLessons(expectedIds, label) {
  for (const lessonId of expectedIds) if (!lessonIds.has(lessonId)) errors.push(`Missing source-verified ${label} lesson ${lessonId}.`)
}
requireLessons(expectedScienceLessons, 'B39 Science')
requireLessons(expectedFoundationLessons, 'B35 foundation')
requireLessons(expectedPrerequisiteLessons, 'B36 prerequisite')

function validateProvenance(entries, expectedIds, label) {
  if (entries.length !== expectedIds.size) errors.push(`Expected ${expectedIds.size} ${label} provenance entries; found ${entries.length}.`)
  const provenanceIds = new Set()
  for (const entry of entries) {
    if (!expectedIds.has(entry.lessonId)) errors.push(`Unexpected ${label} provenance lesson ${entry.lessonId}.`)
    if (provenanceIds.has(entry.lessonId)) errors.push(`Duplicate ${label} provenance entry ${entry.lessonId}.`)
    provenanceIds.add(entry.lessonId)
    if (entry.sourceState !== 'source-verified') errors.push(`${entry.lessonId} is not marked source-verified.`)
    if (!Array.isArray(entry.sources) || entry.sources.length < 1) errors.push(`${entry.lessonId} has no authoritative source.`)
    for (const source of entry.sources ?? []) {
      try {
        const url = new URL(source.url)
        if (url.protocol !== 'https:') errors.push(`${entry.lessonId} has a non-HTTPS source URL.`)
        if (!allowedSourceHosts.has(url.hostname)) errors.push(`${entry.lessonId} uses unapproved source host ${url.hostname}.`)
      } catch { errors.push(`${entry.lessonId} has an invalid source URL: ${source.url}`) }
    }
  }
  for (const lessonId of expectedIds) if (!provenanceIds.has(lessonId)) errors.push(`Missing ${label} provenance for ${lessonId}.`)
}
validateProvenance(scienceProvenance, expectedScienceLessons, 'B39 Science')
validateProvenance(foundationProvenance, expectedFoundationLessons, 'B35 foundation')
validateProvenance(prerequisiteProvenance, expectedPrerequisiteLessons, 'B36 prerequisite')

const scienceSource = await fs.readFile(path.join(root, 'src/content/kvsProductionScience.ts'), 'utf8')
if (/DNA is replicated during mitosis/i.test(scienceSource)) errors.push('Mitosis wording regression: DNA replication must remain distinct from mitosis.')
if (!/DNA is replicated during S phase before mitosis/i.test(scienceSource)) errors.push('Corrected mitosis distinction is missing from the production Science source.')

const prerequisiteSource = await fs.readFile(path.join(root, 'src/content/kvsProductionPrerequisites.ts'), 'utf8')
if (!prerequisiteSource.includes('KVS-MATH-A13-L03-PYTHAG-001') || !prerequisiteSource.includes('KVS-SCI-A11-L04-FORCE-001')) errors.push('B36 prerequisite source boundary is incomplete.')
if (/zero resultant force[^\n]*must be stationary/i.test(prerequisiteSource)) errors.push('B36 force misconception regression detected.')
if (!prerequisiteSource.includes('4 + 9 ≠ 16')) errors.push('B36 Pythagoras non-example check is missing.')

if (errors.length) {
  errors.forEach((error) => console.error(`Error: ${error}`))
  process.exit(1)
}
console.log(`✓ KVS production tranche: ${lessons.length} lessons, ${quizzes.length} questions`)
console.log('✓ Exactly 4 questions per lesson across the promoted KVS tranche')
console.log('✓ B35 foundations: 6 lessons / 24 questions with authoritative provenance')
console.log('✓ B36 prerequisites: 6 lessons / 24 questions with authoritative provenance')
console.log('✓ B39 Science: 6 lessons / 24 questions with authoritative provenance and corrected mitosis wording')
