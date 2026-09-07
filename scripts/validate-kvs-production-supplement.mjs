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
]
const provenanceFile = 'src/content/kvsProductionScienceProvenance.ts'

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
const provenanceModule = await loadModule(provenanceFile)
const lessons = modules.flatMap((m) => Object.entries(m).filter(([k]) => k.endsWith('Lessons')).flatMap(([, v]) => Array.isArray(v) ? v : []))
const quizzes = modules.flatMap((m) => Object.entries(m).filter(([k]) => k.endsWith('Quizzes')).flatMap(([, v]) => Array.isArray(v) ? v : []))
const provenance = Array.isArray(provenanceModule.kvsScienceProvenance) ? provenanceModule.kvsScienceProvenance : []
const errors = []
const expectedSubjects = new Set(['Mathematics', 'Tamil', 'English', 'Coding', 'Science'])
const expectedScienceLessons = new Set([
  'KVS-SCI-A07-L03-LIFECYCLE-001',
  'KVS-SCI-A09-L03-MUSCLEBONE-001',
  'KVS-SCI-A09-L04-PLANTREPRO-001',
  'KVS-SCI-A11-L05-DIGEST-001',
  'KVS-SCI-A13-L04-ORGSYS-001',
  'KVS-SCI-A15-L04-MITOSIS-001',
])
const allowedSourceHosts = new Set(['www.gov.uk', 'openstax.org', 'www.niddk.nih.gov', 'nigms.nih.gov', 'www.ncbi.nlm.nih.gov'])
const lessonIds = new Set()
const quizIds = new Set()
const byLesson = new Map()

if (lessons.length !== 18) errors.push(`Expected 18 KVS production lessons; found ${lessons.length}.`)
if (quizzes.length !== 72) errors.push(`Expected 72 KVS production questions; found ${quizzes.length}.`)

for (const lesson of lessons) {
  if (!lesson.id?.startsWith('KVS-')) errors.push(`Invalid KVS lesson id: ${lesson.id}`)
  if (lessonIds.has(lesson.id)) errors.push(`Duplicate KVS lesson id: ${lesson.id}`)
  lessonIds.add(lesson.id)
  if (!expectedSubjects.has(lesson.subject)) errors.push(`Unsupported production subject ${lesson.subject} on ${lesson.id}`)
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 2) errors.push(`${lesson.id} needs bilingual objectives.`)
  if (!lesson.explanation || lesson.explanation.length < 40) errors.push(`${lesson.id} explanation is too short.`)
  if (!Array.isArray(lesson.examples) || lesson.examples.length < 1) errors.push(`${lesson.id} needs an example.`)
}

for (const q of quizzes) {
  if (!q.id?.startsWith('KVS-Q-')) errors.push(`Invalid KVS question id: ${q.id}`)
  if (quizIds.has(q.id)) errors.push(`Duplicate KVS question id: ${q.id}`)
  quizIds.add(q.id)
  if (!lessonIds.has(q.lessonId)) errors.push(`${q.id} references missing production lesson ${q.lessonId}`)
  byLesson.set(q.lessonId, (byLesson.get(q.lessonId) ?? 0) + 1)
  if (!['mcq', 'short-answer'].includes(q.type)) errors.push(`${q.id} uses unsupported runtime type ${q.type}`)
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) errors.push(`${q.id} has invalid options.`)
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length ?? 0)) errors.push(`${q.id} has invalid correctAnswer index.`)
  }
  if (q.type === 'short-answer' && !String(q.correctAnswer ?? '').trim()) errors.push(`${q.id} has no short answer.`)
}

for (const lesson of lessons) {
  if ((byLesson.get(lesson.id) ?? 0) !== 4) errors.push(`${lesson.id} must have exactly 4 production questions; found ${byLesson.get(lesson.id) ?? 0}.`)
}

const scienceLessons = lessons.filter((lesson) => lesson.subject === 'Science')
if (scienceLessons.length !== 6) errors.push(`Expected 6 source-verified B39 Science lessons; found ${scienceLessons.length}.`)
for (const lessonId of expectedScienceLessons) {
  if (!lessonIds.has(lessonId)) errors.push(`Missing source-verified B39 Science lesson ${lessonId}.`)
}

if (provenance.length !== 6) errors.push(`Expected 6 B39 Science provenance entries; found ${provenance.length}.`)
const provenanceIds = new Set()
for (const entry of provenance) {
  if (!expectedScienceLessons.has(entry.lessonId)) errors.push(`Unexpected Science provenance lesson ${entry.lessonId}.`)
  if (provenanceIds.has(entry.lessonId)) errors.push(`Duplicate Science provenance entry ${entry.lessonId}.`)
  provenanceIds.add(entry.lessonId)
  if (entry.sourceState !== 'source-verified') errors.push(`${entry.lessonId} is not marked source-verified.`)
  if (!Array.isArray(entry.sources) || entry.sources.length < 1) errors.push(`${entry.lessonId} has no authoritative source.`)
  for (const source of entry.sources ?? []) {
    try {
      const url = new URL(source.url)
      if (url.protocol !== 'https:') errors.push(`${entry.lessonId} has a non-HTTPS source URL.`)
      if (!allowedSourceHosts.has(url.hostname)) errors.push(`${entry.lessonId} uses unapproved source host ${url.hostname}.`)
    } catch {
      errors.push(`${entry.lessonId} has an invalid source URL: ${source.url}`)
    }
  }
}
for (const lessonId of expectedScienceLessons) {
  if (!provenanceIds.has(lessonId)) errors.push(`Missing provenance for ${lessonId}.`)
}

const scienceSource = await fs.readFile(path.join(root, 'src/content/kvsProductionScience.ts'), 'utf8')
if (/DNA is replicated during mitosis/i.test(scienceSource)) errors.push('Mitosis wording regression: DNA replication must remain distinct from mitosis.')
if (!/DNA is replicated during S phase before mitosis/i.test(scienceSource)) errors.push('Corrected mitosis distinction is missing from the production Science source.')

if (errors.length) {
  errors.forEach((error) => console.error(`Error: ${error}`))
  process.exit(1)
}
console.log(`✓ KVS production tranche: ${lessons.length} lessons, ${quizzes.length} questions`)
console.log('✓ Exactly 4 questions per lesson across Mathematics, Tamil, English, Coding and Science')
console.log('✓ B39 Science: 6 lessons / 24 questions with authoritative provenance and corrected mitosis wording')
