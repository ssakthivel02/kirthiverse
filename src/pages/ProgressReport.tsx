import { useLocation } from 'wouter'
import { ArrowRight, BarChart3, BookOpen, Download, Flame, Printer, ShieldCheck, Target, Trophy } from 'lucide-react'
import { lessons } from '../content/lessons'
import { storage } from '../utils/storage'
import { getRecentQuizTrend, getStrongestSubjects, getSubjectInsights, getWeakestSubjects } from '../utils/learningInsights'

function downloadReport() {
  const data = storage.getAllData()
  const report = {
    generatedAt: new Date().toISOString(),
    storageMode: 'local-device',
    learner: { nickname: data.profile.name, grade: data.profile.grade, avatar: data.profile.avatar },
    preferences: data.preferences,
    stats: data.stats,
    subjectInsights: getSubjectInsights(),
    recentActivity: storage.getRecentActivity(20),
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kirthiverse-progress-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function ProgressReport() {
  const [, navigate] = useLocation()
  const profile = storage.getProfile()
  const stats = storage.getStats()
  const preferences = storage.getPreferences()
  const progress = storage.getLessonsProgress()
  const subjects = getSubjectInsights()
  const strongest = getStrongestSubjects(3)
  const weakest = getWeakestSubjects(3)
  const trend = getRecentQuizTrend(6)
  const recent = storage.getRecentActivity(8)
  const studyMinutes = lessons.filter((lesson) => progress[lesson.id]?.completed).reduce((sum, lesson) => sum + lesson.duration, 0)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 print:bg-white">
      <section className="bg-[#071124] text-white print:bg-white print:text-slate-950">
        <div className="container py-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div><p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300 print:text-slate-500">Learner progress report</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{profile?.name ?? 'Guest learner'}’s learning story.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300 print:text-slate-600">Generated from learning activity stored on this device. It is not a formal school assessment.</p></div>
            <div className="flex flex-wrap gap-3 print:hidden"><button onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-black text-slate-950"><Printer className="h-4 w-4" /> Print report</button><button onClick={downloadReport} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 font-black text-white"><Download className="h-4 w-4" /> Export data</button></div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-slate-300 print:text-slate-600"><span>Grade {profile?.grade ?? 'Not set'}</span><span>•</span><span>{preferences.learningLevel}</span><span>•</span><span>Ages {preferences.ageBand}</span><span>•</span><span>Generated {new Date().toLocaleDateString()}</span></div>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Lessons complete', value: stats.completedLessons, icon: BookOpen, tone: 'text-emerald-600' },
            { label: 'Quiz average', value: `${stats.averageScore}%`, icon: Target, tone: 'text-blue-600' },
            { label: 'Total XP', value: stats.totalXP, icon: Trophy, tone: 'text-violet-600' },
            { label: 'Current streak', value: `${stats.currentStreak}d`, icon: Flame, tone: 'text-orange-500' },
            { label: 'Study time', value: `${studyMinutes}m`, icon: BarChart3, tone: 'text-cyan-600' },
          ].map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm print:shadow-none"><Icon className={`h-6 w-6 ${tone}`} /><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></article>)}
        </div>

        <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm print:shadow-none">
          <div className="border-b border-slate-200 p-6"><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Mastery by subject</p><h2 className="mt-2 text-3xl font-black">Evidence across ten worlds</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left"><thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-6 py-4">Subject</th><th className="px-6 py-4">Lessons</th><th className="px-6 py-4">Completion</th><th className="px-6 py-4">Quiz average</th><th className="px-6 py-4">Mastery</th></tr></thead><tbody>{subjects.map((item) => <tr key={item.subject} className="border-t border-slate-100"><td className="px-6 py-4 font-black">{item.subject}</td><td className="px-6 py-4">{item.completedLessons}/{item.totalLessons}</td><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${item.completionPercent}%` }} /></div><span className="text-sm font-bold">{item.completionPercent}%</span></div></td><td className="px-6 py-4">{item.averageScore === null ? 'Not assessed' : `${item.averageScore}%`}</td><td className="px-6 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{item.mastery}</span></td></tr>)}</tbody></table></div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm print:shadow-none"><p className="text-sm font-black uppercase tracking-[0.15em] text-emerald-700">Strength signals</p><h2 className="mt-2 text-2xl font-black">What is going well</h2>{strongest.length ? <div className="mt-5 space-y-3">{strongest.map((item) => <div key={item.subject} className="rounded-2xl bg-emerald-50 p-4"><div className="flex items-center justify-between gap-3"><span className="font-black">{item.subject}</span><span className="text-lg font-black text-emerald-800">{item.averageScore}%</span></div><p className="mt-1 text-sm text-emerald-900">{item.quizAttempts} quiz attempt{item.quizAttempts === 1 ? '' : 's'} · {item.completedLessons} lessons complete</p></div>)}</div> : <p className="mt-5 text-slate-500">Complete quizzes to establish strength signals.</p>}</section>
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm print:shadow-none"><p className="text-sm font-black uppercase tracking-[0.15em] text-rose-700">Next focus</p><h2 className="mt-2 text-2xl font-black">Where practice can help</h2>{weakest.length ? <div className="mt-5 space-y-3">{weakest.map((item) => <button key={item.subject} onClick={() => navigate(`/subject/${item.subject.toLowerCase().replace(/\s+/g, '-')}`)} className="flex w-full items-center justify-between rounded-2xl bg-rose-50 p-4 text-left print:pointer-events-none"><span><span className="block font-black">{item.subject}</span><span className="mt-1 block text-sm text-rose-900">{item.averageScore}% average across {item.quizAttempts} attempt{item.quizAttempts === 1 ? '' : 's'}</span></span><ArrowRight className="h-4 w-4 print:hidden" /></button>)}</div> : <p className="mt-5 text-slate-500">No evidence-based focus area yet. More quiz activity is needed.</p>}</section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm print:shadow-none"><p className="text-sm font-black uppercase tracking-[0.15em] text-blue-700">Recent quiz trend</p><h2 className="mt-2 text-2xl font-black">Latest assessment signals</h2>{trend.length ? <div className="mt-5 flex min-h-44 items-end gap-3">{trend.map((attempt) => <div key={`${attempt.quizId}-${attempt.attemptDate}`} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-black">{attempt.percentage}%</span><div className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: `${Math.max(12, attempt.percentage)}%` }} title={`${attempt.subject ?? 'Quiz'}: ${attempt.percentage}%`} /><span className="max-w-20 truncate text-[0.65rem] font-bold text-slate-500">{attempt.subject ?? 'Quiz'}</span></div>)}</div> : <p className="mt-5 text-slate-500">No quiz trend is available yet.</p>}</section>
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm print:shadow-none"><p className="text-sm font-black uppercase tracking-[0.15em] text-amber-700">Recent activity</p><h2 className="mt-2 text-2xl font-black">Latest learning evidence</h2>{recent.length ? <div className="mt-5 divide-y divide-slate-100">{recent.map((item) => { const lesson = item.type === 'lesson' ? lessons.find((candidate) => candidate.id === item.id) : null; return <div key={`${item.type}-${item.id}-${item.timestamp}`} className="py-3"><p className="font-black">{item.type === 'lesson' ? lesson?.title ?? 'Completed lesson' : `${item.subject ?? 'Quiz'} assessment`}</p><p className="mt-1 text-sm text-slate-500">{new Date(item.timestamp).toLocaleDateString()}{item.type === 'quiz' ? ` · ${item.percentage}%` : ''}</p></div> })}</div> : <p className="mt-5 text-slate-500">Learning activity will appear after lessons and quizzes are completed.</p>}</section>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6 print:border-slate-300 print:bg-white"><div className="flex items-start gap-4"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-cyan-700" /><div><h2 className="text-xl font-black">Report scope and privacy</h2><p className="mt-2 leading-7 text-cyan-950 print:text-slate-700">This report uses only information currently stored in this browser. It does not include cloud records, school verification or teacher grading. Parents and teachers should use it as a conversation aid, not as a formal academic judgement.</p></div></div></section>
      </section>
    </main>
  )
}
