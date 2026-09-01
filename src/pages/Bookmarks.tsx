import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, Bookmark, BookOpen, CheckCircle2, Search, Trash2 } from 'lucide-react'
import { lessons } from '../content/lessons'
import { storage } from '../utils/storage'

export default function Bookmarks() {
  const [, navigate] = useLocation()
  const [version, setVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('All')
  const progress = storage.getLessonsProgress()
  const bookmarkIds = storage.getBookmarks()
  const subjects = ['All', ...new Set(lessons.filter((lesson) => bookmarkIds.includes(lesson.id)).map((lesson) => lesson.subject))]

  const savedLessons = useMemo(() => lessons
    .filter((lesson) => bookmarkIds.includes(lesson.id))
    .filter((lesson) => subject === 'All' || lesson.subject === subject)
    .filter((lesson) => `${lesson.title} ${lesson.subject} ${lesson.category}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.order - b.order), [bookmarkIds, query, subject, version])

  function removeBookmark(id: string) {
    storage.unbookmarkLesson(id)
    setVersion((value) => value + 1)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Saved learning</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Your bookmark library.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Keep useful lessons close, continue unfinished work and remove items when they are no longer needed.</p>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-3xl font-black">{bookmarkIds.length}</p><p className="mt-1 text-sm text-slate-300">Saved lessons</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-3xl font-black">{bookmarkIds.filter((id) => progress[id]?.completed).length}</p><p className="mt-1 text-sm text-slate-300">Completed</p></div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-1"><p className="text-3xl font-black">{bookmarkIds.filter((id) => !progress[id]?.completed).length}</p><p className="mt-1 text-sm text-slate-300">Ready to continue</p></div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><span className="sr-only">Search saved lessons</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved lessons" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-semibold" /></label>
          <label><span className="sr-only">Filter by subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-black md:w-auto">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>

        {savedLessons.length ? <div className="mt-8 grid gap-5 lg:grid-cols-2">{savedLessons.map((lesson) => {
          const completed = progress[lesson.id]?.completed
          return (
            <article key={lesson.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-700">{lesson.subject} · {lesson.category}</p><h2 className="mt-2 text-2xl font-black">{lesson.title}</h2></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${completed ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>{completed ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}{completed ? 'Completed' : 'Continue'}</span></div>
              <p className="mt-4 line-clamp-3 leading-7 text-slate-600">{lesson.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-500"><span className="rounded-full bg-slate-100 px-3 py-1">{lesson.duration} minutes</span><span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{lesson.difficulty}</span></div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={() => navigate(`/lesson/${lesson.id}`)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-black text-white">Open lesson <ArrowRight className="h-4 w-4" /></button><button onClick={() => removeBookmark(lesson.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 font-black text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Remove</button></div>
            </article>
          )
        })}</div> : <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center"><Bookmark className="mx-auto h-12 w-12 text-slate-400" /><h2 className="mt-5 text-2xl font-black">No saved lessons found</h2><p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">Bookmark lessons from any subject world, or clear the current filters to see saved content.</p><button onClick={() => navigate('/learning-worlds')} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Explore learning worlds <ArrowRight className="h-4 w-4" /></button></div>}
      </section>
    </main>
  )
}
