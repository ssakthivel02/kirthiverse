export interface LearnerProfile {
  name: string
  grade: string
  avatar: string
  joinDate: number
}

export interface LearnerPreferences {
  ageBand: '3-5' | '6-8' | '9-11' | '12-16'
  language: 'English' | 'Tamil'
  learningLevel: 'Starter' | 'Explorer' | 'Challenger'
  dailyGoal: 1 | 2 | 3
  favouriteSubjects: string[]
  reducedMotion: boolean
  largerText: boolean
}

export interface TeacherPlan {
  className: string
  focusSubject: string
  assignmentTitle: string
  dueDate: string
  notes: string
  updatedAt: number
}

export interface LessonProgress {
  completed: boolean
  bookmarked: boolean
  completedDate: number | null
}

export interface QuizAttempt {
  quizId: string
  lessonId?: string
  subject?: string
  score: number
  totalQuestions: number
  percentage: number
  attemptDate: number
  answers?: Record<number, string | number>
}

export interface Stats {
  completedLessons: number
  totalAttempts: number
  averageScore: number
  totalXP: number
  currentStreak: number
  longestStreak: number
  achievements: number
  lastActiveDate: string | null
  bookmarks: number
  awardedQuizIds: string[]
}

const STORAGE_VERSION = 2
const KEYS = {
  profile: 'kvs_profile',
  preferences: 'kvs_preferences',
  teacherPlan: 'kvs_teacher_plan',
  bookmarks: 'kvs_bookmarks',
  progress: 'kvs_lessons_progress',
  stats: 'kvs_stats',
  attempts: 'kvs_quiz_attempts',
} as const

const defaultProfile = (): LearnerProfile => ({ name: 'Learner', grade: '5', avatar: '🚀', joinDate: Date.now() })
const defaultPreferences = (): LearnerPreferences => ({
  ageBand: '9-11',
  language: 'English',
  learningLevel: 'Explorer',
  dailyGoal: 1,
  favouriteSubjects: [],
  reducedMotion: false,
  largerText: false,
})
const defaultTeacherPlan = (): TeacherPlan => ({
  className: '',
  focusSubject: 'Mathematics',
  assignmentTitle: '',
  dueDate: '',
  notes: '',
  updatedAt: Date.now(),
})
const defaultStats = (): Stats => ({
  completedLessons: 0,
  totalAttempts: 0,
  averageScore: 0,
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  achievements: 0,
  lastActiveDate: null,
  bookmarks: 0,
  awardedQuizIds: [],
})

