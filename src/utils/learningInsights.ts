import { lessons, type Lesson } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage, type QuizAttempt } from './storage'

export type MasteryState = 'Not assessed' | 'Learning' | 'Practising' | 'Mastered'

export interface SubjectInsight {
  subject: string
  totalLessons: number
  completedLessons: number
  completionPercent: number
  quizAttempts: number
  averageScore: number | null
  mastery: MasteryState
}

export interface PracticeItem {
  lesson: Lesson
  reason: string
  priority: number
  latestScore?: number
  quizQuestions: number
}

function masteryFor(averageScore: number | null, completedLessons: number): MasteryState {
  if (averageScore === null) return completedLessons > 0 ? 'Learning' : 'Not assessed'
  if (averageScore >= 80) return 'Mastered'
  if (averageScore >= 60) return 'Practising'
  return 'Learning'
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
}

export function getSubjectInsights(): SubjectInsight[] {
  const progress = storage.getLessonsProgress()
  const attempts = storage.getQuizAttempts()
  const subjects = [...new Set(lessons.map((lesson) => lesson.subject))]

  return subjects.map((subject) => {
    const subjectLessons = lessons.filter((lesson) => lesson.subject === subject)
    const completedLessons = subjectLessons.filter((lesson) => progress[lesson.id]?.completed).length
    const subjectAttempts = attempts.filter((attempt) => attempt.subject === subject)
    const averageScore = average(subjectAttempts.map((attempt) => attempt.percentage))

    return {
      subject,
      totalLessons: subjectLessons.length,
      completedLessons,
      completionPercent: subjectLessons.length ? Math.round((completedLessons / subjectLessons.length) * 100) : 0,
      quizAttempts: subjectAttempts.length,
      averageScore,
      mastery: masteryFor(averageScore, completedLessons),
    }
  })
}

function latestAttemptsByLesson(attempts: QuizAttempt[]) {
  const latest = new Map<string, QuizAttempt>()
  for (const attempt of [...attempts].sort((a, b) => b.attemptDate - a.attemptDate)) {
    if (attempt.lessonId && !latest.has(attempt.lessonId)) latest.set(attempt.lessonId, attempt)
  }
  return latest
}

export function getPracticeQueue(limit = 8): PracticeItem[] {
  const progress = storage.getLessonsProgress()
  const attempts = storage.getQuizAttempts()
  const preferences = storage.getPreferences()
  const bookmarks = new Set(storage.getBookmarks())
  const latestAttempts = latestAttemptsByLesson(attempts)
  const queue = new Map<string, PracticeItem>()

  for (const [lessonId, attempt] of latestAttempts) {
    if (attempt.percentage >= 80) continue
    const lesson = lessons.find((candidate) => candidate.id === lessonId)
    if (!lesson) continue
    queue.set(lesson.id, {
      lesson,
      latestScore: attempt.percentage,
      reason: attempt.percentage < 60 ? 'Review this topic before moving on' : 'One more practice round can secure mastery',
      priority: attempt.percentage < 60 ? 100 : 80,
      quizQuestions: quizzes.filter((question) => question.lessonId === lesson.id).length,
    })
  }

  for (const lesson of lessons) {
    if (!bookmarks.has(lesson.id) || progress[lesson.id]?.completed || queue.has(lesson.id)) continue
    queue.set(lesson.id, {
      lesson,
      reason: 'Saved for later and ready to continue',
      priority: 70,
      quizQuestions: quizzes.filter((question) => question.lessonId === lesson.id).length,
    })
  }

  const preferredSubjects = preferences.favouriteSubjects.length
    ? preferences.favouriteSubjects
    : [...new Set(lessons.map((lesson) => lesson.subject))]

  for (const subject of preferredSubjects) {
    const nextLesson = lessons
      .filter((lesson) => lesson.subject === subject && !progress[lesson.id]?.completed)
      .sort((a, b) => a.order - b.order)[0]
    if (!nextLesson || queue.has(nextLesson.id)) continue
    queue.set(nextLesson.id, {
      lesson: nextLesson,
      reason: preferences.favouriteSubjects.includes(subject) ? 'Next mission in a favourite subject' : 'Next unfinished lesson in this world',
      priority: preferences.favouriteSubjects.includes(subject) ? 60 : 40,
      quizQuestions: quizzes.filter((question) => question.lessonId === nextLesson.id).length,
    })
  }

  return [...queue.values()]
    .sort((a, b) => b.priority - a.priority || a.lesson.order - b.lesson.order)
    .slice(0, Math.max(1, limit))
}

export function getDailyChallenge() {
  const queue = getPracticeQueue(20)
  const candidates = queue.length ? queue : lessons
    .slice()
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order)
    .map((lesson) => ({
      lesson,
      reason: 'Daily discovery mission',
      priority: 10,
      quizQuestions: quizzes.filter((question) => question.lessonId === lesson.id).length,
    }))
  const now = new Date()
  const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000)
  return candidates[dayNumber % candidates.length]
}

export function getWeakestSubjects(limit = 3) {
  return getSubjectInsights()
    .filter((item) => item.quizAttempts > 0 && item.averageScore !== null && item.averageScore < 80)
    .sort((a, b) => (a.averageScore ?? 101) - (b.averageScore ?? 101))
    .slice(0, limit)
}

export function getStrongestSubjects(limit = 3) {
  return getSubjectInsights()
    .filter((item) => item.quizAttempts > 0 && item.averageScore !== null)
    .sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1))
    .slice(0, limit)
}

export function getRecentQuizTrend(limit = 6) {
  return storage.getQuizAttempts()
    .slice()
    .sort((a, b) => b.attemptDate - a.attemptDate)
    .slice(0, limit)
    .reverse()
}
