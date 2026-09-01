import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { BookOpenCheck, Clock3, Save, ShieldCheck, Target, Trophy } from 'lucide-react'
import { lessons } from '../content/lessons'
import { getFamilyGoals, getWeeklyGoalProgress, setFamilyGoals, type FamilyGoals } from '../utils/familyControls'

const subjects = [...new Set(lessons.map((lesson) => lesson.subject))]

function ProgressBar({ value }: { value: number }) {
  return <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${value}%` }} /></div>
}

export default function FamilyGoalsPage() {
  const [goals, setGoals] = useState<FamilyGoals>(() => getFamilyGoals())
  const [saved, setSaved] = useState(false)
  const progress = useMemo(() => getWeeklyGoalProgress(), [saved])

  function toggleSubject(subject: string) {
    setSaved(false)
    setGoals((current) => {
      const exists = current.focusSubjects.includes(subject)
      if (exists) return { ...current, focusSubjects: current.focusSubjects.filter((item) => item !== subject) }
      if (current.focusSubjects.length >= 3) return current
      return { ...current, focusSubjects: [...current.focusSubjects, subject] }
    })
  }

  function save() {
    setFamilyGoals(goals)
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Family learning plan</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.05em]">Set calm, visible weekly goals.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Choose a realistic lesson, quiz and learning-time target. Progress is calculated from activity stored only on this device.</p>
        </div>
      </section>

      <section className="container grid gap-8 py-10 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={(event) => { event.preventDefault(); save() }} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">Plan settings</p><h2 className="mt-1 text-3xl font-black">Weekly targets</h2></div>

          <label className="block"><span className="font-black">Lessons per week</span><select value={goals.weeklyLessons} onChange={(event) => { setSaved(false); setGoals({ ...goals, weeklyLessons: Number(event.target.value) as FamilyGoals['weeklyLessons'] }) }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"><option value={2}>2 lessons</option><option value={3}>3 lessons</option><option value={5}>5 lessons</option><option value={7}>7 lessons</option></select></label>
          <label className="block"><span className="font-black">Quizzes per week</span><select value={goals.weeklyQuizzes} onChange={(event) => { setSaved(false); setGoals({ ...goals, weeklyQuizzes: Number(event.target.value) as FamilyGoals['weeklyQuizzes'] }) }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"><option value={1}>1 quiz</option><option value={2}>2 quizzes</option><option value={3}>3 quizzes</option><option value={5}>5 quizzes</option></select></label>
          <label className="block"><span className="font-black">Learning minutes per week</span><select value={goals.weeklyMinutes} onChange={(event) => { setSaved(false); setGoals({ ...goals, weeklyMinutes: Number(event.target.value) as FamilyGoals['weeklyMinutes'] }) }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"><option value={30}>30 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option><option value={120}>120 minutes</option></select></label>

          <fieldset><legend className="font-black">Focus subjects <span className="font-medium text-slate-500">(up to 3)</span></legend><div className="mt-3 flex flex-wrap gap-2">{subjects.map((subject) => { const active = goals.focusSubjects.includes(subject); return <button key={subject} type="button" onClick={() => toggleSubject(subject)} aria-pressed={active} className={`rounded-full border px-4 py-2 text-sm font-black ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white hover:border-violet-400'}`}>{subject}</button> })}</div></fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="font-black">Break reminder</span><select value={goals.breakEveryMinutes} onChange={(event) => { setSaved(false); setGoals({ ...goals, breakEveryMinutes: Number(event.target.value) as FamilyGoals['breakEveryMinutes'] }) }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"><option value={15}>Every 15 minutes</option><option value={20}>Every 20 minutes</option><option value={30}>Every 30 minutes</option></select></label>
            <label><span className="font-black">Session limit</span><select value={goals.sessionLimitMinutes} onChange={(event) => { setSaved(false); setGoals({ ...goals, sessionLimitMinutes: Number(event.target.value) as FamilyGoals['sessionLimitMinutes'] }) }} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4"><option value={20}>20 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label>
          </div>

          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white"><Save className="h-4 w-4" /> Save family plan</button>
          <p role="status" className="min-h-6 text-sm font-bold text-emerald-700">{saved ? 'Family plan saved on this device.' : ''}</p>
        </form>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">This week</p><h2 className="mt-1 text-3xl font-black">Goal progress</h2></div><Target className="h-8 w-8 text-emerald-600" /></div>
            <div className="mt-7 space-y-6">
              <div><div className="flex justify-between gap-4"><span className="font-black">Lessons</span><span className="font-bold text-slate-500">{progress.completedLessons} / {progress.goals.weeklyLessons}</span></div><ProgressBar value={progress.lessonPercent} /></div>
              <div><div className="flex justify-between gap-4"><span className="font-black">Quizzes</span><span className="font-bold text-slate-500">{progress.quizAttempts} / {progress.goals.weeklyQuizzes}</span></div><ProgressBar value={progress.quizPercent} /></div>
              <div><div className="flex justify-between gap-4"><span className="font-black">Learning time</span><span className="font-bold text-slate-500">{progress.estimatedMinutes} / {progress.goals.weeklyMinutes} min</span></div><ProgressBar value={progress.minutesPercent} /></div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-3">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><BookOpenCheck className="h-6 w-6 text-violet-600" /><p className="mt-4 text-3xl font-black">{progress.completedLessons}</p><p className="text-sm font-bold text-slate-500">lessons this week</p></article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><Trophy className="h-6 w-6 text-amber-600" /><p className="mt-4 text-3xl font-black">{progress.quizAttempts}</p><p className="text-sm font-bold text-slate-500">quiz attempts</p></article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><Clock3 className="h-6 w-6 text-cyan-600" /><p className="mt-4 text-3xl font-black">{progress.activeDays}</p><p className="text-sm font-bold text-slate-500">active days</p></article>
          </div>

          <section className="flex gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" /><div><h2 className="text-xl font-black text-blue-950">Healthy learning boundary</h2><p className="mt-2 leading-7 text-blue-800">Targets are guidance, not pressure. KirthiVerse does not punish missed goals or use endless reward loops. Break and session controls are stored locally and can be changed at any time.</p><Link href="/wellbeing" className="mt-4 inline-flex font-black text-blue-900 underline">Open wellbeing centre</Link></div></section>
        </div>
      </section>
    </main>
  )
}
