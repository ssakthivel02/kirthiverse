import { useMemo } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, BarChart3, CalendarDays, CalendarRange, CheckCircle, CircleAlert, ClipboardList, Clock, Download, HeartPulse, History, ShieldCheck, Target, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { storage } from '../utils/storage'
import { lessons } from '../content/lessons'
import { exportAllLocalData, getAllLocalData } from '../utils/localDataBundle'
import { getWeeklyGoalProgress } from '../utils/familyControls'

interface StatCard {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
}

export default function ParentDashboard() {
  const [, navigate] = useLocation()
  const data = getAllLocalData()
  const preferences = storage.getPreferences()
  const stats = storage.getStats()
  const attempts = storage.getQuizAttempts()
  const progress = storage.getLessonsProgress()
  const today = storage.getTodayActivity()
  const weekly = getWeeklyGoalProgress()
  const openMistakes = data.reviewData.mistakes.filter((item) => !item.resolved).length
  const openNotes = data.reviewData.learningNotes.filter((item) => !item.completed).length

  const subjectProgress = useMemo(() => {
    const names = [...new Set(lessons.map((lesson) => lesson.subject))]
    return names.map((name) => {
      const items = lessons.filter((lesson) => lesson.subject === name)
      const completed = items.filter((lesson) => progress[lesson.id]?.completed).length
      const subjectAttempts = attempts.filter((attempt) => attempt.subject === name)
      const quizAverage = subjectAttempts.length ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / subjectAttempts.length) : null
      return { name, completed, total: items.length, percentage: items.length ? Math.round((completed / items.length) * 100) : 0, quizAverage }
    }).filter((item) => item.completed > 0 || item.quizAverage !== null).sort((a, b) => b.percentage - a.percentage)
  }, [attempts, progress])

  const strongest = [...subjectProgress].filter((item) => item.quizAverage !== null).sort((a, b) => (b.quizAverage ?? 0) - (a.quizAverage ?? 0))[0]
  const needsPractice = [...subjectProgress].filter((item) => item.quizAverage !== null).sort((a, b) => (a.quizAverage ?? 100) - (b.quizAverage ?? 100))[0]

  const recentActivity = Object.entries(progress)
    .filter(([, item]) => item.completed && item.completedDate)
    .sort((a, b) => (b[1].completedDate ?? 0) - (a[1].completedDate ?? 0))
    .slice(0, 5)
    .map(([id, item]) => ({ lesson: lessons.find((lesson) => lesson.id === id), date: item.completedDate }))

  const statCards: StatCard[] = [
    { label: 'Lessons completed', value: stats.completedLessons, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Total XP', value: stats.totalXP, icon: TrendingUp, color: 'text-violet-500' },
    { label: 'Average quiz score', value: `${stats.averageScore}%`, icon: BarChart3, color: 'text-blue-500' },
    { label: 'Current streak', value: `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`, icon: Clock, color: 'text-orange-500' },
  ]

  function downloadReport() {
    const report = exportAllLocalData()
    const blob = new Blob([report], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kirthiverse-${data.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'learner'}-local-data.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Family progress view</p><h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">Clear evidence. No guesswork.</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Review learning activity stored on this device. Current data is not remotely synchronised, teacher-verified or shared with third parties.</p></div>
          <button type="button" onClick={downloadReport} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950"><Download className="h-4 w-4" aria-hidden="true" /> Export all local data</button>
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-8 flex flex-col items-start gap-6 rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-gradient-to-br from-cyan-300 to-violet-500 text-4xl" aria-hidden="true">{data.profile.avatar}</div>
          <div className="flex-1"><h2 className="text-3xl font-black">{data.profile.name}</h2><p className="mt-1 text-slate-500">Grade {data.profile.grade} · Ages {preferences.ageBand} · {preferences.learningLevel}</p></div>
          <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Open learner dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={() => navigate('/study-planner')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-cyan-400"><CalendarRange className="h-6 w-6 text-cyan-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Study planner</h2><p className="mt-2 text-sm leading-6 text-slate-600">Generate a seven-day plan from goals and current practice needs.</p></button>
          <button type="button" onClick={() => navigate('/mistake-review')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-rose-400"><CircleAlert className="h-6 w-6 text-rose-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Mistake review</h2><p className="mt-2 text-sm leading-6 text-slate-600">{openMistakes} open item{openMistakes === 1 ? '' : 's'} with explanations and retry links.</p></button>
          <button type="button" onClick={() => navigate('/activity')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-blue-400"><History className="h-6 w-6 text-blue-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Learning activity</h2><p className="mt-2 text-sm leading-6 text-slate-600">Review and export the local lesson and quiz timeline.</p></button>
          <button type="button" onClick={() => navigate('/learning-notes')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-amber-400"><ClipboardList className="h-6 w-6 text-amber-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Learning notes</h2><p className="mt-2 text-sm leading-6 text-slate-600">{openNotes} open note{openNotes === 1 ? '' : 's'} for strengths, questions and follow-up.</p></button>
          <button type="button" onClick={() => navigate('/family-goals')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-emerald-400"><Target className="h-6 w-6 text-emerald-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Family goals</h2><p className="mt-2 text-sm leading-6 text-slate-600">Set weekly lessons, quizzes, focus subjects and healthy session limits.</p></button>
          <button type="button" onClick={() => navigate('/weekly-review')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-violet-400"><CalendarDays className="h-6 w-6 text-violet-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Weekly review</h2><p className="mt-2 text-sm leading-6 text-slate-600">Print a seven-day activity and mastery reflection.</p></button>
          <button type="button" onClick={() => navigate('/wellbeing')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-rose-400"><HeartPulse className="h-6 w-6 text-rose-600" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">Wellbeing centre</h2><p className="mt-2 text-sm leading-6 text-slate-600">Use optional session timing and break reminders without penalties.</p></button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color }) => <article key={label} data-stat-label={label} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-sm font-black tracking-wide text-slate-600">{label}</h3><Icon className={`h-5 w-5 ${color}`} aria-hidden="true" /></div><p className="mt-4 text-3xl font-black" data-stat-value>{value}</p></article>)}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.15em] text-emerald-700">Today’s goal</p><h2 className="mt-1 text-2xl font-black">{today.activities} of {preferences.dailyGoal} activities</h2></div><Target className="h-7 w-7 text-emerald-600" aria-hidden="true" /></div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(100, Math.round((today.activities / preferences.dailyGoal) * 100))}%` }} /></div>
              <p className="mt-3 text-sm text-slate-500">{today.completedLessons} lesson completion{today.completedLessons === 1 ? '' : 's'} and {today.quizAttempts} quiz attempt{today.quizAttempts === 1 ? '' : 's'} today.</p>
              <p className="mt-2 text-sm font-bold text-emerald-800">This week: {weekly.completedLessons}/{weekly.goals.weeklyLessons} lessons · {weekly.quizAttempts}/{weekly.goals.weeklyQuizzes} quizzes.</p>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Learning signals</h2>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4"><TrendingUp className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" /><div><p className="font-black text-emerald-950">Current strength</p><p className="mt-1 text-sm text-emerald-800">{strongest ? `${strongest.name} · ${strongest.quizAverage}% quiz average` : 'Complete quizzes to identify strengths.'}</p></div></div>
                <div className="flex gap-3 rounded-2xl bg-amber-50 p-4"><TrendingDown className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" /><div><p className="font-black text-amber-950">Needs practice</p><p className="mt-1 text-sm text-amber-800">{needsPractice ? `${needsPractice.name} · ${needsPractice.quizAverage}% quiz average` : 'No needs-practice signal yet.'}</p></div></div>
              </div>
            </section>
          </div>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Subject evidence</p><h2 className="mt-1 text-2xl font-black">Progress and quiz mastery</h2></div><BarChart3 className="h-7 w-7 text-violet-600" aria-hidden="true" /></div>
            {subjectProgress.length ? <div className="mt-6 space-y-5">{subjectProgress.map((item) => <div key={item.name}><div className="mb-2 flex flex-wrap justify-between gap-2"><span className="font-black">{item.name}</span><span className="text-sm font-bold text-slate-500">{item.completed}/{item.total} lessons{item.quizAverage !== null ? ` · ${item.quizAverage}% quiz average` : ''}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style={{ width: `${item.percentage}%` }} /></div></div>)}</div> : <p className="mt-6 text-slate-500">No subject activity yet.</p>}
          </section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Recent lesson activity</h2>{recentActivity.length ? <ul className="mt-5 divide-y divide-slate-100">{recentActivity.map(({ lesson, date }) => <li key={`${lesson?.id}-${date}`} className="py-4"><p className="font-black">{lesson?.title ?? 'Lesson completed'}</p><p className="mt-1 text-sm text-slate-500">{lesson?.subject} · {date ? new Date(date).toLocaleDateString() : ''}</p></li>)}</ul> : <p className="mt-5 text-slate-500">No completed lesson activity yet.</p>}</section>
          <section className="flex gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6 sm:p-8"><ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" /><div><h2 className="text-xl font-black text-blue-950">Privacy boundary</h2><p className="mt-3 leading-7 text-blue-800">This view reads only this browser’s local learner record. It does not provide remote monitoring, teacher verification, cloud accounts or school reporting. Those controls require the secure identity and school releases.</p><p className="mt-4 text-sm font-bold text-blue-800">Quiz attempts: {attempts.length} · timed sessions: {data.familyControls.sessions.length} · review items: {data.reviewData.mistakes.length} · notes: {data.reviewData.learningNotes.length}</p></div></section>
        </div>
      </section>
    </main>
  )
}
