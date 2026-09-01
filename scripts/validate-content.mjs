import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const coverageDir = path.join(root, 'artifacts', 'content-coverage')
const expectedSubjects = ['Mathematics', 'Science', 'English', 'Coding', 'Geography', 'History', 'Tamil', 'Music', 'Arts', 'Life Skills']
const errors = []
const warnings = []

async function loadTypeScriptModule(relativePath) {
  const sourcePath = path.join(root, relativePath)
  const source = await fs.readFile(sourcePath, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: sourcePath,
  }).outputText
  const temporaryPath = path.join(os.tmpdir(), `kirthiverse-${path.basename(relativePath, '.ts')}-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
  await fs.writeFile(temporaryPath, output, 'utf8')
  try {
    return await import(`${pathToFileURL(temporaryPath).href}?v=${Date.now()}`)
  } finally {
    await fs.rm(temporaryPath, { force: true })
  }
}

function requireCondition(condition, message) {
  if (!condition) errors.push(message)
}

function warn(condition, message) {
  if (!condition) warnings.push(message)
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

const [{ lessons }, { quizzes: baseQuizzes }, { supplementalQuizzes }] = await Promise.all([
  loadTypeScriptModule('src/content/lessons.ts'),
  loadTypeScriptModule('src/content/quizzes.ts'),
  loadTypeScriptModule('src/content/supplementalQuizzes.ts'),
])
const quizzes = Array.isArray(baseQuizzes) && Array.isArray(supplementalQuizzes) ? [...baseQuizzes, ...supplementalQuizzes] : []

requireCondition(Array.isArray(lessons), 'Lessons export must be an array.')
requireCondition(Array.isArray(baseQuizzes), 'Base quizzes export must be an array.')
requireCondition(Array.isArray(supplementalQuizzes), 'Supplemental quizzes export must be an array.')

if (Array.isArray(lessons) && Array.isArray(baseQuizzes) && Array.isArray(supplementalQuizzes)) {
  requireCondition(lessons.length >= 77, `Expected at least 77 lessons; found ${lessons.length}.`)
  requireCondition(quizzes.length >= lessons.length, `Expected at least one quiz question per lesson; found ${quizzes.length} questions for ${lessons.length} lessons.`)

  const lessonIds = new Set()
  const lessonById = new Map()
  const lessonTitles = new Map()
  const subjectLessonCount = new Map(expectedSubjects.map((subject) => [subject, 0]))

  for (const [index, lesson] of lessons.entries()) {
    const label = `Lesson ${index + 1}`
    requireCondition(nonEmpty(lesson.id), `${label}: id is required.`)
    requireCondition(!lessonIds.has(lesson.id), `${label}: duplicate id ${lesson.id}.`)
    lessonIds.add(lesson.id)
    lessonById.set(lesson.id, lesson)
    requireCondition(expectedSubjects.includes(lesson.subject), `${label} (${lesson.id}): unknown subject ${lesson.subject}.`)
    if (expectedSubjects.includes(lesson.subject)) subjectLessonCount.set(lesson.subject, (subjectLessonCount.get(lesson.subject) ?? 0) + 1)
    requireCondition(nonEmpty(lesson.category), `${label} (${lesson.id}): category is required.`)
    requireCondition(nonEmpty(lesson.title), `${label} (${lesson.id}): title is required.`)
    requireCondition(Array.isArray(lesson.objectives) && lesson.objectives.length >= 2 && lesson.objectives.every(nonEmpty), `${label} (${lesson.id}): at least two objectives are required.`)
    requireCondition(nonEmpty(lesson.explanation) && lesson.explanation.trim().length >= 40, `${label} (${lesson.id}): explanation must be at least 40 characters.`)
    requireCondition(Array.isArray(lesson.examples) && lesson.examples.length >= 1 && lesson.examples.every(nonEmpty), `${label} (${lesson.id}): at least one example is required.`)
    requireCondition(nonEmpty(lesson.summary) && lesson.summary.trim().length >= 20, `${label} (${lesson.id}): summary must be at least 20 characters.`)
    requireCondition(['beginner', 'intermediate', 'advanced'].includes(lesson.difficulty), `${label} (${lesson.id}): invalid difficulty.`)
    requireCondition(Number.isInteger(lesson.duration) && lesson.duration >= 3 && lesson.duration <= 60, `${label} (${lesson.id}): duration must be 3–60 minutes.`)
    requireCondition(Number.isInteger(lesson.order) && lesson.order > 0, `${label} (${lesson.id}): order must be a positive integer.`)
    const titleKey = `${lesson.subject}:${String(lesson.title).trim().toLowerCase()}`
    lessonTitles.set(titleKey, (lessonTitles.get(titleKey) ?? 0) + 1)
  }

  for (const subject of expectedSubjects) requireCondition((subjectLessonCount.get(subject) ?? 0) > 0, `Subject ${subject} has no lessons.`)
  for (const [title, count] of lessonTitles) warn(count === 1, `Duplicate lesson title detected: ${title}.`)

  const quizIds = new Set()
  const quizQuestionText = new Set()
  const subjectQuizCount = new Map(expectedSubjects.map((subject) => [subject, 0]))
  const quizzesByLesson = new Map()

  for (const [index, question] of quizzes.entries()) {
    const label = `Quiz question ${index + 1}`
    requireCondition(nonEmpty(question.id), `${label}: id is required.`)
    requireCondition(!quizIds.has(question.id), `${label}: duplicate id ${question.id}.`)
    quizIds.add(question.id)
    requireCondition(nonEmpty(question.lessonId), `${label} (${question.id}): lessonId is required.`)
    requireCondition(lessonIds.has(question.lessonId), `${label} (${question.id}): lesson ${question.lessonId} does not exist.`)
    const lesson = lessonById.get(question.lessonId)
    requireCondition(expectedSubjects.includes(question.subject), `${label} (${question.id}): unknown subject ${question.subject}.`)
    requireCondition(!lesson || lesson.subject === question.subject, `${label} (${question.id}): subject does not match lesson ${question.lessonId}.`)
    if (expectedSubjects.includes(question.subject)) subjectQuizCount.set(question.subject, (subjectQuizCount.get(question.subject) ?? 0) + 1)
    requireCondition(['mcq', 'true-false', 'short-answer'].includes(question.type), `${label} (${question.id}): unsupported type ${question.type}.`)
    requireCondition(nonEmpty(question.question) && question.question.trim().length >= 8, `${label} (${question.id}): question is too short.`)
    requireCondition(nonEmpty(question.explanation) && question.explanation.trim().length >= 15, `${label} (${question.id}): explanation must be at least 15 characters.`)
    requireCondition(['easy', 'medium', 'hard'].includes(question.difficulty), `${label} (${question.id}): invalid difficulty.`)
    const questionKey = String(question.question).trim().toLowerCase().replace(/\s+/g, ' ')
    requireCondition(!quizQuestionText.has(questionKey), `${label} (${question.id}): duplicate question text.`)
    quizQuestionText.add(questionKey)

    if (question.type === 'mcq') {
      requireCondition(Array.isArray(question.options) && question.options.length >= 2 && question.options.length <= 6, `${label} (${question.id}): MCQ requires 2–6 options.`)
      requireCondition(Array.isArray(question.options) && question.options.every(nonEmpty), `${label} (${question.id}): MCQ options cannot be empty.`)
      const normalisedOptions = Array.isArray(question.options) ? question.options.map((option) => option.trim().toLowerCase()) : []
      requireCondition(new Set(normalisedOptions).size === normalisedOptions.length, `${label} (${question.id}): MCQ options must be unique.`)
      const validIndex = typeof question.correctAnswer === 'number' && Number.isInteger(question.correctAnswer) && question.correctAnswer >= 0 && question.correctAnswer < (question.options?.length ?? 0)
      const validText = typeof question.correctAnswer === 'string' && question.options?.some((option) => option.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase())
      requireCondition(Boolean(validIndex || validText), `${label} (${question.id}): MCQ correctAnswer must match a valid option.`)
    }
    if (question.type === 'true-false') {
      const value = String(question.correctAnswer).trim().toLowerCase()
      requireCondition(['0', '1', 'true', 'false'].includes(value), `${label} (${question.id}): true-false correctAnswer must be true/false or 0/1.`)
    }
    if (question.type === 'short-answer') requireCondition(nonEmpty(String(question.correctAnswer)), `${label} (${question.id}): short answer is required.`)

    quizzesByLesson.set(question.lessonId, (quizzesByLesson.get(question.lessonId) ?? 0) + 1)
  }

  for (const subject of expectedSubjects) requireCondition((subjectQuizCount.get(subject) ?? 0) > 0, `Subject ${subject} has no quiz questions.`)
  const lessonsWithoutQuiz = lessons.filter((lesson) => !quizzesByLesson.has(lesson.id))
  requireCondition(lessonsWithoutQuiz.length === 0, `${lessonsWithoutQuiz.length} published lessons do not have a quiz: ${lessonsWithoutQuiz.map((lesson) => lesson.id).join(', ')}`)

  const subjectCoverage = expectedSubjects.map((subject) => ({
    subject,
    lessons: subjectLessonCount.get(subject) ?? 0,
    questions: subjectQuizCount.get(subject) ?? 0,
    coveredLessons: lessons.filter((lesson) => lesson.subject === subject && quizzesByLesson.has(lesson.id)).length,
  }))
  const coverage = {
    generatedAt: new Date().toISOString(),
    lessons: lessons.length,
    questions: quizzes.length,
    baseQuestions: baseQuizzes.length,
    supplementalQuestions: supplementalQuizzes.length,
    coveredLessons: lessons.length - lessonsWithoutQuiz.length,
    coveragePercent: lessons.length ? Math.round(((lessons.length - lessonsWithoutQuiz.length) / lessons.length) * 100) : 0,
    missingLessons: lessonsWithoutQuiz.map((lesson) => ({ id: lesson.id, subject: lesson.subject, title: lesson.title })),
    subjects: subjectCoverage,
  }
  await fs.mkdir(coverageDir, { recursive: true })
  await fs.writeFile(path.join(coverageDir, 'report.json'), JSON.stringify(coverage, null, 2))
  const summary = [
    '# KirthiVerse learning-content coverage',
    '',
    `- Lessons: **${coverage.lessons}**`,
    `- Quiz questions: **${coverage.questions}** (${coverage.baseQuestions} baseline + ${coverage.supplementalQuestions} coverage questions)`,
    `- Lessons with at least one quiz: **${coverage.coveredLessons}/${coverage.lessons} (${coverage.coveragePercent}%)**`,
    '',
    '## Subject coverage',
    ...subjectCoverage.map((item) => `- ${item.subject}: ${item.coveredLessons}/${item.lessons} lessons covered; ${item.questions} questions`),
    '',
    '## Lessons without a quiz',
    ...(coverage.missingLessons.length ? coverage.missingLessons.map((item) => `- ${item.id} · ${item.subject} · ${item.title}`) : ['- None']),
  ].join('\n')
  await fs.writeFile(path.join(coverageDir, 'summary.md'), summary)

  console.log(`✓ Lessons: ${lessons.length}`)
  console.log(`✓ Quiz questions: ${quizzes.length}`)
  console.log(`✓ Subjects: ${expectedSubjects.length}`)
  console.log(`✓ Lesson IDs: ${lessonIds.size} unique`)
  console.log(`✓ Quiz IDs: ${quizIds.size} unique`)
  console.log(`✓ Lessons with quiz coverage: ${lessons.length - lessonsWithoutQuiz.length}/${lessons.length}`)
  console.log(`ℹ Coverage evidence: ${path.relative(root, coverageDir)}`)
}

for (const message of warnings) console.warn(`Warning: ${message}`)
if (errors.length > 0) {
  for (const message of errors) console.error(`Error: ${message}`)
  console.error(`\nContent validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log('\n✓ Learning content validation passed')