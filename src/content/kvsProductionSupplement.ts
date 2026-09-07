import { kvsMathLessons, kvsMathQuizzes } from './kvsProductionMath'
import { kvsTamilLessons, kvsTamilQuizzes } from './kvsProductionTamil'
import { kvsEnglishLessons, kvsEnglishQuizzes } from './kvsProductionEnglish'
import { kvsCodingLessons, kvsCodingQuizzes } from './kvsProductionCoding'
import { kvsScienceLessons, kvsScienceQuizzes } from './kvsProductionScience'
import { kvsFoundationLessons, kvsFoundationQuizzes } from './kvsProductionFoundations'
import { kvsPrerequisiteLessons, kvsPrerequisiteQuizzes } from './kvsProductionPrerequisites'

// Controlled production-safe tranches from KVS-STAGING-2026-09.
// B35, B36 and B39 enter only after source/provenance reconciliation.
export const kvsProductionLessons = [
  ...kvsMathLessons,
  ...kvsTamilLessons,
  ...kvsEnglishLessons,
  ...kvsCodingLessons,
  ...kvsScienceLessons,
  ...kvsFoundationLessons,
  ...kvsPrerequisiteLessons,
]

export const kvsProductionQuizzes = [
  ...kvsMathQuizzes,
  ...kvsTamilQuizzes,
  ...kvsEnglishQuizzes,
  ...kvsCodingQuizzes,
  ...kvsScienceQuizzes,
  ...kvsFoundationQuizzes,
  ...kvsPrerequisiteQuizzes,
]

export const kvsProductionSeed = {
  baseline: 'KVS-STAGING-2026-09-B39-SOURCE-VERIFIED',
  sourceBatches: ['B35', 'B36', 'B37', 'B38', 'B39'],
  lessons: kvsProductionLessons.length,
  questions: kvsProductionQuizzes.length,
} as const
