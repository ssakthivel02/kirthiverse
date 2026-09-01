import { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
import { Coffee, HeartPulse, Pause, Play, RotateCcw, ShieldCheck, Square } from 'lucide-react'
import { getFamilyGoals, getLearningSessions, recordLearningSession } from '../utils/familyControls'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

export default function Wellbeing() {
  const goals = getFamilyGoals()
  const [running, setRunning] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [savedMessage, setSavedMessage] = useState('')
  const sessions = useMemo(() => getLearningSessions().slice(0, 8), [savedMessage])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const elapsedMinutes = Math.floor(elapsed / 60)
  const breakDue = elapsedMinutes > 0 && elapsedMinutes % goals.breakEveryMinutes === 0
  const limitReached = elapsedMinutes >= goals.sessionLimitMinutes

  function start() {
    setSavedMessage('')
    setStartedAt(Date.now() - elapsed * 1000)
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function finish() {
    const start = startedAt ?? Date.now() - elapsed * 1000
    if (elapsed >= 30) {
      recordLearningSession(start, Date.now())
      setSavedMessage('Learning session saved on this device.')
    } else {
      setSavedMessage('Session was too short to save. No activity was recorded.')
    }
    setRunning(false)
    setStartedAt(null)
    setElapsed(0)
  }

  function reset() {
    setRunning(false)
    setStartedAt(null)
    setElapsed(0)
    setSavedMessage('Timer reset. No session was saved.')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-300">Wellbeing centre</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.05em]">Focus deeply. Stop comfortably.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Use a simple local timer, take regular breaks and end the session when learning stops feeling productive.</p>
        </div>
      </section>

      <section className="container grid gap-8 py-10 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-rose-200 to-violet-300 text-slate-950"><HeartPulse className="h-10 w-10" /></div>
            <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Current learning session</p>
            <p className="mt-3 font-mono text-7xl font-black tracking-[-0.08em] sm:text-8xl" aria-live="off">{formatTime(elapsed)}</p>
            <p className="mt-4 text-slate-500">Break reminder every {goals.breakEveryMinutes} minutes · session guide {goals.sessionLimitMinutes} minutes</p>

            {(breakDue || limitReached) && <div role="status" className={`mx-auto mt-6 max-w-xl rounded-2xl border p-4 text-left ${limitReached ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><div className="flex gap-3"><Coffee className="h-5 w-5 shrink-0" /><div><p className="font-black">{limitReached ? 'Session guide reached' : 'Break time'}</p><p className="mt-1 text-sm leading-6">{limitReached ? 'Consider ending this session. More time is not always better learning.' : 'Look away from the screen, move, drink water and return only when ready.'}</p></div></div></div>}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {!running ? <button onClick={start} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 font-black text-white"><Play className="h-4 w-4" /> {elapsed ? 'Resume' : 'Start session'}</button> : <button onClick={pause} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-500 px-6 font-black text-slate-950"><Pause className="h-4 w-4" /> Pause</button>}
              <button onClick={finish} disabled={!elapsed} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-6 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"><Square className="h-4 w-4" /> Finish and save</button>
              <button onClick={reset} disabled={!elapsed} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 font-black disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Reset</button>
            </div>
            <p role="status" className="mt-5 min-h-6 text-sm font-bold text-emerald-700">{savedMessage}</p>
          </section>

          <section className="grid gap-5 sm:grid-cols-3">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-slate-500">Eyes</p><p className="mt-3 font-black">20–20–20 reset</p><p className="mt-2 text-sm leading-6 text-slate-600">Every 20 minutes, look about 20 feet away for roughly 20 seconds.</p></article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-slate-500">Body</p><p className="mt-3 font-black">Move between missions</p><p className="mt-2 text-sm leading-6 text-slate-600">Stand, stretch and change position before starting another lesson.</p></article>
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-black uppercase tracking-wide text-slate-500">Mind</p><p className="mt-3 font-black">Stop without penalty</p><p className="mt-2 text-sm leading-6 text-slate-600">Streaks and goals never remove points when a learner rests.</p></article>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black">Recent timed sessions</h2>
            {sessions.length ? <ul className="mt-5 divide-y divide-slate-100">{sessions.map((session) => <li key={session.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-black">{new Date(session.startedAt).toLocaleDateString()}</p><p className="text-sm text-slate-500">{new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-800">{session.minutes} min</span></li>)}</ul> : <p className="mt-5 text-slate-500">No timed sessions saved yet.</p>}
          </section>

          <section className="flex gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" /><div><h2 className="text-xl font-black text-blue-950">Local and optional</h2><p className="mt-2 leading-7 text-blue-800">The timer runs only while this page is open. Saved session durations remain in this browser and are not sent to parents, teachers or third parties.</p><Link href="/family-goals" className="mt-4 inline-flex font-black text-blue-900 underline">Change family controls</Link></div></section>
        </aside>
      </section>
    </main>
  )
}
