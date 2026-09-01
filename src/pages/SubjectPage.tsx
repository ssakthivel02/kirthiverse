import { useEffect, useMemo, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { ArrowLeft, Bookmark, BookOpen, CheckCircle, Play } from 'lucide-react'
import { lessons } from '../content/lessons'
import { storage } from '../utils/storage'

const subjectColors: Record<string, { bg: string; text: string; icon: string }> = {
  mathematics: { bg: 'from-blue-500 to-violet-600', text: 'text-blue-700', icon: '🔢' },
  science: { bg: 'from-emerald-500 to-cyan-600', text: 'text-emerald-700', icon: '🔬' },
  english: { bg: 'from-fuchsia-500 to-indigo-600', text: 'text-violet-700', icon: '📚' },
  coding: { bg: 'from-orange-500 to-pink-600', text: 'text-orange-700', icon: '💻' },
  geography: { bg: 'from-cyan-500 to-blue-600', text: 'text-cyan-700', icon: '🌍' },
  history: { bg: 'from-amber-500 to-red-600', text: 'text-amber-700', icon: '📜' },
  tamil: { bg: 'from-red-500 to-fuchsia-600', text: 'text-red-700', icon: 'தமிழ்' },
  music: { bg: 'from-pink-500 to-purple-600', text: 'text-pink-700', icon: '🎵' },
  arts: { bg: 'from-violet-500 to-blue-600', text: 'text-violet-700', icon: '🎨' },
  'life-skills': { bg: 'from-lime-500 to-teal-600', text: 'text-emerald-700', icon: '⭐' },
}

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, '-')

export default function SubjectPage() {
  const [, params] = useRoute('/subject/:id')
  const [, navigate] = useLocation()
  const subjectId = params?.id ?? 'mathematics'
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set(storage.getBookmarks()))
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(
    Object.entries(storage.getLessonsProgress()).filter(([, item]) => item.completed).map(([id]) => id),
  ))

  useEffect(() => {
    setBookmarks(new Set(storage.getBookmarks()))
    setCompleted(new Set(Object.entries(storage.getLessonsProgress()).filter(([, item]) => item.completed).map(([id]) => id)))
  }, [subjectId])

  const subjectLessons = useMemo(
    () => lessons.filter((lesson) => slug(lesson.subject) === subjectId.toLowerCase()).sort((a, b) => a.order - b.order),
    [subjectId],
  )
  const colors = subjectColors[subjectId] ?? subjectColors.mathematics
  const subjectName = subjectLessons[0]?.subject ?? subjectId.charAt(0).toUpperCase() + subjectId.slice(1).replace(/-/g, ' ')
  const completedCount = subjectLessons.filter((lesson) => completed.has(lesson.id)).length
  const bookmarkedCount = subjectLessons.filter((lesson) => bookmarks.has(lesson.id)).length
  const percentage = subjectLessons.length ? Math.round((completedCount / subjectLessons.length) * 100) : 0

  function toggleBookmark(lessonId: string) {
    if (bookmarks.has(lessonId)) {
      storage.unbookmarkLesson(lessonId)
      setBookmarks((previous) => {
        const next = new Set(previous)
        next.delete(lessonId)
        return next
      })
      return
    }
    storage.bookmarkLesson(lessonId)
    setBookmarks((previous) => new Set([...previous, lessonId]))
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-950 dark:from-slate-900 dark:to-slate-800 dark:text-white">
      <header className={`bg-gradient-to-r ${colors.bg} px-4 py-12 text-white`}>
        <div className="mx-auto max-w-5xl">
          <button type="button" onClick={() => navigate('/learning-worlds')} className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-black/10 px-3 font-bold hover:bg-black/20">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back to Learning Worlds
          </button>
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid min-h-16 min-w-16 place-items-center rounded-2xl bg-white/15 px-3 text-3xl font-black" aria-hidden="true">{colors.icon}</span>
            <div className="min-w-0"><p className="text-sm font-black uppercase tracking-[0.18em] text-white/75">Subject world</p><h1 className="mt-1 break-words text-4xl font-black tracking-tight sm:text-5xl">{subjectName}</h1><p className="mt-2 text-lg text-white/85">{subjectLessons.length} structured lessons</p></div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <section aria-label={`${subjectName} progress`} className="mb-10 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-slate-800"><p className="text-sm font-bold text-slate-500 dark:text-slate-300">Completed in this subject</p><p className={`mt-2 text-3xl font-black ${colors.text}`}>{completedCount}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-slate-800"><p className="text-sm font-bold text-slate-500 dark:text-slate-300">Saved in this subject</p><p className={`mt-2 text-3xl font-black ${colors.text}`}>{bookmarkedCount}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-slate-800"><p className="text-sm font-bold text-slate-500 dark:text-slate-300">Subject progress</p><p className={`mt-2 text-3xl font-black ${colors.text}`}>{percentage}%</p></article>
        </section>

        <section aria-labelledby="subject-lessons-heading">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Mission sequence</p><h2 id="subject-lessons-heading" className="mt-1 text-3xl font-black">Lessons in {subjectName}</h2></div><p className="text-sm font-bold text-slate-500 dark:text-slate-300">Complete lessons in any order; the listed order provides a guided path.</p></div>

          {subjectLessons.length ? (
            <div className="space-y-4">
              {subjectLessons.map((lesson, index) => {
                const isComplete = completed.has(lesson.id)
                const isBookmarked = bookmarks.has(lesson.id)
                return (
                  <article key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-800 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-200'}`}>
                          {isComplete ? <CheckCircle className="h-6 w-6" aria-hidden="true" /> : <BookOpen className="h-6 w-6" aria-hidden="true" />}
                        </div>
                        <div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Mission {index + 1}</p><h3 className="mt-1 break-words text-xl font-black text-slate-950 dark:text-white">{lesson.title}</h3><div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-700 dark:text-slate-200">{lesson.category}</span><span className="text-slate-500 dark:text-slate-300">{lesson.duration} min</span><span className={lesson.difficulty === 'beginner' ? 'text-emerald-700 dark:text-emerald-300' : lesson.difficulty === 'intermediate' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}>{lesson.difficulty}</span></div></div>
                      </div>

                      <div className="flex w-full items-center gap-3 sm:w-auto sm:shrink-0">
                        <button type="button" aria-label={`${isBookmarked ? 'Remove' : 'Save'} ${lesson.title}`} aria-pressed={isBookmarked} onClick={() => toggleBookmark(lesson.id)} className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition ${isBookmarked ? 'border-violet-300 bg-violet-100 text-violet-800 dark:bg-violet-400 dark:text-slate-950' : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10'}`}>
                          <Bookmark className="h-5 w-5" fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => navigate(`/lesson/${lesson.id}`)} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 font-black text-white ${colors.bg} sm:flex-none`}>
                          <Play className="h-4 w-4" aria-hidden="true" /> {isComplete ? 'Review lesson' : 'Start lesson'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/20 dark:bg-slate-800"><h2 className="text-2xl font-black">Subject not found</h2><p className="mt-2 text-slate-500 dark:text-slate-300">Return to Learning Worlds and choose an available subject.</p><button type="button" onClick={() => navigate('/learning-worlds')} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-black text-white dark:bg-white dark:text-slate-950">Open Learning Worlds</button></div>
          )}
        </section>
      </div>
    </main>
  )
}
