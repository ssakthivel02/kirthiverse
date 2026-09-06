import { lessons } from './lessons'
import { quizzes } from './quizzes'
import { kvsProductionLessons, kvsProductionQuizzes } from './kvsProductionSupplement'

const lessonIds = new Set(lessons.map((lesson) => lesson.id))
for (const lesson of kvsProductionLessons) {
  if (lessonIds.has(lesson.id)) continue
  lessons.push(lesson)
  lessonIds.add(lesson.id)
}

const quizIds = new Set(quizzes.map((question) => question.id))
for (const question of kvsProductionQuizzes) {
  if (quizIds.has(question.id)) continue
  if (!lessonIds.has(question.lessonId)) {
    throw new Error(`[KirthiVerse] KVS production question ${question.id} references missing lesson ${question.lessonId}`)
  }
  quizzes.push(question)
  quizIds.add(question.id)
}
