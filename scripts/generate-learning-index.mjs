import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const sources = [
  'src/content/lessons.ts',
  'src/content/quizzes.ts',
  'src/content/supplementalQuizzes.ts',
  'src/content/kvsProductionMath.ts',
  'src/content/kvsProductionTamil.ts',
  'src/content/kvsProductionEnglish.ts',
  'src/content/kvsProductionCoding.ts',
  'src/content/kvsProductionScience.ts',
  'src/content/kvsProductionFoundations.ts',
  'src/content/kvsProductionPrerequisites.ts',
]

const productionSources = new Set(sources.filter((item) => item.includes('kvsProduction')))

function propertyNameText(name) {
  if (!name) return null
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return null
}

function literalValue(node) {
  if (!node) return null
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text)
    if (node.operator === ts.SyntaxKind.MinusToken) return -value
    if (node.operator === ts.SyntaxKind.PlusToken) return value
  }
  return null
}

function objectLiteralFields(node) {
  const fields = new Map()
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const key = propertyNameText(property.name)
    if (!key) continue
    const value = literalValue(property.initializer)
    if (value !== null) fields.set(key, value)
  }
  return fields
}

function callValues(node) {
  if (node.arguments.length === 1 && ts.isArrayLiteralExpression(node.arguments[0])) {
    return node.arguments[0].elements.map(literalValue)
  }
  return node.arguments.map(literalValue)
}

function addLesson(map, id, subject, title, order) {
  if (typeof id !== 'string' || typeof subject !== 'string' || typeof title !== 'string') return false
  if (typeof order !== 'number' || !Number.isFinite(order)) return false
  if (!map.has(id)) map.set(id, { id, subject, title, order })
  return true
}

function addQuiz(map, id, subject, lessonId) {
  if (typeof id !== 'string' || typeof subject !== 'string' || typeof lessonId !== 'string') return false
  if (!map.has(id)) map.set(id, { id, subject, lessonId })
  return true
}

function extractFactoryCall(relativePath, node, lessons, quizzes) {
  if (!ts.isIdentifier(node.expression)) return { lessons: 0, quizzes: 0 }
  const kind = node.expression.text
  if (!['lesson', 'mcq', 'short'].includes(kind)) return { lessons: 0, quizzes: 0 }
  const values = callValues(node)

  if (relativePath.endsWith('kvsProductionScience.ts')) {
    if (kind === 'lesson') return { lessons: addLesson(lessons, values[0], 'Science', values[2], values[8]) ? 1 : 0, quizzes: 0 }
    return { lessons: 0, quizzes: addQuiz(quizzes, values[0], 'Science', values[1]) ? 1 : 0 }
  }

  if (relativePath.endsWith('kvsProductionFoundations.ts')) {
    if (kind === 'lesson') return { lessons: addLesson(lessons, values[0], values[1], values[3], values[10]) ? 1 : 0, quizzes: 0 }
    return { lessons: 0, quizzes: addQuiz(quizzes, values[0], values[1], values[2]) ? 1 : 0 }
  }

  if (relativePath.endsWith('kvsProductionPrerequisites.ts')) {
    if (kind === 'lesson') return { lessons: addLesson(lessons, values[0], values[1], values[3], values[9]) ? 1 : 0, quizzes: 0 }
    return { lessons: 0, quizzes: addQuiz(quizzes, values[0], values[1], values[2]) ? 1 : 0 }
  }

  return { lessons: 0, quizzes: 0 }
}

const lessons = new Map()
const quizzes = new Map()
const sourceStats = []

for (const relativePath of sources) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) throw new Error(`Learning-index source missing: ${relativePath}`)

  const sourceText = fs.readFileSync(absolutePath, 'utf8')
  const sourceFile = ts.createSourceFile(relativePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let lessonObjects = 0
  let quizObjects = 0

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const fields = objectLiteralFields(node)
      const id = fields.get('id')
      const subject = fields.get('subject')
      if (typeof id === 'string' && typeof subject === 'string') {
        const lessonId = fields.get('lessonId')
        if (typeof lessonId === 'string') {
          if (addQuiz(quizzes, id, subject, lessonId)) quizObjects += 1
        } else if (addLesson(lessons, id, subject, fields.get('title'), fields.get('order'))) {
          lessonObjects += 1
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const extracted = extractFactoryCall(relativePath, node, lessons, quizzes)
      lessonObjects += extracted.lessons
      quizObjects += extracted.quizzes
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  sourceStats.push({ source: relativePath, lessons: lessonObjects, questions: quizObjects })
}

for (const stat of sourceStats) {
  if (productionSources.has(stat.source) && (stat.lessons === 0 || stat.questions === 0)) {
    throw new Error(`Production learning-index source was not fully extracted: ${stat.source} (${stat.lessons} lessons, ${stat.questions} questions)`)
  }
}

if (lessons.size < 10 || quizzes.size < 10) {
  throw new Error(`Learning index extraction is implausibly small: ${lessons.size} lessons, ${quizzes.size} questions`)
}

const missingLessonRefs = [...quizzes.values()]
  .filter((question) => !lessons.has(question.lessonId))
  .map((question) => `${question.id}->${question.lessonId}`)

if (missingLessonRefs.length) {
  throw new Error(`Learning index contains question references to missing lessons: ${missingLessonRefs.slice(0, 10).join(', ')}`)
}

const quizCounts = new Map()
for (const question of quizzes.values()) {
  quizCounts.set(question.lessonId, (quizCounts.get(question.lessonId) ?? 0) + 1)
}

const lessonIndex = [...lessons.values()]
  .map((lesson) => ({ ...lesson, quizQuestions: quizCounts.get(lesson.id) ?? 0 }))
  .sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order || a.id.localeCompare(b.id))

const worldStats = {}
for (const lesson of lessonIndex) {
  const key = lesson.subject.toLowerCase().replace(/\s+/g, '-')
  worldStats[key] ??= { lessonCount: 0, quizCount: 0 }
  worldStats[key].lessonCount += 1
  worldStats[key].quizCount += lesson.quizQuestions
}

const generated = `// AUTO-GENERATED by scripts/generate-learning-index.mjs. Do not edit by hand.\n\nexport interface LearningLessonIndexItem {\n  id: string\n  subject: string\n  title: string\n  order: number\n  quizQuestions: number\n}\n\nexport const learningLessonIndex: LearningLessonIndexItem[] = ${JSON.stringify(lessonIndex, null, 2)}\n\nexport const learningWorldStats: Record<string, { lessonCount: number; quizCount: number }> = ${JSON.stringify(worldStats, null, 2)}\n\nexport const learningTotals = { lessons: ${lessonIndex.length}, questions: ${quizzes.size} } as const\n`

const output = path.join(root, 'src/content/learningIndex.generated.ts')
fs.writeFileSync(output, generated)
console.log(`Generated learning index: ${lessonIndex.length} lessons, ${quizzes.size} questions`)
for (const stat of sourceStats.filter((item) => item.lessons || item.questions)) {
  console.log(`  ${stat.source}: ${stat.lessons} lessons, ${stat.questions} questions`)
}
