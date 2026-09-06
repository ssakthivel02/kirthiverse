import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const files = [
  'src/content/kvsProductionMath.ts',
  'src/content/kvsProductionTamil.ts',
  'src/content/kvsProductionEnglish.ts',
  'src/content/kvsProductionCoding.ts',
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

const modules = await Promise.all(files.map(loadModule))
const lessons = modules.flatMap((m) => Object.entries(m).filter(([k]) => k.endsWith('Lessons')).flatMap(([, v]) => Array.isArray(v) ? v : []))
const quizzes = modules.flatMap((m) => Object.entries(m).filter(([k]) => k.endsWith('Quizzes')).flatMap(([, v]) => Array.isArray(v) ? v : []))
const errors = []
const expectedSubjects = new Set(['Mathematics', 'Tamil', 'English', 'Coding'])
const lessonIds = new Set()
const quizIds = new Set()
const byLesson = new Map()

if (lessons.length !== 12) errors.push(`Expected 12 KVS production lessons; found ${lessons.length}.`)
if (quizzes.length !== 48) errors.push(`Expected 48 KVS production questions; found ${quizzes.length}.`)

for (const lesson of lessons) {
  if (!lesson.id?.startsWith('KVS-')) errors.push(`Invalid KVS lesson id: ${lesson.id}`)
  if (lessonIds.has(lesson.id)) errors.push(`Duplicate KVS lesson id: ${lesson.id}`)
  lessonIds.add(lesson.id)
  if (!expectedSubjects.has(lesson.subject)) errors.push(`Unsupported production-seed subject ${lesson.subject} on ${lesson.id}`)
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 2) errors.push(`${lesson.id} needs bilingual objectives.`)
  if (!lesson.explanation || lesson.explanation.length < 40) errors.push(`${lesson.id} explanation is too short.`)
  if (!Array.isArray(lesson.examples) || lesson.examples.length < 1) errors.push(`${lesson.id} needs an example.`)
}

for (const q of quizzes) {
  if (!q.id?.startsWith('KVS-Q-')) errors.push(`Invalid KVS question id: ${q.id}`)
  if (quizIds.has(q.id)) errors.push(`Duplicate KVS question id: ${q.id}`)
  quizIds.add(q.id)
  if (!lessonIds.has(q.lessonId)) errors.push(`${q.id} references missing seed lesson ${q.lessonId}`)
  byLesson.set(q.lessonId, (byLesson.get(q.lessonId) ?? 0) + 1)
  if (!['mcq', 'short-answer'].includes(q.type)) errors.push(`${q.id} uses unsupported runtime type ${q.type}`)
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) errors.push(`${q.id} has invalid options.`)
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length ?? 0)) errors.push(`${q.id} has invalid correctAnswer index.`)
  }
  if (q.type === 'short-answer' && !String(q.correctAnswer ?? '').trim()) errors.push(`${q.id} has no short answer.`)
}

for (const lesson of lessons) {
  if ((byLesson.get(lesson.id) ?? 0) !== 4) errors.push(`${lesson.id} must have exactly 4 seed questions; found ${byLesson.get(lesson.id) ?? 0}.`)
}

const sourceText = await Promise.all(files.map((file) => fs.readFile(path.join(root, file), 'utf8')))
if (sourceText.join('\n').includes('KVS-SCI-A15-L04-MITOSIS-001')) errors.push('B39 science content leaked into production seed.')

if (errors.length) {
  errors.forEach((error) => console.error(`Error: ${error}`))
  process.exit(1)
}
console.log(`✓ KVS production seed: ${lessons.length} lessons, ${quizzes.length} questions`)
console.log('✓ 4 questions per lesson; B39 source-verification content remains blocked')
