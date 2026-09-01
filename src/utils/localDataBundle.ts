import { lessons } from '../content/lessons'
import { clearLearningSessions, getFamilyGoals, getLearningSessions, recordLearningSession, setFamilyGoals, type FamilyGoals } from './familyControls'
import { clearLearningNotes, getLearningNotes, getLearningNotesStorageKey } from './learningNotes'
import { clearMistakeBank, getMistakeRecords, getMistakeStorageKey } from './mistakeBank'
import { storage } from './storage'

const FAMILY_GOALS_KEY = 'kvs_family_goals'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validChoice<T extends number>(value: unknown, choices: readonly T[], fallback: T): T {
  return typeof value === 'number' && choices.includes(value as T) ? value as T : fallback
}

function safeGoals(value: unknown): FamilyGoals | null {
  if (!isRecord(value)) return null
  const defaults = getFamilyGoals()
  const validSubjects = new Set(lessons.map((lesson) => lesson.subject))
  return {
    weeklyLessons: validChoice(value.weeklyLessons, [2, 3, 5, 7] as const, defaults.weeklyLessons),
    weeklyQuizzes: validChoice(value.weeklyQuizzes, [1, 2, 3, 5] as const, defaults.weeklyQuizzes),
    weeklyMinutes: validChoice(value.weeklyMinutes, [30, 60, 90, 120] as const, defaults.weeklyMinutes),
    focusSubjects: Array.isArray(value.focusSubjects)
      ? [...new Set(value.focusSubjects.filter((item): item is string => typeof item === 'string' && validSubjects.has(item)))].slice(0, 3)
      : [],
    breakEveryMinutes: validChoice(value.breakEveryMinutes, [15, 20, 30] as const, defaults.breakEveryMinutes),
    sessionLimitMinutes: validChoice(value.sessionLimitMinutes, [20, 30, 45, 60] as const, defaults.sessionLimitMinutes),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  }
}

export function getAllLocalData() {
  return {
    ...storage.getAllData(),
    familyControls: {
      version: 1,
      goals: getFamilyGoals(),
      sessions: getLearningSessions(),
    },
    reviewData: {
      version: 1,
      mistakes: getMistakeRecords(),
      learningNotes: getLearningNotes(),
    },
  }
}

export function exportAllLocalData() {
  return JSON.stringify(getAllLocalData(), null, 2)
}

export function importAllLocalData(json: string) {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!isRecord(parsed)) return false
    if (!storage.importData(json)) return false

    if (isRecord(parsed.familyControls)) {
      const goals = safeGoals(parsed.familyControls.goals)
      if (goals) setFamilyGoals(goals)
      clearLearningSessions()
      if (Array.isArray(parsed.familyControls.sessions)) {
        for (const item of parsed.familyControls.sessions.slice(0, 500)) {
          if (!isRecord(item)) continue
          const startedAt = typeof item.startedAt === 'number' ? item.startedAt : 0
          const endedAt = typeof item.endedAt === 'number' ? item.endedAt : 0
          if (startedAt > 0 && endedAt > startedAt) recordLearningSession(startedAt, endedAt)
        }
      }
    }

    if (typeof window !== 'undefined' && isRecord(parsed.reviewData)) {
      if (Array.isArray(parsed.reviewData.mistakes)) {
        window.localStorage.setItem(getMistakeStorageKey(), JSON.stringify(parsed.reviewData.mistakes.slice(0, 200)))
      }
      if (Array.isArray(parsed.reviewData.learningNotes)) {
        window.localStorage.setItem(getLearningNotesStorageKey(), JSON.stringify(parsed.reviewData.learningNotes.slice(0, 100)))
      }
    }
    return true
  } catch {
    return false
  }
}

export function clearAllLocalData() {
  storage.clearAllData()
  clearLearningSessions()
  clearMistakeBank()
  clearLearningNotes()
  if (typeof window !== 'undefined') window.localStorage.removeItem(FAMILY_GOALS_KEY)
}
