import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, Database, HardDrive, RefreshCw, ShieldCheck, Wifi, WifiOff, Wrench } from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage } from '../utils/storage'

interface CheckResult {
  label: string
  status: 'pass' | 'warning' | 'fail'
  detail: string
}

function StatusIcon({ status }: { status: CheckResult['status'] }) {
  return status === 'pass' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <CircleAlert className={`h-5 w-5 ${status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`} />
}

export default function PlatformHealth() {
  const [checks, setChecks] = useState<CheckResult[]>([])
  const [running, setRunning] = useState(true)

  async function runChecks() {
    setRunning(true)
    const results: CheckResult[] = []

    results.push({
      label: 'Network status',
      status: navigator.onLine ? 'pass' : 'warning',
      detail: navigator.onLine ? 'Browser reports an active network connection.' : 'Browser is offline. Previously cached pages may remain available.',
    })

    try {
      const key = `kvs-health-${Date.now()}`
      window.localStorage.setItem(key, 'ok')
      const passed = window.localStorage.getItem(key) === 'ok'
      window.localStorage.removeItem(key)
      results.push({ label: 'Local progress storage', status: passed ? 'pass' : 'fail', detail: passed ? 'Browser storage can save and read KirthiVerse data.' : 'Browser storage test did not return the expected value.' })
    } catch {
      results.push({ label: 'Local progress storage', status: 'fail', detail: 'Browser storage is unavailable or blocked.' })
    }

    const profile = storage.getProfile()
    const stats = storage.getStats()
    results.push({ label: 'Learner record', status: profile ? 'pass' : 'warning', detail: profile ? `${profile.name} profile found with ${stats.completedLessons} completed lessons and ${stats.totalAttempts} quiz attempts.` : 'No learner profile is set up yet.' })

    results.push({ label: 'Learning catalogue', status: lessons.length >= 77 && quizzes.length >= 64 ? 'pass' : 'fail', detail: `${lessons.length} lessons and ${quizzes.length} quiz questions are available in this build.` })

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      results.push({ label: 'Offline application support', status: registration ? 'pass' : 'warning', detail: registration ? 'A KirthiVerse service worker is registered.' : 'Service-worker support exists, but this browser has not registered the offline shell yet.' })
    } else {
      results.push({ label: 'Offline application support', status: 'warning', detail: 'This browser does not expose service-worker support.' })
    }

    try {
      const manifest = await fetch('/manifest.webmanifest', { cache: 'no-store' })
      results.push({ label: 'Install metadata', status: manifest.ok ? 'pass' : 'warning', detail: manifest.ok ? 'The web-app manifest is available.' : `Manifest returned HTTP ${manifest.status}.` })
    } catch {
      results.push({ label: 'Install metadata', status: 'warning', detail: 'Manifest could not be checked while offline.' })
    }

    try {
      const response = await fetch('/.well-known/security.txt', { cache: 'no-store' })
      results.push({ label: 'Security contact policy', status: response.ok ? 'pass' : 'warning', detail: response.ok ? 'The standard security contact file is available.' : `Security contact returned HTTP ${response.status}.` })
    } catch {
      results.push({ label: 'Security contact policy', status: 'warning', detail: 'Security contact could not be checked while offline.' })
    }

    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage ? Math.round(estimate.usage / 1024) : 0
      const quota = estimate.quota ? Math.round(estimate.quota / 1024 / 1024) : 0
      results.push({ label: 'Browser storage estimate', status: 'pass', detail: `This origin currently uses approximately ${used} KB. Browser-reported quota is approximately ${quota} MB.` })
    } else {
      results.push({ label: 'Browser storage estimate', status: 'warning', detail: 'This browser does not provide a storage estimate.' })
    }

    setChecks(results)
    setRunning(false)
  }

  useEffect(() => { void runChecks() }, [])

  const failed = checks.filter((item) => item.status === 'fail').length
  const warnings = checks.filter((item) => item.status === 'warning').length

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container flex flex-col gap-6 py-14 sm:flex-row sm:items-end sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200"><Wrench className="h-4 w-4" /> Local diagnostics</div><h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em]">Platform Health</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Check this browser’s KirthiVerse readiness. Results remain on screen and are not uploaded.</p></div><button onClick={() => void runChecks()} disabled={running} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} /> Run checks</button></div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 sm:grid-cols-3"><article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><p className="mt-4 text-3xl font-black">{checks.filter((item) => item.status === 'pass').length}</p><p className="text-sm font-bold text-slate-500">checks passed</p></article><article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><CircleAlert className="h-6 w-6 text-amber-600" /><p className="mt-4 text-3xl font-black">{warnings}</p><p className="text-sm font-bold text-slate-500">warnings</p></article><article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><ShieldCheck className="h-6 w-6 text-rose-600" /><p className="mt-4 text-3xl font-black">{failed}</p><p className="text-sm font-bold text-slate-500">failed checks</p></article></div>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-3xl font-black">Diagnostic results</h2>
          {running ? <p className="mt-6 text-slate-500">Running local checks…</p> : <ul className="mt-6 divide-y divide-slate-100">{checks.map((check) => <li key={check.label} className="flex gap-4 py-5"><StatusIcon status={check.status} /><div><p className="font-black">{check.label}</p><p className="mt-1 leading-7 text-slate-600">{check.detail}</p></div></li>)}</ul>}
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-3"><section className="rounded-[1.5rem] border border-blue-200 bg-blue-50 p-6"><Wifi className="h-6 w-6 text-blue-700" /><h2 className="mt-4 text-xl font-black text-blue-950">Online</h2><p className="mt-2 leading-7 text-blue-800">Reload once to receive the newest production files and learning content.</p></section><section className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><WifiOff className="h-6 w-6 text-slate-700" /><h2 className="mt-4 text-xl font-black">Offline</h2><p className="mt-2 leading-7 text-slate-600">Previously visited application pages may load from the offline shell. New content requires a connection.</p></section><section className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><Database className="h-6 w-6 text-violet-700" /><h2 className="mt-4 text-xl font-black">Local data</h2><p className="mt-2 leading-7 text-slate-600">Use Settings to export progress before browser cleanup or device migration.</p></section></div>

        <section className="mt-8 flex gap-3 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6"><HardDrive className="h-6 w-6 shrink-0 text-emerald-700" /><div><h2 className="text-xl font-black text-emerald-950">Privacy note</h2><p className="mt-2 leading-7 text-emerald-800">This page uses browser APIs and same-origin files only. It does not transmit learner details, diagnostic results or storage estimates to KirthiVerse servers.</p></div></section>
      </section>
    </main>
  )
}
