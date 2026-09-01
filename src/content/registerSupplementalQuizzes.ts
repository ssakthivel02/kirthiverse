import { quizzes } from './quizzes'
import { supplementalQuizzes } from './supplementalQuizzes'

const existingIds = new Set(quizzes.map((question) => question.id))
const existingLessonIds = new Set(quizzes.map((question) => question.lessonId))

for (const question of supplementalQuizzes) {
  if (existingIds.has(question.id)) continue
  if (existingLessonIds.has(question.lessonId)) continue
  quizzes.push(question)
  existingIds.add(question.id)
  existingLessonIds.add(question.lessonId)
}
