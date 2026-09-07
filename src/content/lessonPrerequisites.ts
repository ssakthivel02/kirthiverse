import type { Lesson } from './lessons'

/**
 * Explicit runtime prerequisite graph for relationships we can justify from the
 * current production curriculum. Missing entries intentionally fall back to the
 * existing same-subject sequence until the staging corpus provides authoritative
 * prerequisite metadata for broader coverage.
 */
export const lessonPrerequisiteIds: Record<string, string[]> = {
  'math-002': ['math-001'],
  'math-003': ['math-001'],
  'math-005': ['math-004'],
  'math-006': ['math-004', 'math-005'],
  'math-008': ['math-007'],
  'math-010': ['math-009'],
  'math-015': ['math-002', 'math-003', 'math-004', 'math-006'],
  'sci-004': ['sci-001', 'sci-002', 'sci-003'],
}

export function getExplicitPrerequisites(lesson: Lesson, allLessons: Lesson[]) {
  const ids = lessonPrerequisiteIds[lesson.id]
  if (!ids?.length) return []
  const byId = new Map(allLessons.map((item) => [item.id, item]))
  return ids.map((id) => byId.get(id)).filter((item): item is Lesson => Boolean(item))
}
