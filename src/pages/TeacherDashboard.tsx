import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Save, ShieldCheck, Sparkles, Target, Users } from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage, type TeacherPlan } from '../utils/storage'

const subjects = [...new Set(lessons.map((lesson) => lesson.subject))]

export default function TeacherDashboard() {
  const [, navigate] = useLocation()
  const [plan, setPlan] = useState<TeacherPlan>(storage.getTeacherPlan())
  const [saved, setSaved] = useState(false)

  const subjectSummary = useMemo(() => subjects.map((subject) => ({
    subject,
    lessons: lessons.filter((lesson) => lesson.subject === subject).length,
    questions: quizzes.filter((question) => question.subject === subject).length,
  })), [])

  const focusLessons = lessons.filter((lesson) => lesson.subject === plan.focusSubject).slice(0, 4)

  function update<K extends keyof TeacherPlan>(key: K, value: TeacherPlan[K]) {
    setSaved(false)
    setPlan((current) => ({ ...current, [key]: value }))
  }

  function savePlan() {
    storage.setTeacherPlan(plan)
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-[#071124] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(14,165,233,0.24),_transparent_30%),radial-gradient(circle_at_88%_5%,_rgba(16,185,129,0.2),_transparent_28%),linear-gradient(135deg,#071124,#10213f,#0e2a2c)]" />
        <div className="container relative z-10 py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-200"><GraduationCap className="h-4 w-4" /> Teacher workspace preview</div>
              <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] sm:text-6xl">Plan today’s learning mission.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">Browse the live KirthiVerse lesson library and save a local class plan. Secure teacher accounts, rosters and cloud assignments arrive only after the identity and school-tenancy releases.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><BookOpen className="mx-auto h-5 w-5 text-cyan-300" /><div className="mt-2 text-2xl font-black">{lessons.length}</div><div className="text-xs font-bold uppercase text-slate-300">lessons</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><Target className="mx-auto h-5 w-5 text-violet-300" /><div className="mt-2 text-2xl font-black">{quizzes.length}</div><div className="text-xs font-bold uppercase text-slate-300">questions</div></div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center"><Sparkles className="mx-auto h-5 w-5 text-emerald-300" /><div className="mt-2 text-2xl font-black">{subjects.length}</div><div className="text-xs font-bold uppercase text-slate-300">subjects</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 text-slate-950">
        <div className="container grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ClipboardList className="h-6 w-6" /></div><div><p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">Local planning tool</p><h2 className="text-2xl font-black">Today’s class plan</h2></div></div>
            <div className="mt-7 grid gap-5">
              <label><span className="mb-2 block font-black">Class or group name</span><input value={plan.className} onChange={(event) => update('className', event.target.value.slice(0, 60))} placeholder="Example: Year 5 Maths" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
              <label><span className="mb-2 block font-black">Focus subject</span><select value={plan.focusSubject} onChange={(event) => update('focusSubject', event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-emerald-500">{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
              <label><span className="mb-2 block font-black">Assignment or lesson focus</span><input value={plan.assignmentTitle} onChange={(event) => update('assignmentTitle', event.target.value.slice(0, 100))} placeholder="Example: Fractions revision" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
              <label><span className="mb-2 block font-black">Target date</span><input type="date" value={plan.dueDate} onChange={(event) => update('dueDate', event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-emerald-500" /></label>
              <label><span className="mb-2 block font-black">Teacher notes</span><textarea value={plan.notes} onChange={(event) => update('notes', event.target.value.slice(0, 500))} rows={4} placeholder="Add objectives, differentiation or follow-up notes" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label>
              <button onClick={savePlan} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white"><Save className="h-4 w-4" /> Save on this device</button>
              {saved && <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Plan saved locally.</p>}
            </div>
          </section>

          <div className="space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">Suggested content</p><h2 className="mt-1 text-2xl font-black">{plan.focusSubject} lesson options</h2></div><CalendarDays className="h-7 w-7 text-violet-600" /></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {focusLessons.map((lesson) => (
                  <button key={lesson.id} onClick={() => navigate(`/lesson/${lesson.id}`)} className="rounded-2xl border border-slate-200 p-5 text-left hover:border-violet-300 hover:shadow-md"><p className="text-xs font-black uppercase tracking-wide text-violet-700">{lesson.category}</p><h3 className="mt-2 text-lg font-black">{lesson.title}</h3><p className="mt-2 text-sm text-slate-500">{lesson.duration} min · {lesson.difficulty}</p></button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">Content coverage</p><h2 className="mt-1 text-2xl font-black">Subject library</h2></div><Users className="h-7 w-7 text-cyan-600" /></div>
              <div className="mt-6 divide-y divide-slate-100">
                {subjectSummary.map((item) => <div key={item.subject} className="flex items-center justify-between py-3"><span className="font-bold">{item.subject}</span><span className="text-sm text-slate-500">{item.lessons} lessons · {item.questions} questions</span></div>)}
              </div>
            </section>

            <section className="flex gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" /><div><h2 className="font-black text-blue-950">Current release boundary</h2><p className="mt-2 text-sm leading-6 text-blue-800">This page does not create teacher accounts, students, classes or remote assignments. Those require verified adult identity, school tenancy, role-based access, audit logs and India-first privacy controls in KVS-PLATFORM-002 to 004.</p></div></section>
          </div>
        </div>
      </section>
    </main>
  )
}
