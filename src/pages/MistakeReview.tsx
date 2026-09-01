import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, CheckCircle2, RotateCcw, Search, Trash2, XCircle } from 'lucide-react'
import { clearMistakeBank, clearResolvedMistakes, getMistakeRecords, setMistakeResolved } from '../utils/mistakeBank'

export default function MistakeReview() {
  const [, navigate] = useLocation()
  const [records, setRecords] = useState(() => getMistakeRecords())
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open')
  const [subject, setSubject] = useState('All subjects')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  const subjects = useMemo(() => ['All subjects', ...new Set(records.map((item) => item.subject))], [records])
  const filtered = useMemo(() => {
    const normalised = query.trim().toLowerCase()
    return records.filter((item) => {
      if (statusFilter === 'open' && item.resolved) return false
      if (statusFilter === 'resolved' && !item.resolved) return false
      if (subject !== 'All subjects' && item.subject !== subject) return false
      if (normalised && !`${item.question} ${item.subject} ${item.explanation}`.toLowerCase().includes(normalised)) return false
      return true
    })
  }, [query, records, statusFilter, subject])

  const openCount = records.filter((item) => !item.resolved).length
  const resolvedCount = records.filter((item) => item.resolved).length

  function toggleResolved(questionId: string, lessonId: string, resolved: boolean) {
    setMistakeResolved(questionId, lessonId, resolved)
    setRecords(getMistakeRecords())
    setMessage(resolved ? 'Item marked reviewed.' : 'Item returned to the review queue.')
  }

  function removeResolved() {
    if (!resolvedCount) {
      setMessage('There are no resolved items to clear.')
      return
    }
    clearResolvedMistakes()
    setRecords(getMistakeRecords())
    setMessage('Resolved review items cleared from this device.')
  }

  function resetBank() {
    const confirmation = window.prompt('Type CLEAR to remove the complete local mistake review history.')
    if (confirmation !== 'CLEAR') {
      setMessage('Clear cancelled.')
      return
    }
    clearMistakeBank()
    setRecords([])
    setMessage('Mistake review history cleared from this device.')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-300">Mastery recovery</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Mistake Review</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Turn incorrect quiz answers into a focused local practice queue. Records stay in this browser and are automatically marked resolved when the same question is later answered correctly.</p>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6"><p className="text-sm font-black tracking-wide text-rose-700">Open review</p><p className="mt-3 text-4xl font-black text-rose-950">{openCount}</p></article>
          <article className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6"><p className="text-sm font-black tracking-wide text-emerald-700">Resolved</p><p className="mt-3 text-4xl font-black text-emerald-950">{resolvedCount}</p></article>
          <article className="rounded-[1.5rem] border border-violet-200 bg-violet-50 p-6"><p className="text-sm font-black tracking-wide text-violet-700">Subjects represented</p><p className="mt-3 text-4xl font-black text-violet-950">{Math.max(0, subjects.length - 1)}</p></article>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Mistake review filters">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block"><span className="sr-only">Search mistake review</span><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, subjects or explanations" className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 font-semibold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>
            <label className="grid gap-1"><span className="sr-only">Filter mistake review by subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-black">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Filter review status">{(['open', 'resolved', 'all'] as const).map((value) => <button type="button" key={value} onClick={() => setStatusFilter(value)} aria-pressed={statusFilter === value} className={`rounded-lg px-4 py-2 text-sm font-black capitalize ${statusFilter === value ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>{value}</button>)}</div>
          </div>
        </section>

        {filtered.length ? (
          <div className="mt-8 space-y-5">
            {filtered.map((item) => (
              <article key={`${item.lessonId}-${item.questionId}`} className={`rounded-[1.75rem] border bg-white p-6 shadow-sm ${item.resolved ? 'border-emerald-200' : 'border-rose-200'}`}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${item.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{item.resolved ? 'Resolved' : 'Needs review'}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.subject}</span><span className="text-xs font-bold text-slate-500">Seen {item.attempts} time{item.attempts === 1 ? '' : 's'}</span></div>
                    <h2 className="mt-4 text-2xl font-black leading-tight">{item.question}</h2>
                    <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-rose-50 p-4"><dt className="text-sm font-bold text-rose-700">Last answer</dt><dd className="mt-1 font-black text-rose-950">{item.selectedAnswer}</dd></div><div className="rounded-xl bg-emerald-50 p-4"><dt className="text-sm font-bold text-emerald-700">Correct answer</dt><dd className="mt-1 font-black text-emerald-950">{item.correctAnswer}</dd></div></dl>
                    <p className="mt-5 leading-7 text-slate-700"><span className="font-black">Why:</span> {item.explanation}</p>
                    <p className="mt-3 text-xs font-bold text-slate-500">Last reviewed {new Date(item.lastSeenAt).toLocaleString()}</p>
                  </div>
                  <div className="flex min-w-52 flex-col gap-3">
                    <button type="button" onClick={() => navigate(`/lesson/${item.lessonId}`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Review lesson <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                    <button type="button" onClick={() => navigate(`/quiz/${item.lessonId}`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-black text-white"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Retry quiz</button>
                    <button type="button" onClick={() => toggleResolved(item.questionId, item.lessonId, !item.resolved)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-950 px-5 font-black">{item.resolved ? <XCircle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}{item.resolved ? 'Reopen' : 'Mark reviewed'}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" /><h2 className="mt-4 text-2xl font-black">Nothing in this view</h2><p className="mt-3 text-slate-600">Complete a quiz or adjust the filters. Incorrect answers will appear here after the next quiz submission.</p><button type="button" onClick={() => navigate('/practice')} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Open Practice Hub</button></section>
        )}

        <section className="mt-10 flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">Local review controls</h2><p className="mt-2 text-sm text-slate-600">Resolved records can be removed without deleting open learning needs. Clearing all removes only the mistake bank.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={removeResolved} className="rounded-xl border border-slate-300 px-4 py-3 font-black">Clear resolved</button><button type="button" onClick={resetBank} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 font-black text-white"><Trash2 className="h-4 w-4" aria-hidden="true" /> Clear all</button></div></section>
        <p className="mt-4 min-h-6 text-sm font-bold text-emerald-700" role="status" aria-live="polite">{message}</p>
      </section>
    </main>
  )
}
