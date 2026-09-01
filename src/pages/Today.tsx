import { useMemo } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, BookOpen, CheckCircle2, Flame, Gauge, Sparkles, Target, Trophy } from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage } from '../utils/storage'

export default function Today() {
  const [, navigate] = useLocation()
  const profile = storage.getProfile()
  const preferences = storage.getPreferences()
  const progress = storage.getLessonsProgress()
  const attempts = storage.getQuizAttempts()
  const stats = storage.getStats()
  const today = storage.getTodayActivity()

  const completedIds = new Set(Object.entries(progress).filter(([, item]) => item.completed).map(([id]) => id))
  const recommendedLesson = useMemo(() => {
    const favourites = preferences.favouriteSubjects
    return lessons.find((lesson) => favourites.includes(lesson.subject) && !completedIds.has(lesson.id))
      ?? lessons.find((lesson) => !completedIds.has(lesson.id))
      ?? lessons[0]
  }, [completedIds, preferences.favouriteSubjects])

  const weakSubject = useMemo(() => {
    const bySubject = attempts.reduce<Record<string, number[]>>((result, attempt) => {
      if (attempt.subject) (result[attempt.subject] ??= []).push(attempt.percentage)
      return result
    }, {})
    const ranked = Object.entries(bySubject)
      .map(([subject, values]) => ({ subject, average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) }))
      .sort((a, b) => a.average - b.average)
    return ranked[0]
  }, [attempts])

  const recommendedQuiz = quizzes.find((question) => question.lessonId === recommendedLesson?.id)
    ?? quizzes.find((question) => question.subject === weakSubject?.subject)
    ?? quizzes[0]
  const goalPercent = Math.min(100, Math.round((today.activities / preferences.dailyGoal) * 100))
  const level = Math.floor(stats.totalXP / 500) + 1
  const levelProgress = stats.totalXP % 500

  return (
    <main className="min-h-screen bg-[#071124] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(34,211,238,0.2),_transparent_28%),radial-gradient(circle_at_90%_15%,_rgba(168,85,247,0.25),_transparent_30%),linear-gradient(135deg,#071124,#12183f,#241046)]" />
        <div className="container relative z-10 py-14 sm:py-18">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200"><Sparkles className="h-4 w-4" /> Today’s learning mission</div>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Ready, {profile?.name ?? 'Learner'}?</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">Complete one focused activity, review a quiz and move your learning story forward.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><Flame className="mx-auto h-5 w-5 text-orange-300" /><div className="mt-2 text-2xl font-black">{stats.currentStreak}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-300">day streak</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><Trophy className="mx-auto h-5 w-5 text-violet-300" /><div className="mt-2 text-2xl font-black">{stats.totalXP}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-300">XP</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><Gauge className="mx-auto h-5 w-5 text-cyan-300" /><div className="mt-2 text-2xl font-black">{level}</div><div className="text-xs font-bold uppercase tracking-wide text-slate-300">level</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-10 text-slate-950">
        <div className="container grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-6 text-white">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/80">Recommended next</p>
                <h2 className="mt-2 text-3xl font-black">{recommendedLesson.title}</h2>
                <p className="mt-2 text-white/85">{recommendedLesson.subject} · {recommendedLesson.duration} minutes · {recommendedLesson.difficulty}</p>
              </div>
              <div className="p-6">
                <p className="leading-7 text-slate-600">{recommendedLesson.summary}</p>
                <button onClick={() => navigate(`/lesson/${recommendedLesson.id}`)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Start lesson <ArrowRight className="h-4 w-4" /></button>
              </div>
            </article>

            <div className="grid gap-6 md:grid-cols-2">
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Target className="h-6 w-6" /></div>
                <h2 className="mt-5 text-2xl font-black">Quick quiz mission</h2>
                <p className="mt-2 leading-7 text-slate-600">Practise {recommendedQuiz.subject} with immediate explanations and a saved score.</p>
                <button onClick={() => navigate(`/quiz/${recommendedQuiz.lessonId}`)} className="mt-5 inline-flex items-center gap-2 font-black text-violet-700">Open quiz <ArrowRight className="h-4 w-4" /></button>
              </article>
              <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><BookOpen className="h-6 w-6" /></div>
                <h2 className="mt-5 text-2xl font-black">Needs-practice signal</h2>
                <p className="mt-2 leading-7 text-slate-600">{weakSubject ? `${weakSubject.subject} is currently your lowest quiz average at ${weakSubject.average}%.` : 'Complete a quiz to unlock subject-specific practice suggestions.'}</p>
                <button onClick={() => navigate(weakSubject ? `/subject/${weakSubject.subject.toLowerCase().replace(/\s+/g, '-')}` : '/learning-worlds')} className="mt-5 inline-flex items-center gap-2 font-black text-amber-700">Choose practice <ArrowRight className="h-4 w-4" /></button>
              </article>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">Daily goal</p><h2 className="mt-1 text-2xl font-black">{today.activities} of {preferences.dailyGoal}</h2></div><div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div></div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${goalPercent}%` }} /></div>
              <p className="mt-3 text-sm text-slate-500">{goalPercent >= 100 ? 'Goal complete. Extra learning is optional.' : `${preferences.dailyGoal - today.activities} activity remaining today.`}</p>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">Level progress</p>
              <h2 className="mt-1 text-2xl font-black">Level {level}</h2>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.round((levelProgress / 500) * 100)}%` }} /></div>
              <p className="mt-3 text-sm text-slate-500">{levelProgress} / 500 XP towards the next level.</p>
            </section>

            <section className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6">
              <h2 className="font-black text-blue-950">Local personalised suggestions</h2>
              <p className="mt-2 text-sm leading-6 text-blue-800">Recommendations use activity saved in this browser. They do not use cloud AI, advertising profiles or third-party tracking.</p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}
