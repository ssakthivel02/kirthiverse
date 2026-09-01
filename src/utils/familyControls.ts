import { lessons } from '../content/lessons'
import { storage } from './storage'

export interface FamilyGoals {
  weeklyLessons: 2 | 3 | 5 | 7
  weeklyQuizzes: 1 | 2 | 3 | 5
  weeklyMinutes: 30 | 60 | 90 | 120
  focusSubjects: string[]
  breakEveryMinutes: 15 | 20 | 30
  sessionLimitMinutes: 20 | 30 | 45 | 60
  updatedAt: number
}

export interface LearningSession {
  id: string
  startedAt: number
  endedAt: number
  minutes: number
}

export interface DayActivity {
  key: string
  label: string
  lessonCount: number
  quizCount: number
  sessionMinutes: number
  estimatedMinutes: number
}

const GOALS_KEY = 'kvs_family_goals'
const SESSIONS_KEY = 'kvs_learning_sessions'
const SESSION_RETENTION_DAYS = 90

const defaultGoals = (): FamilyGoals => ({
  weeklyLessons: 3,
  weeklyQuizzes: 2,
  weeklyMinutes: 60,
  focusSubjects: [],
  breakEveryMinutes: 20,
  sessionLimitMinutes: 30,
  updatedAt: Date.now(),
})

function available() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function read(key: string): unknown {
  if (!available()) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  if (!available()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validChoice<T extends number>(value: unknown, choices: readonly T[], fallback: T): T {
  return typeof value === 'number' && choices.includes(value as T) ? value as T : fallback
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfWeek() {
  const date = startOfToday()
  const day = date.getDay()
  const distance = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - distance)
  return date
}

function safeSessions(value: unknown): LearningSession[] {
  if (!Array.isArray(value)) return []
  const cutoff = Date.now() - SESSION_RETENTION_DAYS * 86400000
  return value
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id.slice(0, 80) : '',
      startedAt: typeof item.startedAt === 'number' ? item.startedAt : 0,
      endedAt: typeof item.endedAt === 'number' ? item.endedAt : 0,
      minutes: typeof item.minutes === 'number' ? Math.max(0, Math.min(240, Math.round(item.minutes))) : 0,
    }))
    .filter((item) => item.id && item.startedAt >= cutoff && item.endedAt >= item.startedAt && item.minutes > 0)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 500)
}

export function getFamilyGoals(): FamilyGoals {
  const defaults = defaultGoals()
  const value = read(GOALS_KEY)
  if (!isRecord(value)) return defaults
  const subjects = new Set(lessons.map((lesson) => lesson.subject))
  return {
    weeklyLessons: validChoice(value.weeklyLessons, [2, 3, 5, 7] as const, defaults.weeklyLessons),
    weeklyQuizzes: validChoice(value.weeklyQuizzes, [1, 2, 3, 5] as const, defaults.weeklyQuizzes),
    weeklyMinutes: validChoice(value.weeklyMinutes, [30, 60, 90, 120] as const, defaults.weeklyMinutes),
    focusSubjects: Array.isArray(value.focusSubjects)
      ? [...new Set(value.focusSubjects.filter((item): item is string => typeof item === 'string' && subjects.has(item)))].slice(0, 3)
      : [],
    breakEveryMinutes: validChoice(value.breakEveryMinutes, [15, 20, 30] as const, defaults.breakEveryMinutes),
    sessionLimitMinutes: validChoice(value.sessionLimitMinutes, [20, 30, 45, 60] as const, defaults.sessionLimitMinutes),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : defaults.updatedAt,
  }
}

export function setFamilyGoals(goals: FamilyGoals) {
  return write(GOALS_KEY, { ...goals, focusSubjects: goals.focusSubjects.slice(0, 3), updatedAt: Date.now() })
}

export function getLearningSessions() {
  return safeSessions(read(SESSIONS_KEY))
}

export function recordLearningSession(startedAt: number, endedAt = Date.now()) {
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt <= startedAt) return false
  const minutes = Math.max(1, Math.min(240, Math.round((endedAt - startedAt) / 60000)))
  const sessions = getLearningSessions()
  sessions.unshift({
    id: `${startedAt}-${Math.random().toString(36).slice(2, 9)}`,
    startedAt,
    endedAt,
    minutes,
  })
  return write(SESSIONS_KEY, sessions.slice(0, 500))
}

export function clearLearningSessions() {
  if (!available()) return false
  window.localStorage.removeItem(SESSIONS_KEY)
  return true
}

export function getSevenDayActivity(): DayActivity[] {
  const progress = storage.getLessonsProgress()
  const attempts = storage.getQuizAttempts()
  const sessions = getLearningSessions()
  const days: DayActivity[] = []
  const today = startOfToday()

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = dayKey(date.getTime())
    const completedLessons = Object.entries(progress)
      .filter(([, item]) => item.completedDate && dayKey(item.completedDate) === key)
      .map(([id]) => lessons.find((lesson) => lesson.id === id))
      .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
    const quizCount = attempts.filter((attempt) => dayKey(attempt.attemptDate) === key).length
    const sessionMinutes = sessions.filter((session) => dayKey(session.startedAt) === key).reduce((sum, session) => sum + session.minutes, 0)
    const contentMinutes = completedLessons.reduce((sum, lesson) => sum + lesson.duration, 0) + quizCount * 5

    days.push({
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      lessonCount: completedLessons.length,
      quizCount,
      sessionMinutes,
      estimatedMinutes: Math.max(contentMinutes, sessionMinutes),
    })
  }

  return days
}

export function getWeeklyGoalProgress() {
  const goals = getFamilyGoals()
  const start = startOfWeek().getTime()
  const progress = storage.getLessonsProgress()
  const attempts = storage.getQuizAttempts()
  const sessions = getLearningSessions()
  const completedLessons = Object.values(progress).filter((item) => item.completedDate && item.completedDate >= start).length
  const quizAttempts = attempts.filter((attempt) => attempt.attemptDate >= start).length
  const sessionMinutes = sessions.filter((session) => session.startedAt >= start).reduce((sum, session) => sum + session.minutes, 0)
  const estimatedLessonMinutes = Object.entries(progress)
    .filter(([, item]) => item.completedDate && item.completedDate >= start)
    .reduce((sum, [id]) => sum + (lessons.find((lesson) => lesson.id === id)?.duration ?? 0), 0)
  const estimatedMinutes = Math.max(sessionMinutes, estimatedLessonMinutes + quizAttempts * 5)
  const activeDays = new Set([
    ...Object.values(progress).filter((item) => item.completedDate && item.completedDate >= start).map((item) => dayKey(item.completedDate ?? start)),
    ...attempts.filter((attempt) => attempt.attemptDate >= start).map((attempt) => dayKey(attempt.attemptDate)),
    ...sessions.filter((session) => session.startedAt >= start).map((session) => dayKey(session.startedAt)),
  ]).size

  return {
    goals,
    completedLessons,
    quizAttempts,
    estimatedMinutes,
    activeDays,
    lessonPercent: Math.min(100, Math.round((completedLessons / goals.weeklyLessons) * 100)),
    quizPercent: Math.min(100, Math.round((quizAttempts / goals.weeklyQuizzes) * 100)),
    minutesPercent: Math.min(100, Math.round((estimatedMinutes / goals.weeklyMinutes) * 100)),
  }
}
