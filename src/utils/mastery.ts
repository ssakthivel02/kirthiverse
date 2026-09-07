import { learningLessonIndex, type LearningLessonIndexItem } from '../content/learningIndex.generated'
import { getExplicitPrerequisites } from '../content/lessonPrerequisites'
import { storage, type QuizAttempt } from './storage'

export type LearnerMasteryState = 'needs_practice' | 'building' | 'secure' | 'challenge_ready'

export interface LessonMastery {
  lesson: LearningLessonIndexItem
  state: LearnerMasteryState
  latestScore: number | null
  attemptCount: number
  prerequisite: LearningLessonIndexItem | null
  prerequisites: LearningLessonIndexItem[]
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

function previousLesson(lesson: LearningLessonIndexItem) {
  return learningLessonIndex
    .filter((candidate) => candidate.subject === lesson.subject && candidate.order < lesson.order)
    .sort((a, b) => b.order - a.order)[0] ?? null
}

function prerequisitesForLesson(lesson: LearningLessonIndexItem) {
  const explicit = getExplicitPrerequisites(lesson, learningLessonIndex)
  if (explicit.length) return explicit
  const fallback = previousLesson(lesson)
  return fallback ? [fallback] : []
}

function latestScore(attempts: QuizAttempt[]) {
  return attempts.length ? attempts[attempts.length - 1].percentage : null
}

function isSecure(score: number | null) {
  return score !== null && score >= 80
}

function prerequisiteIsSecure(prerequisite: LearningLessonIndexItem, attempts: QuizAttempt[], progress: ReturnType<typeof storage.getLessonsProgress>) {
  const latest = latestScore(attemptsForLesson(attempts, prerequisite.id))
  return isSecure(latest) || Boolean(progress[prerequisite.id]?.completed)
}

export function getLessonMastery(): LessonMastery[] {
  const attempts = storage.getQuizAttempts()
  const progress = storage.getLessonsProgress()

  return learningLessonIndex.map((lesson) => {
    const lessonAttempts = attemptsForLesson(attempts, lesson.id)
    const latest = latestScore(lessonAttempts)
    const prerequisites = prerequisitesForLesson(lesson)
    const prerequisite = prerequisites[0] ?? null
    const prerequisiteSecure = prerequisites.every((item) => prerequisiteIsSecure(item, attempts, progress))
    const recentScores = lessonAttempts.slice(-2).map((attempt) => attempt.percentage)
    const misconceptionSignal = recentScores.length >= 2 && recentScores.every((score) => score < 60)
    const prerequisiteLabel = prerequisites.length > 1 ? 'prerequisite lessons' : 'prerequisite lesson'
    const prerequisiteLabelTamil = prerequisites.length > 1 ? 'முன்தேவைப் பாடங்கள்' : 'முன்தேவைப் பாடம்'

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
        : `Your score is secure, but the ${prerequisiteLabel} still need evidence before Kiki advances the pathway.`
      recommendationReasonTamil = prerequisiteSecure
        ? 'சமீபத்திய சான்று உறுதியானதால், தேவையற்ற மீளுரைப்பில்லாமல் கிகி அடுத்த படிக்கு நகர்த்துகிறது.'
        : `மதிப்பெண் உறுதியானது; ஆனால் பாதையை முன்னேற்ற ${prerequisiteLabelTamil} இன்னும் சான்று தேவை.`
    } else if (!prerequisiteSecure) {
      state = 'building'
      nextAction = 'practice'
      const names = prerequisites.map((item) => item.title).join(', ')
      recommendationReason = `Kiki picked prerequisite learning first because this lesson builds on ${names}.`
      recommendationReasonTamil = `இந்தப் பாடம் ${names} மீது கட்டமைக்கப்படுவதால், கிகி முதலில் முன்தேவை கற்றலைத் தேர்ந்தெடுத்தது.`
    }

    return {
      lesson,
      state,
      latestScore: latest,
      attemptCount: lessonAttempts.length,
      prerequisite,
      prerequisites,
      prerequisiteSecure,
      misconceptionSignal,
      recommendationReason,
      recommendationReasonTamil,
      nextAction,
      quizQuestions: lesson.quizQuestions,
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
