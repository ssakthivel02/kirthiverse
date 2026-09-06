import { kvsMathLessons, kvsMathQuizzes } from './kvsProductionMath'
import { kvsTamilLessons, kvsTamilQuizzes } from './kvsProductionTamil'
import { kvsEnglishLessons, kvsEnglishQuizzes } from './kvsProductionEnglish'
import { kvsCodingLessons, kvsCodingQuizzes } from './kvsProductionCoding'

// Safe first production tranche from KVS-STAGING-2026-09 B37-B38.
// B39 science/biology remains deliberately blocked pending authoritative source verification.
export const kvsProductionLessons = [
  ...kvsMathLessons,
  ...kvsTamilLessons,
  ...kvsEnglishLessons,
  ...kvsCodingLessons,
]

export const kvsProductionQuizzes = [
  ...kvsMathQuizzes,
  ...kvsTamilQuizzes,
  ...kvsEnglishQuizzes,
  ...kvsCodingQuizzes,
]

export const kvsProductionSeed = {
  baseline: 'KVS-STAGING-2026-09-B39',
  sourceBatches: ['B37', 'B38'],
  blockedBatch: 'B39',
  lessons: kvsProductionLessons.length,
  questions: kvsProductionQuizzes.length,
} as const
