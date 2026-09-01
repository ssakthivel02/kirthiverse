import { useRef, useState, type ChangeEvent } from 'react'
import { useLocation } from 'wouter'
import { Accessibility, Download, HardDrive, RotateCcw, Save, ShieldCheck, Upload } from 'lucide-react'
import { storage, type LearnerPreferences } from '../utils/storage'
import { clearAllLocalData, exportAllLocalData, getAllLocalData, importAllLocalData } from '../utils/localDataBundle'

export default function Settings() {
  const [, navigate] = useLocation()
  const [preferences, setPreferences] = useState<LearnerPreferences>(() => storage.getPreferences())
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const data = getAllLocalData()
  const exportedData = exportAllLocalData()
  const estimatedSize = new Blob([exportedData]).size

  function apply(next: LearnerPreferences) {
    setPreferences(next)
    storage.setPreferences(next)
    document.documentElement.classList.toggle('large-text', next.largerText)
    document.documentElement.classList.toggle('reduce-motion', next.reducedMotion)
    setMessage('Settings saved on this device.')
  }

  function update<K extends keyof LearnerPreferences>(key: K, value: LearnerPreferences[K]) {
    apply({ ...preferences, [key]: value })
  }

  function downloadProgress() {
    const blob = new Blob([exportAllLocalData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kirthiverse-progress-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Complete local-data export downloaded.')
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 1_000_000) {
      setMessage('Import rejected: file is larger than 1 MB.')
      return
    }
    const success = importAllLocalData(await file.text())
    if (!success) {
      setMessage('Import rejected: this is not a valid KirthiVerse progress file.')
      return
    }
    setPreferences(storage.getPreferences())
    setMessage('Progress, goals, sessions, mistake review and learning notes imported. Reloading…')
    window.setTimeout(() => window.location.reload(), 600)
  }

  function resetProgress() {
    const confirmation = window.prompt('Type RESET to remove all KirthiVerse progress, goals, timed sessions, mistake review and learning notes from this device.')
    if (confirmation !== 'RESET') {
      setMessage('Reset cancelled.')
      return
    }
    clearAllLocalData()
    navigate('/onboarding')
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Learner controls</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Settings, accessibility and privacy</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Current progress is stored only in this browser. No child email, phone number, address or precise location is collected by this local-first release.</p>
        </div>
      </section>

      <div className="container grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><Accessibility className="h-6 w-6 text-violet-600" /><h2 className="text-2xl font-black">Learning preferences</h2></div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black">Language
                <select value={preferences.language} onChange={(event) => update('language', event.target.value as LearnerPreferences['language'])} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold">
                  <option>English</option><option>Tamil</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black">Learning level
                <select value={preferences.learningLevel} onChange={(event) => update('learningLevel', event.target.value as LearnerPreferences['learningLevel'])} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold">
                  <option>Starter</option><option>Explorer</option><option>Challenger</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black">Daily activity goal
                <select value={preferences.dailyGoal} onChange={(event) => update('dailyGoal', Number(event.target.value) as LearnerPreferences['dailyGoal'])} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold">
                  <option value={1}>1 activity</option><option value={2}>2 activities</option><option value={3}>3 activities</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black">Age band
                <select value={preferences.ageBand} onChange={(event) => update('ageBand', event.target.value as LearnerPreferences['ageBand'])} className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 font-semibold">
                  <option value="3-5">3–5</option><option value="6-8">6–8</option><option value="9-11">9–11</option><option value="12-16">12–16</option>
                </select>
              </label>
            </div>
            <div className="mt-6 grid gap-3">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 font-bold">
                <span><span className="block">Larger text</span><span className="mt-1 block text-sm font-normal text-slate-500">Increase reading size across the application.</span></span>
                <input type="checkbox" checked={preferences.largerText} onChange={(event) => update('largerText', event.target.checked)} className="h-5 w-5" />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 font-bold">
                <span><span className="block">Reduce motion</span><span className="mt-1 block text-sm font-normal text-slate-500">Minimise non-essential animation and movement.</span></span>
                <input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => update('reducedMotion', event.target.checked)} className="h-5 w-5" />
              </label>
            </div>
            <button type="button" onClick={() => apply(preferences)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white"><Save className="h-4 w-4" /> Save settings</button>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><HardDrive className="h-6 w-6 text-cyan-700" /><h2 className="text-2xl font-black">Device data controls</h2></div>
            <p className="mt-3 leading-7 text-slate-600">Export before clearing browser data or changing devices. The backup includes learner progress, preferences, teacher planning, family goals, optional timed sessions, mistake review and learning notes. Import validates the KirthiVerse schema and rejects files larger than 1 MB.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={downloadProgress} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 font-black text-white"><Download className="h-4 w-4" /> Export all local data</button>
              <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-950 px-5 font-black"><Upload className="h-4 w-4" /> Import local data</button>
              <input ref={inputRef} type="file" accept="application/json,.json" onChange={importProgress} className="hidden" />
            </div>
            <button type="button" onClick={resetProgress} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 font-black text-red-800 hover:bg-red-100"><RotateCcw className="h-4 w-4" /> Reset all local data</button>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-7 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-200">Current learner</p>
            <div className="mt-5 flex items-center gap-4"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-4xl">{data.profile.avatar}</span><div><h2 className="text-2xl font-black">{data.profile.name}</h2><p className="mt-1 text-violet-100">Grade {data.profile.grade} · Ages {preferences.ageBand}</p></div></div>
            <button type="button" onClick={() => navigate('/onboarding')} className="mt-6 min-h-11 w-full rounded-xl bg-white px-4 font-black text-indigo-700">Edit learner profile</button>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-emerald-600" /><h2 className="text-xl font-black">Privacy summary</h2></div>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Storage model</dt><dd className="font-black">Current browser only</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Lessons completed</dt><dd className="font-black">{data.stats.completedLessons}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Quiz attempts</dt><dd className="font-black">{data.stats.totalAttempts}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Timed sessions</dt><dd className="font-black">{data.familyControls.sessions.length}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Mistake records</dt><dd className="font-black">{data.reviewData.mistakes.length}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Learning notes</dt><dd className="font-black">{data.reviewData.learningNotes.length}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Estimated data size</dt><dd className="font-black">{Math.max(1, Math.ceil(estimatedSize / 1024))} KB</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Core schema version</dt><dd className="font-black">{storage.getStorageVersion()}</dd></div>
            </dl>
          </section>
          <p className="min-h-6 text-sm font-bold text-emerald-700" role="status" aria-live="polite">{message}</p>
        </aside>
      </div>
    </main>
  )
}
