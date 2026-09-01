import { useMemo } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, Award, BookOpen, Flame, Gauge, Target, Trophy, Zap } from 'lucide-react'
import { lessons } from '../content/lessons'
import { storage } from '../utils/storage'

export default function StudentDashboard() {
  const [, navigate] = useLocation()
  const data = storage.getAllData()
  const profile = data.profile
  const preferences = storage.getPreferences()
  const stats = storage.getStats()
  const progress = storage.getLessonsProgress()
  const today = storage.getTodayActivity()
  const level = Math.floor(stats.totalXP / 500) + 1
  const levelProgress = stats.totalXP % 500
  const completionRate = lessons.length ? Math.round((stats.completedLessons / lessons.length) * 100) : 0
  const subjectsExplored = useMemo(() => new Set(lessons.filter((lesson) => progress[lesson.id]?.completed).map((lesson) => lesson.subject)).size, [progress])
  const recentLessons = useMemo(() => Object.entries(progress)
    .filter(([, item]) => item.completedDate)
    .sort((a, b) => (b[1].completedDate ?? 0) - (a[1].completedDate ?? 0))
    .slice(0, 4)
    .map(([id, item]) => ({ lesson: lessons.find((lesson) => lesson.id === id), completedDate: item.completedDate })), [progress])
  const goalPercent = Math.min(100, Math.round((today.activities / preferences.dailyGoal) * 100))

  const cards = [
    { label: 'Total XP', value: stats.totalXP, detail: `${levelProgress} / 500 XP to next level`, icon: Zap, tone: 'from-violet-500 to-fuchsia-600' },
    { label: 'Current streak', value: `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`, detail: `Best: ${stats.longestStreak} days`, icon: Flame, tone: 'from-orange-400 to-rose-500' },
    { label: 'Lessons complete', value: stats.completedLessons, detail: `${completionRate}% of the library`, icon: BookOpen, tone: 'from-emerald-500 to-cyan-600' },
    { label: 'Quiz average', value: `${stats.averageScore}%`, detail: `${stats.totalAttempts} attempt${stats.totalAttempts === 1 ? '' : 's'}`, icon: Target, tone: 'from-blue-500 to-indigo-600' },
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-gradient-to-br from-cyan-300 to-violet-500 text-4xl shadow-xl">{profile.avatar}</div>
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Learner mission control</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Welcome back, {profile.name}</h1><p className="mt-2 text-slate-300">Grade {profile.grade} · {preferences.learningLevel} · Ages {preferences.ageBand}</p></div>
          </div>
          <button onClick={() => navigate('/today')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950">Open today’s mission <ArrowRight className="h-4 w-4" /></button>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className={`absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br ${tone} opacity-10`} /><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon className="h-6 w-6" /></div><p className="mt-7 text-sm font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-4xl font-black">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></article>)}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.15em] text-emerald-700">Daily goal</p><h2 className="mt-1 text-2xl font-black">{today.activities} of {preferences.dailyGoal} activities</h2></div><Gauge className="h-7 w-7 text-emerald-600" /></div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${goalPercent}%` }} /></div>
              <p className="mt-3 text-sm text-slate-500">{goalPercent >= 100 ? 'Today’s goal is complete.' : `${preferences.dailyGoal - today.activities} activity remaining.`}</p>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Level {level}</p><h2 className="mt-1 text-2xl font-black">Next level progress</h2></div><Trophy className="h-7 w-7 text-violet-600" /></div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.round((levelProgress / 500) * 100)}%` }} /></div>
              <p className="mt-3 text-sm text-slate-500">{500 - levelProgress} XP remaining.</p>
            </section>

            <button onClick={() => navigate('/achievements')} className="flex w-full items-center justify-between rounded-[1.75rem] bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-left text-slate-950 shadow-lg"><span><span className="block text-sm font-black uppercase tracking-[0.15em]">Achievement journey</span><span className="mt-1 block text-2xl font-black">See what you have unlocked</span></span><Award className="h-9 w-9" /></button>
          </div>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-700">Recent learning</p><h2 className="mt-1 text-2xl font-black">Your latest missions</h2></div><button onClick={() => navigate('/learning-worlds')} className="inline-flex items-center gap-2 font-black text-cyan-700">Explore all worlds <ArrowRight className="h-4 w-4" /></button></div>
            {recentLessons.length ? <div className="mt-6 divide-y divide-slate-100">{recentLessons.map(({ lesson, completedDate }) => <button key={`${lesson?.id}-${completedDate}`} onClick={() => lesson && navigate(`/lesson/${lesson.id}`)} className="flex w-full items-center justify-between gap-4 py-4 text-left"><span><span className="block font-black">{lesson?.title ?? 'Completed lesson'}</span><span className="mt-1 block text-sm text-slate-500">{lesson?.subject} · {completedDate ? new Date(completedDate).toLocaleDateString() : ''}</span></span><ArrowRight className="h-4 w-4 text-slate-400" /></button>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><BookOpen className="mx-auto h-9 w-9 text-slate-400" /><h3 className="mt-4 text-xl font-black">No completed missions yet</h3><p className="mt-2 text-slate-500">Complete a lesson to build your activity story.</p><button onClick={() => navigate('/learning-worlds')} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Choose a world</button></div>}
            <div className="mt-8 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">Subjects explored</p><p className="mt-2 text-3xl font-black">{subjectsExplored} / 10</p></div><div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-500">Estimated study time</p><p className="mt-2 text-3xl font-black">{lessons.filter((lesson) => progress[lesson.id]?.completed).reduce((total, lesson) => total + lesson.duration, 0)} min</p></div></div>
          </section>
        </div>
      </section>
    </main>
  )
}
