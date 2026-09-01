import { useMemo, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Brain,
  CheckCircle2,
  Clock3,
  Lightbulb,
  ListChecks,
  Printer,
  Sparkles,
  Target,
} from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage } from '../utils/storage'

const subjectColours: Record<string, string> = {
  Mathematics: 'from-blue-500 via-indigo-500 to-violet-600',
  Science: 'from-emerald-500 via-teal-500 to-cyan-600',
  English: 'from-fuchsia-500 via-purple-500 to-indigo-600',
  Coding: 'from-orange-500 via-rose-500 to-pink-600',
  Geography: 'from-cyan-500 via-sky-500 to-blue-600',
  History: 'from-amber-500 via-orange-500 to-red-600',
  Tamil: 'from-red-500 via-rose-500 to-fuchsia-600',
  Music: 'from-pink-500 via-fuchsia-500 to-purple-600',
  Arts: 'from-violet-500 via-indigo-500 to-blue-600',
  'Life Skills': 'from-lime-500 via-emerald-500 to-teal-600',
}

export default function LessonPage() {
  const [, params] = useRoute('/lesson/:id')
  const [, navigate] = useLocation()
  const lessonId = params?.id ?? ''
  const lesson = lessons.find((item) => item.id === lessonId)
  const initialProgress = storage.getLessonProgress(lessonId)
  const [completed, setCompleted] = useState(initialProgress?.completed ?? false)
  const [bookmarked, setBookmarked] = useState(initialProgress?.bookmarked ?? false)
  const [status, setStatus] = useState('')

  const subjectLessons = useMemo(() => lesson ? lessons.filter((item) => item.subject === lesson.subject).sort((a, b) => a.order - b.order) : [], [lesson])
  const lessonIndex = lesson ? subjectLessons.findIndex((item) => item.id === lesson.id) : -1
  const previousLesson = lessonIndex > 0 ? subjectLessons[lessonIndex - 1] : undefined
  const nextLesson = lessonIndex >= 0 && lessonIndex < subjectLessons.length - 1 ? subjectLessons[lessonIndex + 1] : undefined
  const quizCount = lesson ? quizzes.filter((question) => question.lessonId === lesson.id).length : 0

  if (!lesson) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 py-12 text-slate-950">
        <section className="max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Brain className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-3xl font-black">Lesson not found</h1>
          <p className="mt-3 leading-7 text-slate-600">The requested lesson is not part of the current learning library.</p>
          <button type="button" onClick={() => navigate('/learning-worlds')} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Open Learning Worlds</button>
        </section>
      </main>
    )
  }

  const gradient = subjectColours[lesson.subject] ?? 'from-blue-500 to-violet-600'
  const subjectSlug = lesson.subject.toLowerCase().replace(/\s+/g, '-')
  const progressPercent = Math.round(((lessonIndex + 1) / subjectLessons.length) * 100)

  function handleComplete() {
    const awarded = storage.markLessonComplete(lessonId)
    setCompleted(true)
    setStatus(awarded ? 'Lesson completed. 50 XP awarded.' : 'Lesson was already completed; no duplicate XP was added.')
  }

  function handleBookmark() {
    if (bookmarked) {
      storage.unbookmarkLesson(lessonId)
      setBookmarked(false)
      setStatus('Bookmark removed.')
    } else {
      storage.bookmarkLesson(lessonId)
      setBookmarked(true)
      setStatus('Lesson bookmarked on this device.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white`}>
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/15 bg-white/10" />
        <div className="container relative py-12 sm:py-16">
          <button type="button" onClick={() => navigate(`/subject/${subjectSlug}`)} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 font-black backdrop-blur hover:bg-white/20"><ArrowLeft className="h-4 w-4" /> Back to {lesson.subject}</button>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/75">{lesson.subject} · {lesson.category}</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">{lesson.title}</h1>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2"><Clock3 className="h-4 w-4" /> {lesson.duration} minutes</span>
                <span className="rounded-full bg-white/15 px-4 py-2 capitalize">{lesson.difficulty}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2"><Target className="h-4 w-4" /> {quizCount} quiz question{quizCount === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="min-w-56 rounded-2xl bg-slate-950/20 p-5 backdrop-blur"><div className="flex justify-between text-sm font-black"><span>Subject journey</span><span>{lessonIndex + 1}/{subjectLessons.length}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-white" style={{ width: `${progressPercent}%` }} /></div><p className="mt-3 text-sm text-white/80">{progressPercent}% through {lesson.subject}</p></div>
          </div>
        </div>
      </section>

      <div className="container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="space-y-8">
          <section id="objectives" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><ListChecks className="h-6 w-6 text-emerald-600" /><h2 className="text-2xl font-black">Learning objectives</h2></div>
            <ul className="mt-6 grid gap-3">{lesson.objectives.map((objective) => <li key={objective} className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><span className="font-semibold leading-7 text-emerald-950">{objective}</span></li>)}</ul>
          </section>

          <section id="explanation" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><Brain className="h-6 w-6 text-violet-600" /><h2 className="text-2xl font-black">Understand the idea</h2></div>
            <p className="mt-6 text-lg leading-8 text-slate-700">{lesson.explanation}</p>
          </section>

          <section id="examples" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><Lightbulb className="h-6 w-6 text-amber-600" /><h2 className="text-2xl font-black">Worked examples</h2></div>
            <ol className="mt-6 grid gap-4">{lesson.examples.map((example, index) => <li key={example} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">{index + 1}</span><code className="overflow-x-auto pt-1 font-mono text-base leading-7 text-slate-800">{example}</code></li>)}</ol>
          </section>

          <section id="summary" className="rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
            <div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-cyan-200" /><h2 className="text-2xl font-black">Mission summary</h2></div>
            <p className="mt-5 text-lg leading-8 text-violet-50">{lesson.summary}</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-5"><p className="text-sm font-black uppercase tracking-[0.15em] text-cyan-200">Explain it yourself</p><p className="mt-2 leading-7">Pause and describe the main idea in your own words before taking the quiz. Teaching the idea is a strong mastery check.</p></div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black">Complete this mission</h2>
            <p className="mt-3 leading-7 text-slate-600">Mark the lesson complete only after reading the explanation and examples. XP is awarded once.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleBookmark} aria-pressed={bookmarked} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-black ${bookmarked ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-800'}`}>{bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}{bookmarked ? 'Bookmarked' : 'Bookmark lesson'}</button>
              <button type="button" onClick={handleComplete} className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 font-black text-white ${completed ? 'bg-emerald-600' : 'bg-gradient-to-r from-violet-600 to-cyan-600'}`}><CheckCircle2 className="h-5 w-5" />{completed ? 'Lesson completed' : 'Mark lesson complete'}</button>
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-950 px-5 font-black"><Printer className="h-4 w-4" /> Print</button>
            </div>
            <p className="mt-4 min-h-5 text-sm font-bold text-emerald-700" role="status" aria-live="polite">{status}</p>
          </section>

          <nav className="grid gap-4 sm:grid-cols-2" aria-label="Lesson sequence">
            {previousLesson ? <button type="button" onClick={() => navigate(`/lesson/${previousLesson.id}`)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-violet-300"><span className="text-sm font-black text-slate-500">Previous lesson</span><span className="mt-2 flex items-center gap-2 font-black"><ArrowLeft className="h-4 w-4" /> {previousLesson.title}</span></button> : <div />}
            {nextLesson ? <button type="button" onClick={() => navigate(`/lesson/${nextLesson.id}`)} className="rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm hover:border-violet-300"><span className="text-sm font-black text-slate-500">Next lesson</span><span className="mt-2 flex items-center justify-end gap-2 font-black">{nextLesson.title} <ArrowRight className="h-4 w-4" /></span></button> : <button type="button" onClick={() => navigate(`/subject/${subjectSlug}`)} className="rounded-2xl border border-slate-200 bg-white p-5 text-right font-black shadow-sm">Finish subject view <ArrowRight className="ml-2 inline h-4 w-4" /></button>}
          </nav>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Lesson map</h2><nav className="mt-4 grid gap-2 text-sm font-bold" aria-label="Lesson sections"><a href="#objectives" className="rounded-lg px-3 py-2 hover:bg-slate-100">1. Objectives</a><a href="#explanation" className="rounded-lg px-3 py-2 hover:bg-slate-100">2. Explanation</a><a href="#examples" className="rounded-lg px-3 py-2 hover:bg-slate-100">3. Examples</a><a href="#summary" className="rounded-lg px-3 py-2 hover:bg-slate-100">4. Summary</a></nav></section>
          <section className="rounded-[1.5rem] bg-slate-950 p-5 text-white"><p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">Knowledge check</p><h2 className="mt-2 text-xl font-black">Ready to practise?</h2><p className="mt-3 text-sm leading-6 text-slate-300">{quizCount ? `${quizCount} question${quizCount === 1 ? '' : 's'} will check this lesson.` : 'No quiz has been published for this lesson yet.'}</p><button type="button" disabled={!quizCount} onClick={() => navigate(`/quiz/${lesson.id}`)} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">Take lesson quiz <ArrowRight className="h-4 w-4" /></button></section>
        </aside>
      </div>
    </main>
  )
}
