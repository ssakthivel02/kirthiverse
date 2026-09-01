import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, BookOpen, CalendarCheck2, ClipboardList, GraduationCap, Printer, Search, ShieldCheck, Target } from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage } from '../utils/storage'
import { getSubjectInsights } from '../utils/learningInsights'

const subjects = ['All', ...new Set(lessons.map((lesson) => lesson.subject))]
const difficulties = ['All', 'beginner', 'intermediate', 'advanced']

export default function TeacherResources() {
  const [, navigate] = useLocation()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const teacherPlan = storage.getTeacherPlan()
  const insights = getSubjectInsights()
  const focusInsight = insights.find((item) => item.subject === teacherPlan.focusSubject)

  const filteredLessons = useMemo(() => lessons
    .filter((lesson) => subject === 'All' || lesson.subject === subject)
    .filter((lesson) => difficulty === 'All' || lesson.difficulty === difficulty)
    .filter((lesson) => `${lesson.title} ${lesson.subject} ${lesson.category} ${lesson.summary}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order), [difficulty, query, subject])

  const subjectCounts = useMemo(() => subjects.filter((item) => item !== 'All').map((item) => ({
    subject: item,
    lessons: lessons.filter((lesson) => lesson.subject === item).length,
    questions: quizzes.filter((question) => question.subject === item).length,
  })), [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Teacher Resource Library</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl">Plan faster. Teach with clearer evidence.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Browse all local KirthiVerse lessons and quizzes, connect them to a classroom plan and use learner evidence without pretending a cloud class roster exists.</p></div>
          <div className="flex flex-wrap gap-3"><button onClick={() => navigate('/teacher-dashboard')} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950">Open teacher workspace <ArrowRight className="h-4 w-4" /></button><button onClick={() => window.print()} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 font-black text-white"><Printer className="h-4 w-4" /> Print resource list</button></div>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><BookOpen className="h-7 w-7 text-violet-600" /><p className="mt-5 text-4xl font-black">{lessons.length}</p><p className="mt-1 text-sm font-bold text-slate-500">Curated lessons</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Target className="h-7 w-7 text-blue-600" /><p className="mt-5 text-4xl font-black">{quizzes.length}</p><p className="mt-1 text-sm font-bold text-slate-500">Quiz questions</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><GraduationCap className="h-7 w-7 text-emerald-600" /><p className="mt-5 text-4xl font-black">{subjects.length - 1}</p><p className="mt-1 text-sm font-bold text-slate-500">Subject worlds</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><CalendarCheck2 className="h-7 w-7 text-orange-500" /><p className="mt-5 truncate text-2xl font-black">{teacherPlan.assignmentTitle || 'No assignment set'}</p><p className="mt-1 text-sm font-bold text-slate-500">Current local plan</p></article>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-700">Today’s teacher briefing</p><h2 className="mt-2 text-2xl font-black">{teacherPlan.className || 'Local planning mode'}</h2>
              <dl className="mt-5 space-y-4 text-sm"><div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-500">Focus subject</dt><dd className="mt-1 text-lg font-black">{teacherPlan.focusSubject}</dd></div><div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-500">Assignment</dt><dd className="mt-1 font-semibold">{teacherPlan.assignmentTitle || 'Create an assignment in Teacher Workspace'}</dd></div><div className="rounded-2xl bg-slate-50 p-4"><dt className="font-black text-slate-500">Target date</dt><dd className="mt-1 font-semibold">{teacherPlan.dueDate || 'Not set'}</dd></div></dl>
              {focusInsight && <div className="mt-5 rounded-2xl bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"><strong>Local learner signal:</strong> {focusInsight.completedLessons}/{focusInsight.totalLessons} {focusInsight.subject} lessons complete; {focusInsight.averageScore === null ? 'no quiz average yet' : `${focusInsight.averageScore}% quiz average`}.</div>}
              <button onClick={() => navigate('/teacher-dashboard')} className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-950 px-5 py-4 text-left font-black text-white">Edit teacher plan <ArrowRight className="h-4 w-4" /></button>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Content coverage</p><h2 className="mt-2 text-2xl font-black">Inventory by subject</h2><div className="mt-5 space-y-3">{subjectCounts.map((item) => <button key={item.subject} onClick={() => setSubject(item.subject)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left"><span className="font-black">{item.subject}</span><span className="text-sm font-bold text-slate-500">{item.lessons} lessons · {item.questions} Qs</span></button>)}</div></section>

            <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-700" /><div><h2 className="text-xl font-black">Local-only teacher mode</h2><p className="mt-2 text-sm leading-6 text-amber-950">This release does not create teacher accounts, classes or student rosters. School identity, role controls and tenant isolation belong to KVS-PLATFORM-002 and 004.</p></div></div></section>
          </aside>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><ClipboardList className="h-6 w-6" /></span><div><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Resource finder</p><h2 className="mt-1 text-3xl font-black">Find the right lesson</h2></div></div>
            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_auto]"><label className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><span className="sr-only">Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, topic or summary" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-semibold" /></label><label><span className="sr-only">Subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-black">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-black capitalize">{difficulties.map((item) => <option key={item}>{item}</option>)}</select></label></div>
            <p className="mt-4 text-sm font-bold text-slate-500">{filteredLessons.length} resource{filteredLessons.length === 1 ? '' : 's'} found</p>
            <div className="mt-5 divide-y divide-slate-100">{filteredLessons.slice(0, 30).map((lesson) => {
              const questionCount = quizzes.filter((question) => question.lessonId === lesson.id).length
              return <article key={lesson.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{lesson.subject} · {lesson.category} · {lesson.difficulty}</p><h3 className="mt-1 text-xl font-black">{lesson.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{lesson.summary}</p><p className="mt-2 text-xs font-bold text-slate-500">{lesson.duration} minutes · {questionCount} quiz question{questionCount === 1 ? '' : 's'}</p></div><button onClick={() => navigate(`/lesson/${lesson.id}`)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-black text-white">Preview <ArrowRight className="h-4 w-4" /></button></article>
            })}</div>
            {filteredLessons.length > 30 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Showing the first 30 matches. Narrow the filters to find a specific resource.</p>}
          </section>
        </div>
      </section>
    </main>
  )
}
