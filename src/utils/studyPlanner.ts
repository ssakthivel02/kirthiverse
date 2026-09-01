import { getFamilyGoals } from './familyControls'
import { getPracticeQueue } from './learningInsights'
import { lessons, type Lesson } from '../content/lessons'
import { quizzes } from '../content/quizzes'

export interface StudyPlanItem {
  id: string
  dateKey: string
  dayLabel: string
  dateLabel: string
  lesson: Lesson
  reason: string
  hasQuiz: boolean
  estimatedMinutes: number
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function buildSevenDayStudyPlan(): StudyPlanItem[] {
  const goals = getFamilyGoals()
  const queue = getPracticeQueue(30)
  const focus = goals.focusSubjects
  const prioritised = [
    ...queue.filter((item) => focus.includes(item.lesson.subject)),
    ...queue.filter((item) => !focus.includes(item.lesson.subject)),
  ]
  const fallback = lessons
    .slice()
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order)
    .map((lesson) => ({ lesson, reason: 'Continue exploring this Learning World' }))
  const candidates = prioritised.length ? prioritised : fallback
  const targetActivities = Math.max(3, Math.min(7, goals.weeklyLessons + goals.weeklyQuizzes))
  const today = startOfToday()
  const result: StudyPlanItem[] = []
  const used = new Set<string>()

  for (let offset = 0; offset < 7 && result.length < targetActivities; offset += 1) {
    const candidate = candidates.find((item) => !used.has(item.lesson.id))
    if (!candidate) break
    used.add(candidate.lesson.id)
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    const hasQuiz = quizzes.some((question) => question.lessonId === candidate.lesson.id)
    result.push({
      id: `${dayKey(date)}:${candidate.lesson.id}`,
      dateKey: dayKey(date),
      dayLabel: date.toLocaleDateString(undefined, { weekday: 'long' }),
      dateLabel: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      lesson: candidate.lesson,
      reason: candidate.reason,
      hasQuiz,
      estimatedMinutes: candidate.lesson.duration + (hasQuiz ? 5 : 0),
    })
  }

  return result
}

export function getStudyPlanSummary() {
  const items = buildSevenDayStudyPlan()
  return {
    items,
    totalActivities: items.length,
    estimatedMinutes: items.reduce((sum, item) => sum + item.estimatedMinutes, 0),
    subjects: [...new Set(items.map((item) => item.lesson.subject))],
    quizActivities: items.filter((item) => item.hasQuiz).length,
  }
}