function available() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function read(key: string): unknown {
  if (!available()) return null
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : null
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

function safeString(value: unknown, fallback: string, limit = 80) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : fallback
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function safeBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dayDistance(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function sameLocalDay(timestamp: number, reference = new Date()) {
  const value = new Date(timestamp)
  return value.getFullYear() === reference.getFullYear() && value.getMonth() === reference.getMonth() && value.getDate() === reference.getDate()
}

export const storage = {
  setProfile(profile: LearnerProfile) {
    return write(KEYS.profile, profile)
  },

  getProfile(): LearnerProfile | null {
    const value = read(KEYS.profile)
    if (!isRecord(value)) return null
    return {
      name: safeString(value.name, 'Learner'),
      grade: safeString(value.grade, '5'),
      avatar: safeString(value.avatar, '🚀'),
      joinDate: safeNumber(value.joinDate, Date.now()),
    }
  },

  initializeProfile(name: string, grade: string, avatar: string) {
    const profile = {
      name: safeString(name, 'Learner'),
      grade: safeString(grade, '5'),
      avatar: safeString(avatar, '🚀'),
      joinDate: this.getProfile()?.joinDate ?? Date.now(),
    }
    this.setProfile(profile)
    return profile
  },

  getPreferences(): LearnerPreferences {
    const value = read(KEYS.preferences)
    const defaults = defaultPreferences()
    if (!isRecord(value)) return defaults
    const ageBand = ['3-5', '6-8', '9-11', '12-16'].includes(String(value.ageBand)) ? String(value.ageBand) as LearnerPreferences['ageBand'] : defaults.ageBand
    const language = value.language === 'Tamil' ? 'Tamil' : 'English'
    const learningLevel = ['Starter', 'Explorer', 'Challenger'].includes(String(value.learningLevel)) ? String(value.learningLevel) as LearnerPreferences['learningLevel'] : defaults.learningLevel
    const dailyGoalValue = safeNumber(value.dailyGoal, defaults.dailyGoal)
    const dailyGoal = ([1, 2, 3].includes(dailyGoalValue) ? dailyGoalValue : defaults.dailyGoal) as LearnerPreferences['dailyGoal']
    const favouriteSubjects = Array.isArray(value.favouriteSubjects)
      ? [...new Set(value.favouriteSubjects.filter((item): item is string => typeof item === 'string').map((item) => item.slice(0, 40)))].slice(0, 10)
      : []
    return {
      ageBand,
      language,
      learningLevel,
      dailyGoal,
      favouriteSubjects,
      reducedMotion: safeBoolean(value.reducedMotion),
      largerText: safeBoolean(value.largerText),
    }
  },

  setPreferences(preferences: LearnerPreferences) {
    return write(KEYS.preferences, preferences)
  },

  getTeacherPlan(): TeacherPlan {
    const value = read(KEYS.teacherPlan)
    if (!isRecord(value)) return defaultTeacherPlan()
    return {
      className: safeString(value.className, '', 60),
      focusSubject: safeString(value.focusSubject, 'Mathematics', 40),
      assignmentTitle: safeString(value.assignmentTitle, '', 100),
      dueDate: safeString(value.dueDate, '', 20),
      notes: safeString(value.notes, '', 500),
      updatedAt: safeNumber(value.updatedAt, Date.now()),
    }
  },

  setTeacherPlan(plan: TeacherPlan) {
    return write(KEYS.teacherPlan, { ...plan, updatedAt: Date.now() })
  },

  getLessonsProgress(): Record<string, LessonProgress> {
    const value = read(KEYS.progress)
    if (!isRecord(value)) return {}
    const result: Record<string, LessonProgress> = {}
    for (const [id, item] of Object.entries(value)) {
      if (isRecord(item)) {
        result[id] = {
          completed: item.completed === true,
          bookmarked: item.bookmarked === true,
          completedDate: typeof item.completedDate === 'number' ? item.completedDate : null,
        }
      }
    }
    return result
  },

  getLessonProgress(id: string) {
    return this.getLessonsProgress()[id] ?? null
  },

  saveLessonProgress(id: string, progress: LessonProgress) {
    const all = this.getLessonsProgress()
    all[id] = progress
    return write(KEYS.progress, all)
  },

  markLessonComplete(id: string) {
    const current = this.getLessonProgress(id) ?? { completed: false, bookmarked: false, completedDate: null }
    if (current.completed) return false
    this.saveLessonProgress(id, { ...current, completed: true, completedDate: Date.now() })
    this.addXP(50)
    this.updateStreak()
    return true
  },

  getBookmarks(): string[] {
    const value = read(KEYS.bookmarks)
    return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : []
  },

  bookmarkLesson(id: string) {
    const items = this.getBookmarks()
    if (items.includes(id)) return false
    items.push(id)
    write(KEYS.bookmarks, items)
    const progress = this.getLessonProgress(id) ?? { completed: false, bookmarked: false, completedDate: null }
    this.saveLessonProgress(id, { ...progress, bookmarked: true })
    return true
  },

  unbookmarkLesson(id: string) {
    write(KEYS.bookmarks, this.getBookmarks().filter((item) => item !== id))
    const progress = this.getLessonProgress(id)
    if (progress) this.saveLessonProgress(id, { ...progress, bookmarked: false })
  },

  getQuizAttempts(): QuizAttempt[] {
    const value = read(KEYS.attempts)
    if (!Array.isArray(value)) return []
    return value.filter(isRecord).map((item) => ({
      quizId: safeString(item.quizId, 'quiz'),
      lessonId: typeof item.lessonId === 'string' ? item.lessonId : undefined,
      subject: typeof item.subject === 'string' ? item.subject : undefined,
      score: safeNumber(item.score),
      totalQuestions: Math.max(1, safeNumber(item.totalQuestions, 1)),
      percentage: Math.max(0, Math.min(100, safeNumber(item.percentage, Math.round(safeNumber(item.score) / Math.max(1, safeNumber(item.totalQuestions, 1)) * 100)))),
      attemptDate: safeNumber(item.attemptDate, Date.now()),
    }))
  },

  recordQuizAttempt(attempt: QuizAttempt) {
    const attempts = this.getQuizAttempts()
    attempts.push(attempt)
    write(KEYS.attempts, attempts)
    const stats = this.getStats()
    const percentages = attempts.map((item) => item.percentage)
    stats.totalAttempts = attempts.length
    stats.averageScore = percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0
    const rewardKey = attempt.lessonId ?? attempt.quizId
    if (!stats.awardedQuizIds.includes(rewardKey)) {
      stats.awardedQuizIds.push(rewardKey)
      stats.totalXP += Math.round(attempt.percentage / 2)
    }
    this.updateStreak(stats)
    write(KEYS.stats, stats)
    return true
  },

  addXP(amount: number) {
    const stats = this.getStats()
    stats.totalXP += Math.max(0, Math.round(amount))
    write(KEYS.stats, stats)
  },

  updateStreak(existing?: Stats) {
    const stats = existing ?? this.getStats()
    const today = dayKey()
    if (stats.lastActiveDate === today) return false
    if (!stats.lastActiveDate) stats.currentStreak = 1
    else {
      const diff = dayDistance(stats.lastActiveDate, today)
      stats.currentStreak = diff === 1 ? stats.currentStreak + 1 : 1
    }
    stats.lastActiveDate = today
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak)
    if (!existing) write(KEYS.stats, stats)
    return true
  },

  getStats(): Stats {
    const raw = read(KEYS.stats)
    const base = defaultStats()
    const value = isRecord(raw) ? raw : {}
    const attempts = this.getQuizAttempts()
    const progress = this.getLessonsProgress()
    const bookmarks = this.getBookmarks()
    return {
      ...base,
      totalXP: Math.max(0, safeNumber(value.totalXP)),
      currentStreak: Math.max(0, safeNumber(value.currentStreak)),
      longestStreak: Math.max(0, safeNumber(value.longestStreak)),
      achievements: Math.max(0, safeNumber(value.achievements)),
      lastActiveDate: typeof value.lastActiveDate === 'string' ? value.lastActiveDate : null,
      awardedQuizIds: Array.isArray(value.awardedQuizIds) ? value.awardedQuizIds.filter((x): x is string => typeof x === 'string') : [],
      completedLessons: Object.values(progress).filter((item) => item.completed).length,
      totalAttempts: attempts.length,
      averageScore: attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length) : 0,
      bookmarks: bookmarks.length,
    }
  },

  getTodayActivity() {
    const progress = this.getLessonsProgress()
    const attempts = this.getQuizAttempts()
    const completedLessons = Object.values(progress).filter((item) => item.completedDate && sameLocalDay(item.completedDate)).length
    const quizAttempts = attempts.filter((item) => sameLocalDay(item.attemptDate)).length
    return {
      completedLessons,
      quizAttempts,
      activities: completedLessons + quizAttempts,
    }
  },

  getRecentActivity(limit = 8) {
    const lessonEvents = Object.entries(this.getLessonsProgress())
      .filter(([, item]) => item.completed && item.completedDate)
      .map(([id, item]) => ({ type: 'lesson' as const, id, timestamp: item.completedDate ?? 0 }))
    const quizEvents = this.getQuizAttempts().map((item) => ({
      type: 'quiz' as const,
      id: item.quizId,
      timestamp: item.attemptDate,
      percentage: item.percentage,
      subject: item.subject,
    }))
    return [...lessonEvents, ...quizEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)
  },

  getAllData() {
    return {
      version: STORAGE_VERSION,
      profile: this.getProfile() ?? defaultProfile(),
      preferences: this.getPreferences(),
      teacherPlan: this.getTeacherPlan(),
      bookmarks: this.getBookmarks(),
      lessonsProgress: this.getLessonsProgress(),
      stats: this.getStats(),
      quizAttempts: this.getQuizAttempts(),
    }
  },

  exportData() {
    return JSON.stringify(this.getAllData(), null, 2)
  },

  importData(json: string) {
    if (!available()) return false
    try {
      const data: unknown = JSON.parse(json)
      if (!isRecord(data) || data.version !== STORAGE_VERSION || !isRecord(data.profile) || !Array.isArray(data.bookmarks) || !isRecord(data.lessonsProgress) || !isRecord(data.stats) || !Array.isArray(data.quizAttempts)) return false
      const profile = {
        name: safeString(data.profile.name, 'Learner'),
        grade: safeString(data.profile.grade, '5'),
        avatar: safeString(data.profile.avatar, '🚀'),
        joinDate: safeNumber(data.profile.joinDate, Date.now()),
      }
      const bookmarks = data.bookmarks.filter((x): x is string => typeof x === 'string')
      write(KEYS.profile, profile)
      write(KEYS.bookmarks, [...new Set(bookmarks)])
      write(KEYS.progress, data.lessonsProgress)
      write(KEYS.stats, data.stats)
      write(KEYS.attempts, data.quizAttempts)
      if (isRecord(data.preferences)) write(KEYS.preferences, data.preferences)
      if (isRecord(data.teacherPlan)) write(KEYS.teacherPlan, data.teacherPlan)
      return true
    } catch {
      return false
    }
  },

  clearAllData() {
    if (!available()) return
    Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key))
  },

  getStorageVersion() {
    return STORAGE_VERSION
  },
}
