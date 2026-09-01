import { useLocation } from 'wouter'
import { ArrowRight, BrainCircuit, CheckCircle2, Flame, Sparkles, Target, Trophy } from 'lucide-react'
import { storage } from '../utils/storage'
import { getDailyChallenge, getPracticeQueue, getWeakestSubjects } from '../utils/learningInsights'

export default function PracticeHub() {
  const [, navigate] = useLocation()
  const profile = storage.getProfile()
  const stats = storage.getStats()
  const today = storage.getTodayActivity()
  const preferences = storage.getPreferences()
  const challenge = getDailyChallenge()
  const queue = getPracticeQueue(8)
  const weakSubjects = getWeakestSubjects(3)
  const goalPercent = Math.min(100, Math.round((today.activities / preferences.dailyGoal) * 100))

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="overflow-hidden bg-[#071124] text-white">
        <div className="container grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Practice Hub</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">Turn today’s effort into tomorrow’s mastery.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">A local-first practice plan built from completed lessons, bookmarks and real quiz results on this device.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate(`/lesson/${challenge.lesson.id}`)} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-300 px-5 font-black text-slate-950 hover:-translate-y-0.5">Start daily challenge <ArrowRight className="h-4 w-4" /></button>
              <button onClick={() => navigate('/progress-report')} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 font-black text-white hover:bg-white/15">View progress report <Trophy className="h-4 w-4" /></button>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Today’s challenge</p><h2 className="mt-2 text-2xl font-black">{challenge.lesson.title}</h2><p className="mt-2 text-sm text-slate-300">{challenge.lesson.subject} · {challenge.lesson.duration} minutes · {challenge.quizQuestions} quiz question{challenge.quizQuestions === 1 ? '' : 's'}</p></div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-slate-950"><Sparkles className="h-6 w-6" /></span>
            </div>
            <p className="mt-5 rounded-2xl bg-slate-950/30 p-4 text-sm leading-6 text-slate-200">{challenge.reason}</p>
            <button onClick={() => navigate(`/lesson/${challenge.lesson.id}`)} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left font-black text-slate-950">Open challenge <ArrowRight className="h-5 w-5" /></button>
          </aside>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Flame className="h-7 w-7 text-orange-500" /><p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-slate-500">Current streak</p><p className="mt-2 text-4xl font-black">{stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Target className="h-7 w-7 text-emerald-600" /><p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-slate-500">Daily goal</p><p className="mt-2 text-4xl font-black">{goalPercent}%</p><p className="mt-2 text-sm text-slate-500">{today.activities} of {preferences.dailyGoal} activities completed</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><BrainCircuit className="h-7 w-7 text-violet-600" /><p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-slate-500">Practice queue</p><p className="mt-2 text-4xl font-black">{queue.length}</p><p className="mt-2 text-sm text-slate-500">Prioritised local recommendations</p></article>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Next best actions</p><h2 className="mt-2 text-3xl font-black">{profile ? `${profile.name}’s practice queue` : 'Your practice queue'}</h2></div><button onClick={() => navigate('/bookmarks')} className="font-black text-violet-700">Open saved lessons</button></div>
            {queue.length ? <div className="mt-6 grid gap-4">{queue.map((item, index) => (
              <article key={item.lesson.id} className="grid gap-4 rounded-2xl border border-slate-200 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 font-black text-white">{index + 1}</span>
                <div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{item.lesson.subject} · {item.lesson.difficulty}</p><h3 className="mt-1 text-xl font-black">{item.lesson.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}{typeof item.latestScore === 'number' ? ` · Latest score ${item.latestScore}%` : ''}</p></div>
                <button onClick={() => navigate(`/lesson/${item.lesson.id}`)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-black text-white">Open <ArrowRight className="h-4 w-4" /></button>
              </article>
            ))}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h3 className="mt-4 text-xl font-black">Practice queue clear</h3><p className="mt-2 text-slate-500">Explore a new world to create your next learning signal.</p></div>}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-rose-700">Focus areas</p><h2 className="mt-2 text-2xl font-black">Subjects to strengthen</h2>
              {weakSubjects.length ? <div className="mt-5 space-y-3">{weakSubjects.map((item) => <button key={item.subject} onClick={() => navigate(`/subject/${item.subject.toLowerCase().replace(/\s+/g, '-')}`)} className="flex w-full items-center justify-between rounded-2xl bg-rose-50 p-4 text-left"><span><span className="block font-black">{item.subject}</span><span className="mt-1 block text-sm text-rose-800">{item.averageScore}% average · {item.quizAttempts} attempt{item.quizAttempts === 1 ? '' : 's'}</span></span><ArrowRight className="h-4 w-4" /></button>)}</div> : <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Complete quizzes to build evidence-based practice recommendations.</p>}
            </section>
            <section className="rounded-[2rem] bg-gradient-to-br from-violet-600 to-cyan-600 p-6 text-white shadow-xl"><p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-100">Safe motivation</p><h2 className="mt-2 text-2xl font-black">Progress over pressure.</h2><p className="mt-3 leading-7 text-white/85">KirthiVerse rewards completed learning and first-time quiz effort. Repeating the same quiz does not endlessly farm XP.</p></section>
          </aside>
        </div>
      </section>
    </main>
  )
}
