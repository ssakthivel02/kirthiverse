import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { storage, type LearnerPreferences } from '../utils/storage'

const avatars = ['🚀', '🦊', '🐼', '🦁', '🐯', '🦉', '🐬', '🌟']
const subjects = ['Mathematics', 'Science', 'English', 'Coding', 'Geography', 'History', 'Tamil', 'Music', 'Arts', 'Life Skills']

export default function Onboarding() {
  const [, navigate] = useLocation()
  const existing = storage.getProfile()
  const existingPreferences = storage.getPreferences()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(existing?.name === 'Learner' ? '' : existing?.name ?? '')
  const [grade, setGrade] = useState(existing?.grade ?? '5')
  const [avatar, setAvatar] = useState(existing?.avatar ?? '🚀')
  const [preferences, setPreferences] = useState<LearnerPreferences>(existingPreferences)

  const canContinue = useMemo(() => step !== 0 || name.trim().length >= 2, [name, step])

  function toggleFavourite(subject: string) {
    setPreferences((current) => ({
      ...current,
      favouriteSubjects: current.favouriteSubjects.includes(subject)
        ? current.favouriteSubjects.filter((item) => item !== subject)
        : [...current.favouriteSubjects, subject].slice(0, 4),
    }))
  }

  function finish() {
    storage.initializeProfile(name, grade, avatar)
    storage.setPreferences(preferences)
    document.documentElement.classList.toggle('large-text', preferences.largerText)
    navigate('/today')
  }

  const panels = [
    <section key="identity" aria-labelledby="onboarding-identity">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Step 1 of 4</p>
      <h1 id="onboarding-identity" className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Create your learner identity</h1>
      <p className="mt-4 max-w-xl text-slate-300">Use a nickname. KirthiVerse does not need a child’s full legal name, email, phone number or photograph for guest learning.</p>
      <label className="mt-8 block">
        <span className="mb-2 block font-bold">Learner nickname</span>
        <input value={name} onChange={(event) => setName(event.target.value.slice(0, 30))} className="min-h-14 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-lg text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/20" placeholder="Example: Maya" autoComplete="off" />
      </label>
      <label className="mt-5 block">
        <span className="mb-2 block font-bold">School grade or level</span>
        <select value={grade} onChange={(event) => setGrade(event.target.value)} className="min-h-14 w-full rounded-2xl border border-white/15 bg-slate-900 px-4 text-white outline-none focus:border-cyan-300">
          {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((item) => <option key={item} value={item}>Grade {item}</option>)}
        </select>
      </label>
    </section>,
    <section key="avatar" aria-labelledby="onboarding-avatar">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Step 2 of 4</p>
      <h1 id="onboarding-avatar" className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Choose your mission guide</h1>
      <p className="mt-4 text-slate-300">Your avatar is stored only on this device in the current release.</p>
      <div className="mt-8 grid grid-cols-4 gap-4">
        {avatars.map((item) => (
          <button key={item} type="button" onClick={() => setAvatar(item)} aria-label={`Choose ${item} avatar`} aria-pressed={avatar === item} className={`grid aspect-square min-h-12 min-w-12 place-items-center rounded-3xl border text-4xl ${avatar === item ? 'border-cyan-300 bg-cyan-300/20 ring-4 ring-cyan-300/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>{item}</button>
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {(['3-5', '6-8', '9-11', '12-16'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setPreferences((current) => ({ ...current, ageBand: item }))} aria-pressed={preferences.ageBand === item} className={`min-h-12 rounded-2xl border px-4 py-4 font-black ${preferences.ageBand === item ? 'border-violet-300 bg-violet-300/20' : 'border-white/10 bg-white/5'}`}>Ages {item}</button>
        ))}
      </div>
    </section>,
    <section key="subjects" aria-labelledby="onboarding-subjects">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Step 3 of 4</p>
      <h1 id="onboarding-subjects" className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Pick favourite worlds</h1>
      <p className="mt-4 text-slate-300">Choose up to four. These choices guide local recommendations and can be changed later.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {subjects.map((subject) => {
          const selected = preferences.favouriteSubjects.includes(subject)
          return <button key={subject} type="button" onClick={() => toggleFavourite(subject)} aria-pressed={selected} className={`flex min-h-14 items-center justify-between rounded-2xl border px-5 text-left font-black ${selected ? 'border-emerald-300 bg-emerald-300/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><span>{subject}</span>{selected && <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden="true" />}</button>
        })}
      </div>
    </section>,
    <section key="preferences" aria-labelledby="onboarding-preferences">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Step 4 of 4</p>
      <h1 id="onboarding-preferences" className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Set a comfortable pace</h1>
      <div className="mt-8 grid gap-5">
        <label className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <span className="block font-black">Daily goal</span>
          <select value={preferences.dailyGoal} onChange={(event) => setPreferences((current) => ({ ...current, dailyGoal: Number(event.target.value) as LearnerPreferences['dailyGoal'] }))} className="mt-3 min-h-12 w-full rounded-xl bg-slate-900 px-4">
            <option value={1}>1 learning activity</option>
            <option value={2}>2 learning activities</option>
            <option value={3}>3 learning activities</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"><span><span className="block font-black">Reduced motion</span><span className="text-sm text-slate-300">Use fewer animations and transitions.</span></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => setPreferences((current) => ({ ...current, reducedMotion: event.target.checked }))} className="h-6 w-6" /></label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"><span><span className="block font-black">Larger text</span><span className="text-sm text-slate-300">Increase the main reading size.</span></span><input type="checkbox" checked={preferences.largerText} onChange={(event) => setPreferences((current) => ({ ...current, largerText: event.target.checked }))} className="h-6 w-6" /></label>
      </div>
      <div className="mt-6 flex gap-3 rounded-2xl border border-blue-300/20 bg-blue-300/10 p-4 text-sm text-blue-100"><ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" /><p>This profile and its learning activity stay in this browser unless you export them. Cloud family and school accounts are planned for a later secure release.</p></div>
    </section>,
  ]

  return (
    <main className="min-h-screen bg-[#071124] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black"><Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Learner setup</div>
          <button type="button" onClick={() => navigate('/learning-worlds')} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white">Skip for now</button>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-10">
          {panels[step]}
          <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
            <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 font-black text-slate-300 disabled:opacity-30"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back</button>
            {step < panels.length - 1 ? (
              <button type="button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 disabled:opacity-40">Continue <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            ) : (
              <button type="button" onClick={finish} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-300 px-5 font-black text-slate-950">Start my mission <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
