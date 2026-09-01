import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, BookOpen, Download, Filter, Search, Trophy } from 'lucide-react'
import { lessons } from '../content/lessons'
import { storage } from '../utils/storage'

interface TimelineItem {
  id: string
  type: 'lesson' | 'quiz'
  title: string
  subject: string
  timestamp: number
  detail: string
  route: string
}

export default function ActivityTimeline() {
  const [, navigate] = useLocation()
  const [type, setType] = useState<'all' | 'lesson' | 'quiz'>('all')
  const [subject, setSubject] = useState('All subjects')
  const [query, setQuery] = useState('')

  const items = useMemo<TimelineItem[]>(() => {
    const lessonItems = Object.entries(storage.getLessonsProgress())
      .filter(([, item]) => item.completed && item.completedDate)
      .map(([id, item]) => {
        const lesson = lessons.find((candidate) => candidate.id === id)
        return {
          id: `lesson:${id}:${item.completedDate}`,
          type: 'lesson' as const,
          title: lesson?.title ?? 'Lesson completed',
          subject: lesson?.subject ?? 'General',
          timestamp: item.completedDate ?? 0,
          detail: `${lesson?.duration ?? 0} minute lesson completed`,
          route: `/lesson/${id}`,
        }
      })
    const quizItems = storage.getQuizAttempts().map((attempt) => {
      const lesson = lessons.find((candidate) => candidate.id === attempt.lessonId)
      return {
        id: `quiz:${attempt.quizId}:${attempt.attemptDate}`,
        type: 'quiz' as const,
        title: lesson ? `${lesson.title} quiz` : 'Quiz attempt',
        subject: attempt.subject ?? lesson?.subject ?? 'General',
        timestamp: attempt.attemptDate,
        detail: `${attempt.percentage}% · ${attempt.score}/${attempt.totalQuestions} correct`,
        route: attempt.lessonId ? `/quiz/${attempt.lessonId}` : '/practice',
      }
    })
    return [...lessonItems, ...quizItems].sort((a, b) => b.timestamp - a.timestamp).slice(0, 500)
  }, [])

  const subjects = useMemo(() => ['All subjects', ...new Set(items.map((item) => item.subject))], [items])
  const filtered = useMemo(() => {
    const normalised = query.trim().toLowerCase()
    return items.filter((item) => {
      if (type !== 'all' && item.type !== type) return false
      if (subject !== 'All subjects' && item.subject !== subject) return false
      return !normalised || `${item.title} ${item.subject} ${item.detail}`.toLowerCase().includes(normalised)
    })
  }, [items, query, subject, type])

  function downloadTimeline() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), source: 'KirthiVerse local activity timeline', items: filtered }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kirthiverse-activity-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Local evidence trail</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Learning Activity</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Review completed lessons and quiz attempts saved in this browser. This is not remote monitoring and does not include activity from other devices.</p></div>
          <button type="button" onClick={downloadTimeline} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950"><Download className="h-4 w-4" aria-hidden="true" /> Export filtered view</button>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-4 sm:grid-cols-3"><article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><BookOpen className="h-6 w-6 text-emerald-600" aria-hidden="true" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Lesson events</p><p className="mt-2 text-3xl font-black">{items.filter((item) => item.type === 'lesson').length}</p></article><article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Trophy className="h-6 w-6 text-violet-600" aria-hidden="true" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Quiz events</p><p className="mt-2 text-3xl font-black">{items.filter((item) => item.type === 'quiz').length}</p></article><article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><Filter className="h-6 w-6 text-cyan-600" aria-hidden="true" /><p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-500">Shown now</p><p className="mt-2 text-3xl font-black">{filtered.length}</p></article></div>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Activity filters">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block"><span className="sr-only">Search activity</span><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity" className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 font-semibold outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" /></label>
            <label className="grid gap-1"><span className="sr-only">Filter activity by subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-black">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Filter activity type">{(['all', 'lesson', 'quiz'] as const).map((value) => <button type="button" key={value} onClick={() => setType(value)} aria-pressed={type === value} className={`rounded-lg px-4 py-2 text-sm font-black capitalize ${type === value ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>{value}</button>)}</div>
          </div>
        </section>

        {filtered.length ? <ol className="mt-8 space-y-4">{filtered.map((item) => <li key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${item.type === 'lesson' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>{item.type === 'lesson' ? <BookOpen className="h-6 w-6" aria-hidden="true" /> : <Trophy className="h-6 w-6" aria-hidden="true" />}</span><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{item.type}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.subject}</span></div><h2 className="mt-2 text-xl font-black">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.detail}</p><p className="mt-2 text-xs font-bold text-slate-500">{new Date(item.timestamp).toLocaleString()}</p></div></div><button type="button" onClick={() => navigate(item.route)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-950 px-4 font-black">Open <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div></li>)}</ol> : <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm"><h2 className="text-2xl font-black">No matching activity</h2><p className="mt-3 text-slate-600">Complete a lesson or quiz, or adjust the filters.</p><button type="button" onClick={() => navigate('/today')} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Open Today’s Mission</button></section>}
      </section>
    </main>
  )
}
