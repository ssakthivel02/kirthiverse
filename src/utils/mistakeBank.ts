import { quizzes, type QuizQuestion } from '../content/quizzes'

export interface MistakeRecord {
  questionId: string
  lessonId: string
  subject: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  explanation: string
  attempts: number
  firstSeenAt: number
  lastSeenAt: number
  resolved: boolean
  resolvedAt: number | null
}

const KEY = 'kvs_mistake_bank'
const MAX_RECORDS = 200

function available() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalise(value: string | number | undefined) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function correctValue(question: QuizQuestion) {
  if (question.type === 'mcq') {
    if (typeof question.correctAnswer === 'number') return String(question.correctAnswer)
    const optionIndex = question.options?.findIndex((option) => normalise(option) === normalise(question.correctAnswer)) ?? -1
    return optionIndex >= 0 ? String(optionIndex) : normalise(question.correctAnswer)
  }
  if (question.type === 'true-false') {
    if (typeof question.correctAnswer === 'number') return question.correctAnswer === 0 ? 'true' : 'false'
    const value = normalise(question.correctAnswer)
    if (value === '0') return 'true'
    if (value === '1') return 'false'
    return value
  }
  return normalise(question.correctAnswer)
}

function isCorrect(question: QuizQuestion, answer: string | number | undefined) {
  return normalise(answer) === correctValue(question)
}

function answerLabel(question: QuizQuestion, answer: string | number | undefined) {
  if (answer === undefined || normalise(answer) === '') return 'No answer'
  if (question.type === 'mcq' && typeof answer === 'number') return question.options?.[answer] ?? String(answer)
  if (question.type === 'true-false') return normalise(answer) === 'true' ? 'True' : 'False'
  return String(answer).slice(0, 160)
}

function correctLabel(question: QuizQuestion) {
  if (question.type === 'mcq') {
    const index = Number(correctValue(question))
    return Number.isInteger(index) ? question.options?.[index] ?? String(question.correctAnswer) : String(question.correctAnswer)
  }
  if (question.type === 'true-false') return correctValue(question) === 'true' ? 'True' : 'False'
  return String(question.correctAnswer)
}

function sanitise(value: unknown): MistakeRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      questionId: typeof item.questionId === 'string' ? item.questionId.slice(0, 120) : '',
      lessonId: typeof item.lessonId === 'string' ? item.lessonId.slice(0, 120) : '',
      subject: typeof item.subject === 'string' ? item.subject.slice(0, 80) : 'General',
      question: typeof item.question === 'string' ? item.question.slice(0, 500) : '',
      selectedAnswer: typeof item.selectedAnswer === 'string' ? item.selectedAnswer.slice(0, 200) : 'No answer',
      correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer.slice(0, 200) : '',
      explanation: typeof item.explanation === 'string' ? item.explanation.slice(0, 1000) : '',
      attempts: typeof item.attempts === 'number' ? Math.max(1, Math.min(999, Math.round(item.attempts))) : 1,
      firstSeenAt: typeof item.firstSeenAt === 'number' ? item.firstSeenAt : Date.now(),
      lastSeenAt: typeof item.lastSeenAt === 'number' ? item.lastSeenAt : Date.now(),
      resolved: item.resolved === true,
      resolvedAt: typeof item.resolvedAt === 'number' ? item.resolvedAt : null,
    }))
    .filter((item) => item.questionId && item.lessonId && item.question)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, MAX_RECORDS)
}

function read() {
  if (!available()) return []
  try {
    return sanitise(JSON.parse(window.localStorage.getItem(KEY) ?? '[]'))
  } catch {
    return []
  }
}

function write(records: MistakeRecord[]) {
  if (!available()) return false
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX_RECORDS)))
    return true
  } catch {
    return false
  }
}

export function recordQuizMistakes(lessonId: string, activeIndexes: number[], answers: Record<number, string | number>) {
  const lessonQuestions = quizzes.filter((question) => question.lessonId === lessonId)
  const records = read()
  const now = Date.now()

  for (const index of activeIndexes) {
    const question = lessonQuestions[index]
    if (!question) continue
    const existingIndex = records.findIndex((item) => item.questionId === question.id && item.lessonId === lessonId)
    const correct = isCorrect(question, answers[index])

    if (correct) {
      if (existingIndex >= 0) {
        records[existingIndex] = { ...records[existingIndex], resolved: true, resolvedAt: now, lastSeenAt: now }
      }
      continue
    }

    const next: MistakeRecord = {
      questionId: question.id,
      lessonId,
      subject: question.subject,
      question: question.question,
      selectedAnswer: answerLabel(question, answers[index]),
      correctAnswer: correctLabel(question),
      explanation: question.explanation,
      attempts: existingIndex >= 0 ? records[existingIndex].attempts + 1 : 1,
      firstSeenAt: existingIndex >= 0 ? records[existingIndex].firstSeenAt : now,
      lastSeenAt: now,
      resolved: false,
      resolvedAt: null,
    }
    if (existingIndex >= 0) records.splice(existingIndex, 1)
    records.unshift(next)
  }

  return write(records.sort((a, b) => b.lastSeenAt - a.lastSeenAt).slice(0, MAX_RECORDS))
}

export function getMistakeRecords() {
  return read()
}

export function setMistakeResolved(questionId: string, lessonId: string, resolved: boolean) {
  const records = read().map((item) => item.questionId === questionId && item.lessonId === lessonId
    ? { ...item, resolved, resolvedAt: resolved ? Date.now() : null }
    : item)
  return write(records)
}

export function clearResolvedMistakes() {
  return write(read().filter((item) => !item.resolved))
}

export function clearMistakeBank() {
  if (!available()) return false
  window.localStorage.removeItem(KEY)
  return true
}

export function getMistakeStorageKey() {
  return KEY
}
