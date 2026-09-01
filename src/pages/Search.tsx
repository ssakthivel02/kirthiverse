import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, BookOpen, Filter, Search as SearchIcon, Target, X } from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'

const subjects = ['All', ...new Set(lessons.map((lesson) => lesson.subject))]
const MAX_QUERY_LENGTH = 120

type ResultType = 'all' | 'lesson' | 'quiz'

function initialSearchQuery() {
  if (typeof window === 'undefined') return ''
  return (new URLSearchParams(window.location.search).get('q') ?? '').slice(0, MAX_QUERY_LENGTH)
}

export default function Search() {
  const [, navigate] = useLocation()
  const [query, setQuery] = useState(initialSearchQuery)
  const [subject, setSubject] = useState('All')
  const [type, setType] = useState<ResultType>('all')

  useEffect(() => {
    const url = new URL(window.location.href)
    if (query.trim()) url.searchParams.set('q', query.trim())
    else url.searchParams.delete('q')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [query])

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    const lessonResults = lessons
      .filter((lesson) => type !== 'quiz' && (subject === 'All' || lesson.subject === subject))
      .filter((lesson) => `${lesson.title} ${lesson.subject} ${lesson.category} ${lesson.objectives.join(' ')} ${lesson.summary}`.toLowerCase().includes(normalized))
      .map((lesson) => ({ id: lesson.id, kind: 'lesson' as const, subject: lesson.subject, title: lesson.title, description: lesson.summary, meta: `${lesson.duration} min · ${lesson.difficulty}`, route: `/lesson/${lesson.id}` }))
    const quizResults = quizzes
      .filter((quiz) => type !== 'lesson' && (subject === 'All' || quiz.subject === subject))
      .filter((quiz) => `${quiz.question} ${quiz.subject} ${quiz.explanation} ${quiz.difficulty}`.toLowerCase().includes(normalized))
      .map((quiz) => ({ id: quiz.id, kind: 'quiz' as const, subject: quiz.subject, title: quiz.question, description: quiz.explanation, meta: `${quiz.type} · ${quiz.difficulty}`, route: `/quiz/${quiz.lessonId}` }))
    return [...lessonResults, ...quizResults].slice(0, 60)
  }, [query, subject, type])

  const clearSearch = () => {
    setQuery('')
    setSubject('All')
    setType('all')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Offline content search</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">Find your next learning mission.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Search all 77 lessons and 77 quiz questions without sending your query to a server or third party.</p>
          <label className="relative mt-8 block max-w-4xl">
            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
            <span className="sr-only">Search lessons and quizzes</span>
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              maxLength={MAX_QUERY_LENGTH}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try fractions, planets, Tamil letters or coding"
              className="min-h-16 w-full rounded-2xl border border-white/10 bg-white px-14 pr-14 text-lg font-bold text-slate-950 shadow-xl outline-none focus:ring-4 focus:ring-cyan-300/30"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>}
          </label>
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-8 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
          <label className="flex items-center gap-3"><Filter className="h-5 w-5 text-slate-500" /><span className="font-black">Subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="flex flex-wrap gap-2" aria-label="Result type">
            {([['all', 'All'], ['lesson', 'Lessons'], ['quiz', 'Quizzes']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setType(value)} aria-pressed={type === value} className={`rounded-xl px-4 py-3 text-sm font-black ${type === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}
          </div>
        </div>

        {!query.trim() ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center"><SearchIcon className="mx-auto h-12 w-12 text-slate-400" /><h2 className="mt-5 text-3xl font-black">Search the learning universe</h2><p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">Use a topic, subject, skill or question. Results are calculated locally from the content included in this website.</p></div>
        ) : results.length ? (
          <div><p className="mb-5 text-sm font-black uppercase tracking-[0.16em] text-violet-700" aria-live="polite">{results.length} result{results.length === 1 ? '' : 's'}</p><div className="grid gap-4 lg:grid-cols-2">{results.map((result) => <button type="button" key={`${result.kind}-${result.id}`} onClick={() => navigate(result.route)} className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-violet-300 hover:shadow-lg"><div className="flex items-start gap-4"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${result.kind === 'lesson' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>{result.kind === 'lesson' ? <BookOpen className="h-6 w-6" /> : <Target className="h-6 w-6" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><span>{result.subject}</span><span>·</span><span>{result.kind}</span><span>·</span><span>{result.meta}</span></div><h2 className="mt-2 text-xl font-black">{result.title}</h2><p className="mt-2 line-clamp-2 leading-6 text-slate-600">{result.description}</p></div><ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" /></div></button>)}</div></div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center"><SearchIcon className="mx-auto h-12 w-12 text-slate-400" /><h2 className="mt-5 text-3xl font-black">No matching learning content</h2><p className="mt-3 text-slate-500" aria-live="polite">Try a broader keyword, another subject or all content types.</p><button type="button" onClick={clearSearch} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Reset search</button></div>
        )}
      </section>
    </main>
  )
}
