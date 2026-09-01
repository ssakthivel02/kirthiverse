import { useMemo } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, CalendarDays, Clock3, Printer, Target } from 'lucide-react'
import { getFamilyGoals, getWeeklyGoalProgress } from '../utils/familyControls'
import { getStudyPlanSummary } from '../utils/studyPlanner'

export default function StudyPlanner() {
  const [, navigate] = useLocation()
  const goals = getFamilyGoals()
  const progress = getWeeklyGoalProgress()
  const summary = useMemo(() => getStudyPlanSummary(), [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Family learning rhythm</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Seven-day Study Planner</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">A local plan generated from current practice needs, family goals and unfinished lessons. It is guidance, not a compulsory timetable.</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950"><Printer className="h-4 w-4" /> Print plan</button>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><CalendarDays className="h-6 w-6 text-violet-600" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Planned activities</p><p className="mt-2 text-3xl font-black">{summary.totalActivities}</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Clock3 className="h-6 w-6 text-cyan-600" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Estimated time</p><p className="mt-2 text-3xl font-black">{summary.estimatedMinutes} min</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Target className="h-6 w-6 text-emerald-600" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Subjects</p><p className="mt-2 text-3xl font-black">{summary.subjects.length}</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Target className="h-6 w-6 text-amber-600" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Quiz-ready days</p><p className="mt-2 text-3xl font-black">{summary.quizActivities}</p></article>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-black text-blue-950">Plan logic</h2>
          <p className="mt-3 leading-7 text-blue-800">Priority is given to low quiz scores, saved unfinished lessons and family focus subjects. Rest days are allowed. Missing a planned activity does not remove XP, achievements or streak rewards.</p>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {summary.items.map((item, index) => (
            <article key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">Day {index + 1} · {item.dayLabel}</p><p className="mt-1 text-sm font-bold text-slate-500">{item.dateLabel}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.estimatedMinutes} min</span></div>
              <h2 className="mt-5 text-2xl font-black">{item.lesson.title}</h2>
              <p className="mt-2 font-bold text-cyan-700">{item.lesson.subject} · {item.lesson.difficulty}</p>
              <p className="mt-4 leading-7 text-slate-600">{item.reason}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">Lesson</span>{item.hasQuiz && <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Quiz available</span>}</div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => navigate(`/lesson/${item.lesson.id}`)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Open lesson <ArrowRight className="h-4 w-4" /></button>{item.hasQuiz && <button type="button" onClick={() => navigate(`/quiz/${item.lesson.id}`)} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-950 px-5 font-black">Open quiz</button>}</div>
            </article>
          ))}
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Current family targets</h2><dl className="mt-5 grid gap-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Lessons</dt><dd className="font-black">{progress.completedLessons}/{goals.weeklyLessons}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Quizzes</dt><dd className="font-black">{progress.quizAttempts}/{goals.weeklyQuizzes}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Learning time</dt><dd className="font-black">{progress.estimatedMinutes}/{goals.weeklyMinutes} min</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Focus subjects</dt><dd className="text-right font-black">{goals.focusSubjects.length ? goals.focusSubjects.join(', ') : 'Not selected'}</dd></div></dl></article>
          <article className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6"><h2 className="text-2xl font-black text-emerald-950">Adjust the plan</h2><p className="mt-3 leading-7 text-emerald-800">Change weekly goals or focus subjects and this local plan will recalculate automatically.</p><button type="button" onClick={() => navigate('/family-goals')} className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white">Open Family Goals</button></article>
        </section>
      </section>
    </main>
  )
}
