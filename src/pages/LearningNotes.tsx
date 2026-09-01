import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Plus, Trash2 } from 'lucide-react'
import { lessons } from '../content/lessons'
import { addLearningNote, clearLearningNotes, deleteLearningNote, getLearningNotes, setLearningNoteCompleted, type NoteCategory } from '../utils/learningNotes'

const categories: NoteCategory[] = ['Strength', 'Needs practice', 'Question', 'Celebration', 'Follow-up']

export default function LearningNotes() {
  const [notes, setNotes] = useState(() => getLearningNotes())
  const [category, setCategory] = useState<NoteCategory>('Follow-up')
  const [subject, setSubject] = useState('General')
  const [note, setNote] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [message, setMessage] = useState('')
  const subjects = useMemo(() => ['General', ...new Set(lessons.map((lesson) => lesson.subject))], [])
  const shown = notes.filter((item) => showCompleted || !item.completed)

  function refresh(status: string) {
    setNotes(getLearningNotes())
    setMessage(status)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const saved = addLearningNote({ category, subject, note, followUpDate })
    if (!saved) {
      setMessage('Enter a note before saving.')
      return
    }
    setNote('')
    setFollowUpDate('')
    refresh('Learning note saved on this device.')
  }

  function clearAll() {
    const confirmation = window.prompt('Type CLEAR to remove all local learning notes.')
    if (confirmation !== 'CLEAR') {
      setMessage('Clear cancelled.')
      return
    }
    clearLearningNotes()
    refresh('All local learning notes cleared.')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white"><div className="container py-14"><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Family and teacher reflection</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Learning Notes</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Record strengths, questions and follow-ups on this device. Do not enter passwords, addresses, phone numbers, precise birth details, Aadhaar, APAAR or medical information.</p></div></section>

      <section className="container grid gap-8 py-10 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3"><Plus className="h-6 w-6 text-violet-600" /><h2 className="text-2xl font-black">Add a learning note</h2></div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">Category<select value={category} onChange={(event) => setCategory(event.target.value as NoteCategory)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-black">Subject<select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold">{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className="mt-5 grid gap-2 text-sm font-black">Observation or follow-up<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={800} rows={7} placeholder="Example: Review fractions again after the next maths quiz." className="rounded-xl border border-slate-300 p-4 font-semibold leading-7 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /><span className="text-right text-xs font-normal text-slate-500">{note.length}/800</span></label>
          <label className="mt-5 grid gap-2 text-sm font-black">Optional follow-up date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="min-h-12 rounded-xl border border-slate-300 px-4 font-semibold" /></label>
          <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white"><Plus className="h-4 w-4" /> Save local note</button>
          <p className="mt-4 min-h-6 text-sm font-bold text-emerald-700" role="status" aria-live="polite">{message}</p>
        </form>

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-3xl font-black">Current notes</h2><p className="mt-2 text-slate-600">Up to 100 notes are retained locally.</p></div><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-black"><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} className="h-5 w-5" /> Show completed</label></div>

          {shown.length ? <div className="mt-6 space-y-4">{shown.map((item) => <article key={item.id} className={`rounded-[1.5rem] border bg-white p-5 shadow-sm ${item.completed ? 'border-emerald-200 opacity-75' : 'border-slate-200'}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">{item.category}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.subject}</span>{item.followUpDate && <span className="text-xs font-bold text-slate-500">Follow-up {new Date(`${item.followUpDate}T00:00:00`).toLocaleDateString()}</span>}</div><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{item.note}</p><p className="mt-3 text-xs font-bold text-slate-500">Saved {new Date(item.createdAt).toLocaleString()}</p></div><div className="flex gap-2"><button type="button" onClick={() => { setLearningNoteCompleted(item.id, !item.completed); refresh(item.completed ? 'Note reopened.' : 'Note marked complete.') }} aria-label={item.completed ? 'Reopen note' : 'Mark note complete'} className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></button><button type="button" onClick={() => { deleteLearningNote(item.id); refresh('Note deleted.') }} aria-label="Delete note" className="grid h-11 w-11 place-items-center rounded-xl border border-red-300 bg-red-50 text-red-700"><Trash2 className="h-5 w-5" /></button></div></div></article>)}</div> : <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm"><ClipboardList className="mx-auto h-12 w-12 text-slate-400" /><h2 className="mt-4 text-2xl font-black">No notes in this view</h2><p className="mt-3 text-slate-600">Add a strength, question or follow-up using the form.</p></section>}

          {notes.length > 0 && <button type="button" onClick={clearAll} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-black text-red-800"><Trash2 className="h-4 w-4" /> Clear all notes</button>}
        </div>
      </section>
    </main>
  )
}
