import { ChangeEvent, useState } from 'react'
import { useLocation } from 'wouter'
import { CheckCircle2, Download, Save, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react'
import { storage, type LearnerPreferences } from '../utils/storage'

const avatars = ['🚀', '🦊', '🐼', '🦁', '🐯', '🦉', '🐬', '🌟']
const subjects = ['Mathematics', 'Science', 'English', 'Coding', 'Geography', 'History', 'Tamil', 'Music', 'Arts', 'Life Skills']

export default function Profile() {
  const [, navigate] = useLocation()
  const existing = storage.getProfile() ?? { name: 'Learner', grade: '5', avatar: '🚀', joinDate: Date.now() }
  const [name, setName] = useState(existing.name)
  const [grade, setGrade] = useState(existing.grade)
  const [avatar, setAvatar] = useState(existing.avatar)
  const [preferences, setPreferences] = useState<LearnerPreferences>(storage.getPreferences())
  const [message, setMessage] = useState('')
  const [showReset, setShowReset] = useState(false)

  function toggleFavourite(subject: string) {
    setPreferences((current) => ({ ...current, favouriteSubjects: current.favouriteSubjects.includes(subject) ? current.favouriteSubjects.filter((item) => item !== subject) : [...current.favouriteSubjects, subject].slice(0, 4) }))
  }

  function save() {
    storage.initializeProfile(name, grade, avatar)
    storage.setPreferences(preferences)
    document.documentElement.classList.toggle('large-text', preferences.largerText)
    document.documentElement.classList.toggle('reduce-motion', preferences.reducedMotion)
    setMessage('Profile and preferences saved on this device.')
  }

  function exportData() {
    const blob = new Blob([storage.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'kirthiverse-progress-export.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Progress export created.')
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || file.size > 2_000_000) {
      setMessage('Import rejected. Choose a KirthiVerse JSON export under 2 MB.')
      return
    }
    const text = await file.text()
    if (!storage.importData(text)) {
      setMessage('Import rejected. The file is malformed or uses an incompatible schema.')
      return
    }
    setMessage('Progress imported. Reloading the profile view.')
    window.setTimeout(() => window.location.reload(), 500)
  }

  function reset() {
    storage.clearAllData()
    setShowReset(false)
    navigate('/onboarding')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white"><div className="container py-14"><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Learner profile</p><h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">Your identity, pace and data controls.</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Everything on this page is stored locally in the current release. No child email, phone number, address, precise date of birth or photograph is required.</p></div></section>

      <section className="container grid gap-8 py-10 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><UserRound className="h-6 w-6" /></div><div><p className="text-sm font-black uppercase tracking-wide text-cyan-700">Profile details</p><h2 className="text-2xl font-black">Edit learner setup</h2></div></div>
          <div className="mt-7 grid gap-5">
            <label><span className="mb-2 block font-black">Nickname</span><input value={name} onChange={(event) => setName(event.target.value.slice(0, 30))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-cyan-500" /></label>
            <label><span className="mb-2 block font-black">Grade</span><select value={grade} onChange={(event) => setGrade(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4">{Array.from({ length: 12 }, (_, index) => String(index + 1)).map((item) => <option key={item} value={item}>Grade {item}</option>)}</select></label>
            <div><span className="mb-2 block font-black">Avatar</span><div className="grid grid-cols-4 gap-3">{avatars.map((item) => <button key={item} type="button" onClick={() => setAvatar(item)} aria-pressed={avatar === item} className={`grid aspect-square place-items-center rounded-2xl border text-3xl ${avatar === item ? 'border-cyan-500 bg-cyan-50 ring-4 ring-cyan-100' : 'border-slate-200 bg-slate-50'}`}>{item}</button>)}</div></div>
            <label><span className="mb-2 block font-black">Learning level</span><select value={preferences.learningLevel} onChange={(event) => setPreferences((current) => ({ ...current, learningLevel: event.target.value as LearnerPreferences['learningLevel'] }))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4"><option>Starter</option><option>Explorer</option><option>Challenger</option></select></label>
            <label><span className="mb-2 block font-black">Daily goal</span><select value={preferences.dailyGoal} onChange={(event) => setPreferences((current) => ({ ...current, dailyGoal: Number(event.target.value) as LearnerPreferences['dailyGoal'] }))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4"><option value={1}>1 activity</option><option value={2}>2 activities</option><option value={3}>3 activities</option></select></label>
            <button onClick={save} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white"><Save className="h-4 w-4" /> Save profile</button>
          </div>
        </section>

        <div className="space-y-8">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Favourite subjects</h2><p className="mt-2 text-slate-500">Choose up to four for local recommendations.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{subjects.map((subject) => { const selected = preferences.favouriteSubjects.includes(subject); return <button key={subject} onClick={() => toggleFavourite(subject)} aria-pressed={selected} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 font-black ${selected ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50'}`}><span>{subject}</span>{selected && <CheckCircle2 className="h-5 w-5" />}</button> })}</div></section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Accessibility preferences</h2><div className="mt-5 space-y-4"><label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5"><span><span className="block font-black">Reduced motion</span><span className="text-sm text-slate-500">Limit animation and transition effects.</span></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => setPreferences((current) => ({ ...current, reducedMotion: event.target.checked }))} className="h-6 w-6" /></label><label className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5"><span><span className="block font-black">Larger text</span><span className="text-sm text-slate-500">Increase the main interface text size.</span></span><input type="checkbox" checked={preferences.largerText} onChange={(event) => setPreferences((current) => ({ ...current, largerText: event.target.checked }))} className="h-6 w-6" /></label></div></section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black">Local data controls</h2><p className="mt-2 text-slate-500">Export, restore or erase this browser’s KirthiVerse record.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><button onClick={exportData} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-black text-white"><Download className="h-4 w-4" /> Export</button><label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-black"><Upload className="h-4 w-4" /> Import<input type="file" accept="application/json,.json" onChange={importData} className="sr-only" /></label><button onClick={() => setShowReset(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 font-black text-red-800"><Trash2 className="h-4 w-4" /> Reset</button></div>{message && <p role="status" className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-800">{message}</p>}</section>

          <section className="flex gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" /><div><h2 className="font-black text-blue-950">Privacy boundary</h2><p className="mt-2 text-sm leading-6 text-blue-800">Cloud accounts, secure score synchronisation and school access are not enabled in this release. Export files may contain learning records; store them securely.</p></div></section>
        </div>
      </section>

      {showReset && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title"><div className="w-full max-w-md rounded-[1.75rem] bg-white p-7 shadow-2xl"><h2 id="reset-title" className="text-2xl font-black">Erase local learner data?</h2><p className="mt-3 leading-7 text-slate-600">This removes the profile, progress, quiz attempts, XP, bookmarks, preferences and local teacher plan from this browser. This action cannot be undone unless you exported a backup.</p><div className="mt-7 flex gap-3"><button onClick={() => setShowReset(false)} className="min-h-12 flex-1 rounded-xl border border-slate-300 font-black">Cancel</button><button onClick={reset} className="min-h-12 flex-1 rounded-xl bg-red-600 font-black text-white">Erase data</button></div></div></div>}
    </main>
  )
}
