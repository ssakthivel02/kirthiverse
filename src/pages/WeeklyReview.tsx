import { Link } from 'wouter'
import { BarChart3, BookOpenCheck, CalendarDays, Clock3, Printer, Target, Trophy } from 'lucide-react'
import { getSevenDayActivity, getWeeklyGoalProgress } from '../utils/familyControls'
import { getStrongestSubjects, getWeakestSubjects } from '../utils/learningInsights'
import { storage } from '../utils/storage'

export default function WeeklyReview() {
  const profile = storage.getProfile()
  const days = getSevenDayActivity()
  const weekly = getWeeklyGoalProgress()
  const strongest = getStrongestSubjects(2)
  const weakest = getWeakestSubjects(2)
  const totalActivities = days.reduce((sum, day) => sum + day.lessonCount + day.quizCount, 0)
  const totalMinutes = days.reduce((sum, day) => sum + day.estimatedMinutes, 0)
  const maxActivities = Math.max(1, ...days.map((day) => day.lessonCount + day.quizCount))

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white print:bg-white print:text-slate-950">
        <div className="container flex flex-col gap-6 py-14 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300 print:text-slate-600">Seven-day learning review</p><h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">Weekly Review: {profile?.name ?? 'Learner'}’s learning story</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200 print:text-slate-700">A local summary of lesson completions, quiz attempts, estimated learning time and mastery signals.</p></div>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 print:hidden"><Printer className="h-4 w-4" aria-hidden="true" /> Print review</button>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><CalendarDays className="h-6 w-6 text-violet-600" aria-hidden="true" /><p className="mt-4 text-3xl font-black">{weekly.activeDays}</p><p className="text-sm font-bold text-slate-500">active days this week</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><BookOpenCheck className="h-6 w-6 text-emerald-600" aria-hidden="true" /><p className="mt-4 text-3xl font-black">{weekly.completedLessons}</p><p className="text-sm font-bold text-slate-500">lessons completed</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Trophy className="h-6 w-6 text-amber-600" aria-hidden="true" /><p className="mt-4 text-3xl font-black">{weekly.quizAttempts}</p><p className="text-sm font-bold text-slate-500">quiz attempts</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Clock3 className="h-6 w-6 text-cyan-600" aria-hidden="true" /><p className="mt-4 text-3xl font-black">{totalMinutes}</p><p className="text-sm font-bold text-slate-500">estimated minutes</p></article>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">Daily rhythm</p><h2 className="mt-1 text-3xl font-black">Activity across seven days</h2></div><BarChart3 className="h-8 w-8 text-violet-600" aria-hidden="true" /></div>
            <div className="mt-8 grid grid-cols-7 gap-3" role="img" aria-label={`Seven-day activity chart with ${totalActivities} total activities`}>
              {days.map((day) => { const count = day.lessonCount + day.quizCount; return <div key={day.key} className="flex flex-col items-center gap-3"><div className="flex h-40 w-full items-end rounded-xl bg-slate-100 p-1"><div className="w-full rounded-lg bg-gradient-to-t from-violet-600 to-cyan-400" style={{ height: `${count ? Math.max(12, Math.round((count / maxActivities) * 100)) : 4}%` }} title={`${count} activities`} /></div><span className="text-xs font-black text-slate-600">{day.label}</span><span className="text-xs text-slate-500">{count}</span></div> })}
            </div>
            <div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Seven-day lessons, quizzes and estimated minutes</caption><thead><tr className="border-b border-slate-200 text-slate-500"><th scope="col" className="py-3 pr-4">Day</th><th scope="col" className="py-3 pr-4">Lessons</th><th scope="col" className="py-3 pr-4">Quizzes</th><th scope="col" className="py-3">Minutes</th></tr></thead><tbody>{days.map((day) => <tr key={day.key} className="border-b border-slate-100"><th scope="row" className="py-3 pr-4 font-black">{day.label}</th><td className="py-3 pr-4">{day.lessonCount}</td><td className="py-3 pr-4">{day.quizCount}</td><td className="py-3">{day.estimatedMinutes}</td></tr>)}</tbody></table></div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3"><Target className="h-6 w-6 text-emerald-600" aria-hidden="true" /><h2 className="text-2xl font-black">Goal check</h2></div>
              <div className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><span>Lessons</span><strong>{weekly.completedLessons} / {weekly.goals.weeklyLessons}</strong></div><div className="flex justify-between gap-4"><span>Quizzes</span><strong>{weekly.quizAttempts} / {weekly.goals.weeklyQuizzes}</strong></div><div className="flex justify-between gap-4"><span>Minutes</span><strong>{weekly.estimatedMinutes} / {weekly.goals.weeklyMinutes}</strong></div></div>
              <Link href="/family-goals" className="mt-6 inline-flex min-h-11 items-center font-black text-emerald-800 underline print:hidden">Review family goals</Link>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Strength signals</h2>{strongest.length ? <ul className="mt-4 space-y-3">{strongest.map((item) => <li key={item.subject} className="rounded-xl bg-emerald-50 p-4"><p className="font-black text-emerald-950">{item.subject}</p><p className="mt-1 text-sm text-emerald-800">{item.averageScore}% quiz average · {item.mastery}</p></li>)}</ul> : <p className="mt-4 text-slate-500">Complete quizzes to identify strengths.</p>}</section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Next-focus signals</h2>{weakest.length ? <ul className="mt-4 space-y-3">{weakest.map((item) => <li key={item.subject} className="rounded-xl bg-amber-50 p-4"><p className="font-black text-amber-950">{item.subject}</p><p className="mt-1 text-sm text-amber-800">{item.averageScore}% quiz average · continue guided practice</p></li>)}</ul> : <p className="mt-4 text-slate-500">No needs-practice signal yet.</p>}</section>
          </div>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6 text-blue-900"><h2 className="font-black">How this report is calculated</h2><p className="mt-2 leading-7">Lesson duration comes from the KirthiVerse content catalogue. Quiz activity uses a five-minute estimate unless a longer timed session was saved. This report is for family reflection, not formal school assessment or attendance evidence.</p></section>
      </section>
    </main>
  )
}
