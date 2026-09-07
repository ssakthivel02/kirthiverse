import { kvsMathLessons, kvsMathQuizzes } from './kvsProductionMath'
import { kvsTamilLessons, kvsTamilQuizzes } from './kvsProductionTamil'
import { kvsEnglishLessons, kvsEnglishQuizzes } from './kvsProductionEnglish'
import { kvsCodingLessons, kvsCodingQuizzes } from './kvsProductionCoding'
import { kvsScienceLessons, kvsScienceQuizzes } from './kvsProductionScience'
import { kvsFoundationLessons, kvsFoundationQuizzes } from './kvsProductionFoundations'

// Controlled production-safe tranches from KVS-STAGING-2026-09.
// B35 foundations and B39 science enter only after source/provenance reconciliation.
export const kvsProductionLessons = [
  ...kvsMathLessons,
  ...kvsTamilLessons,
  ...kvsEnglishLessons,
  ...kvsCodingLessons,
  ...kvsScienceLessons,
  ...kvsFoundationLessons,
]

export const kvsProductionQuizzes = [
  ...kvsMathQuizzes,
  ...kvsTamilQuizzes,
  ...kvsEnglishQuizzes,
  ...kvsCodingQuizzes,
  ...kvsScienceQuizzes,
  ...kvsFoundationQuizzes,
]

export const kvsProductionSeed = {
  baseline: 'KVS-STAGING-2026-09-B39-SOURCE-VERIFIED',
  sourceBatches: ['B35', 'B37', 'B38', 'B39'],
  lessons: kvsProductionLessons.length,
  questions: kvsProductionQuizzes.length,
} as const
