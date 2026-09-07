import type { Lesson } from './lessons'
import type { QuizQuestion } from './quizzes'

let runtimeReady: Promise<void> | null = null

export function ensureLearningRuntime() {
  if (!runtimeReady) {
    runtimeReady = Promise.all([
      import('./registerSupplementalQuizzes'),
      import('./registerKvsProductionSupplement'),
    ]).then(() => undefined)
  }
  return runtimeReady
}

export async function loadLearningRuntimeData(): Promise<{ lessons: Lesson[]; quizzes: QuizQuestion[] }> {
  await ensureLearningRuntime()
  const [{ lessons }, { quizzes }] = await Promise.all([
    import('./lessons'),
    import('./quizzes'),
  ])
  return { lessons, quizzes }
}
