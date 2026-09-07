import { kvsMathLessons, kvsMathQuizzes } from './kvsProductionMath'
import { kvsTamilLessons, kvsTamilQuizzes } from './kvsProductionTamil'
import { kvsEnglishLessons, kvsEnglishQuizzes } from './kvsProductionEnglish'
import { kvsCodingLessons, kvsCodingQuizzes } from './kvsProductionCoding'
import { kvsScienceLessons, kvsScienceQuizzes } from './kvsProductionScience'

// Production-safe tranche from KVS-STAGING-2026-09 B37-B39.
// B39 science entered this bundle only after authoritative source reconciliation.
export const kvsProductionLessons = [
  ...kvsMathLessons,
  ...kvsTamilLessons,
  ...kvsEnglishLessons,
  ...kvsCodingLessons,
  ...kvsScienceLessons,
]

export const kvsProductionQuizzes = [
  ...kvsMathQuizzes,
  ...kvsTamilQuizzes,
  ...kvsEnglishQuizzes,
  ...kvsCodingQuizzes,
  ...kvsScienceQuizzes,
]

export const kvsProductionSeed = {
  baseline: 'KVS-STAGING-2026-09-B39-SOURCE-VERIFIED',
  sourceBatches: ['B37', 'B38', 'B39'],
  lessons: kvsProductionLessons.length,
  questions: kvsProductionQuizzes.length,
} as const
