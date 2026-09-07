import { lessons, type Lesson } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage, type QuizAttempt } from './storage'

export type LearnerMasteryState = 'needs_practice' | 'building' | 'secure' | 'challenge_ready'

export interface LessonMastery {
  lesson: Lesson
  state: LearnerMasteryState
  latestScore: number | null
  attemptCount: number
  prerequisite: Lesson | null
  prerequisiteSecure: boolean
  misconceptionSignal: boolean
  recommendationReason: string
  recommendationReasonTamil: string
  nextAction: 'remediate' | 'practice' | 'continue' | 'challenge'
  quizQuestions: number
}

function attemptsForLesson(attempts: QuizAttempt[], lessonId: string) {
  return attempts
    .filter((attempt) => attempt.lessonId === lessonId)
    .slice()
    .sort((a, b) => a.attemptDate - b.attemptDate)
}

function previousLesson(lesson: Lesson) {
  return lessons
    .filter((candidate) => candidate.subject === lesson.subject && candidate.order < lesson.order)
    .sort((a, b) => b.order - a.order)[0] ?? null
}

function latestScore(attempts: QuizAttempt[]) {
  return attempts.length ? attempts[attempts.length - 1].percentage : null
}

function isSecure(score: number | null) {
  return score !== null && score >= 80
}

export function getLessonMastery(): LessonMastery[] {
  const attempts = storage.getQuizAttempts()
  const progress = storage.getLessonsProgress()

  return lessons.map((lesson) => {
    const lessonAttempts = attemptsForLesson(attempts, lesson.id)
    const latest = latestScore(lessonAttempts)
    const prerequisite = previousLesson(lesson)
    const prerequisiteAttempts = prerequisite ? attemptsForLesson(attempts, prerequisite.id) : []
    const prerequisiteLatest = latestScore(prerequisiteAttempts)
    const prerequisiteSecure = !prerequisite || isSecure(prerequisiteLatest) || Boolean(progress[prerequisite.id]?.completed)
    const recentScores = lessonAttempts.slice(-2).map((attempt) => attempt.percentage)
    const misconceptionSignal = recentScores.length >= 2 && recentScores.every((score) => score < 60)

    let state: LearnerMasteryState = 'building'
    let nextAction: LessonMastery['nextAction'] = 'continue'
    let recommendationReason = 'You have not built enough assessment evidence for this lesson yet.'
    let recommendationReasonTamil = 'இந்தப் பாடத்திற்கு இன்னும் போதுமான மதிப்பீட்டு சான்றுகள் உருவாகவில்லை.'

    if (latest !== null && latest < 60) {
      state = 'needs_practice'
      nextAction = 'remediate'
      recommendationReason = misconceptionSignal
        ? 'Kiki saw repeated difficulty here, so a focused review comes before the next step.'
        : 'Your latest check was below 60%, so Kiki picked a focused review before moving on.'
      recommendationReasonTamil = misconceptionSignal
        ? 'இந்தப் பகுதியில் தொடர்ந்து சிரமம் இருந்ததால், அடுத்த படிக்கு முன் கவனமான மீள்பார்வையை கிகி தேர்ந்தெடுத்தது.'
        : 'சமீபத்திய மதிப்பீடு 60%-க்கு கீழே இருந்ததால், அடுத்த படிக்கு முன் மீள்பார்வையை கிகி தேர்ந்தெடுத்தது.'
    } else if (latest !== null && latest < 80) {
      state = 'building'
      nextAction = 'practice'
      recommendationReason = 'Your latest check is developing but not yet secure, so one more practice round is useful.'
      recommendationReasonTamil = 'சமீபத்திய மதிப்பீடு முன்னேறுகிறது; இன்னும் உறுதியடைய ஒரு பயிற்சி சுற்று உதவும்.'
    } else if (latest !== null && latest >= 90 && prerequisiteSecure) {
      state = 'challenge_ready'
      nextAction = 'challenge'
      recommendationReason = 'Your recent evidence is strong and the prerequisite path is secure, so Kiki can raise the challenge.'
      recommendationReasonTamil = 'சமீபத்திய சான்றுகள் வலுவாகவும் முன்தேவைப் பாதை உறுதியாகவும் இருப்பதால், கிகி சவாலை உயர்த்துகிறது.'
    } else if (latest !== null && latest >= 80) {
      state = 'secure'
      nextAction = 'continue'
      recommendationReason = prerequisiteSecure
        ? 'Your latest evidence is secure, so Kiki can move you forward without unnecessary repetition.'
        : 'Your score is secure, but the previous lesson still needs evidence before Kiki advances the pathway.'
      recommendationReasonTamil = prerequisiteSecure
        ? 'சமீபத்திய சான்று உறுதியானதால், தேவையற்ற மீளுரைப்பில்லாமல் கிகி அடுத்த படிக்கு நகர்த்துகிறது.'
        : 'மதிப்பெண் உறுதியானது; ஆனால் பாதையை முன்னேற்ற முன்பட்ட பாடத்திற்கு இன்னும் சான்று தேவை.'
    } else if (!prerequisiteSecure) {
      state = 'building'
      nextAction = 'practice'
      recommendationReason = `Kiki picked the earlier ${lesson.subject} step first because this lesson builds on it.`
      recommendationReasonTamil = `இந்தப் பாடம் முன்பட்ட ${lesson.subject} படியை அடிப்படையாகக் கொண்டதால், கிகி அதைப் முதலில் தேர்ந்தெடுத்தது.`
    }

    return {
      lesson,
      state,
      latestScore: latest,
      attemptCount: lessonAttempts.length,
      prerequisite,
      prerequisiteSecure,
      misconceptionSignal,
      recommendationReason,
      recommendationReasonTamil,
      nextAction,
      quizQuestions: quizzes.filter((question) => question.lessonId === lesson.id).length,
    }
  })
}

function recommendationPriority(item: LessonMastery) {
  if (item.state === 'needs_practice') return 100
  if (item.state === 'building' && item.latestScore !== null) return 90
  if (item.state === 'challenge_ready') return 80
  if (item.state === 'secure' && !item.prerequisiteSecure) return 75
  if (item.state === 'building' && !item.prerequisiteSecure) return 60
  if (item.state === 'building') return 50
  return 20
}

export function getRecommendedMasteryItems(limit = 8) {
  return getLessonMastery()
    .filter((item) => item.quizQuestions > 0)
    .sort((a, b) => recommendationPriority(b) - recommendationPriority(a) || a.lesson.subject.localeCompare(b.lesson.subject) || a.lesson.order - b.lesson.order)
    .slice(0, Math.max(1, limit))
}

export function getMasterySummary() {
  const items = getLessonMastery()
  return (['needs_practice', 'building', 'secure', 'challenge_ready'] as LearnerMasteryState[]).map((state) => ({
    state,
    count: items.filter((item) => item.state === state).length,
  }))
}
