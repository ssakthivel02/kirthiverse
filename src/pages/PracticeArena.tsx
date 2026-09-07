import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, Sparkles, StopCircle } from 'lucide-react'
import type { Lesson } from '../content/lessons'
import type { QuizQuestion } from '../content/quizzes'
import { loadLearningRuntimeData } from '../content/learningRuntime'
import { storage } from '../utils/storage'

type Duration = 3 | 5 | 10
type ArenaStatus = 'setup' | 'running' | 'paused' | 'complete'
type SessionResult = 'got_it' | 'need_more_practice'

interface ArenaHistoryItem {
  id: string
  startedAt: number
  durationMinutes: Duration
  answered: number
  correct: number
  result: SessionResult
}

const HISTORY_KEY = 'kvs_kiki_practice_history_v1'

function readHistory(): ArenaHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const value = raw ? JSON.parse(raw) : []
    return Array.isArray(value) ? value.slice(0, 20) : []
  } catch {
    return []
  }
}

function saveHistory(item: ArenaHistoryItem) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...readHistory()].slice(0, 20)))
  } catch {
    // Local storage may be unavailable. Arena still works for the current session.
  }
}

function scorePriority(question: QuizQuestion) {
  const attempts = storage.getQuizAttempts().filter((attempt) => attempt.lessonId === question.lessonId)
  if (!attempts.length) return 2
  const latest = attempts[attempts.length - 1]?.percentage ?? 100
  if (latest < 60) return 0
  if (latest < 80) return 1
  return 3
}

function buildQueue(source: QuizQuestion[]) {
  return source
    .filter((question) => question.type === 'mcq' && question.options?.length)
    .slice()
    .sort((a, b) => scorePriority(a) - scorePriority(b) || a.id.localeCompare(b.id))
}

export default function PracticeArena() {
  const preferences = storage.getPreferences()
  const tamil = preferences.language === 'Tamil'
  const [duration, setDuration] = useState<Duration>(5)
  const [calmMode, setCalmMode] = useState(true)
  const [status, setStatus] = useState<ArenaStatus>('setup')
  const [remaining, setRemaining] = useState(duration * 60)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [decisionSaved, setDecisionSaved] = useState(false)
  const [history, setHistory] = useState<ArenaHistoryItem[]>(() => typeof window === 'undefined' ? [] : readHistory())
  const [queue, setQueue] = useState<QuizQuestion[]>([])
  const [runtimeLessons, setRuntimeLessons] = useState<Lesson[]>([])
  const [loadingMission, setLoadingMission] = useState(false)
  const [loadError, setLoadError] = useState('')

  const question = queue.length ? queue[index % queue.length] : undefined
  const lesson = question ? runtimeLessons.find((item) => item.id === question.lessonId) : undefined

  useEffect(() => {
    if (status !== 'running') return
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          setStatus('complete')
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [status])

  async function startMission() {
    if (loadingMission) return
    setLoadingMission(true)
    setLoadError('')
    try {
      const { lessons, quizzes } = await loadLearningRuntimeData()
      const nextQueue = buildQueue(quizzes)
      if (!nextQueue.length) {
        setLoadError('No canonical multiple-choice questions are available yet.')
        return
      }
      setQueue(nextQueue)
      setRuntimeLessons(lessons)
      setRemaining(duration * 60)
      setIndex(0)
      setSelected(null)
      setAnswered(0)
      setCorrect(0)
      setStartedAt(Date.now())
      setDecisionSaved(false)
      setStatus('running')
    } catch {
      setLoadError('Kiki could not prepare the practice questions on this device. Please try again.')
    } finally {
      setLoadingMission(false)
    }
  }

  function choose(optionIndex: number) {
    if (selected !== null || !question) return
    const isCorrect = optionIndex === question.correctAnswer
    setSelected(optionIndex)
    setAnswered((value) => value + 1)
    if (isCorrect) setCorrect((value) => value + 1)
    storage.recordQuizAttempt({
      quizId: `kiki-arena:${question.id}:${Date.now()}`,
      lessonId: question.lessonId,
      subject: question.subject,
      score: isCorrect ? 1 : 0,
      totalQuestions: 1,
      percentage: isCorrect ? 100 : 0,
      attemptDate: Date.now(),
      answers: { 0: optionIndex },
    })
  }

  function nextQuestion() {
    setSelected(null)
    setIndex((value) => value + 1)
  }

  function endMission() {
    setStatus('complete')
  }

  function saveDecision(result: SessionResult) {
    if (decisionSaved) return
    const item: ArenaHistoryItem = {
      id: `arena-${Date.now()}`,
      startedAt: startedAt ?? Date.now(),
      durationMinutes: duration,
      answered,
      correct,
      result,
    }
    saveHistory(item)
    setHistory(readHistory())
    setDecisionSaved(true)
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  return (
    <main className={`min-h-screen ${calmMode ? 'bg-slate-50' : 'bg-gradient-to-b from-cyan-50 to-violet-50'} text-slate-950`}>
      <section className="container py-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">Kiki Practice Arena · கிகி பயிற்சி அரங்கம்</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">{tamil ? 'கிகியுடன் குறுகிய, அமைதியான பயிற்சி.' : 'Short, calm practice with Kiki.'}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{tamil ? 'உங்கள் சாதனத்தில் உள்ள கற்றல் சான்றுகளின் அடிப்படையில் அதிக பயிற்சி தேவைப்படும் பாடங்களை கிகி முன்னுரிமைப்படுத்துகிறது.' : 'Kiki prioritises lessons that need more practice using learning evidence stored on this device.'}</p>

          {status === 'setup' && (
            <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="mission-setup-title">
              <h2 id="mission-setup-title" className="text-2xl font-black">Choose a mission</h2>
              <div className="mt-6 grid grid-cols-3 gap-3" role="group" aria-label="Practice duration">
                {([3, 5, 10] as Duration[]).map((value) => <button key={value} type="button" aria-pressed={duration === value} onClick={() => setDuration(value)} className={`min-h-14 rounded-2xl border-2 font-black ${duration === value ? 'border-violet-700 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white'}`}>{value} min</button>)}
              </div>
              <label className="mt-6 flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-slate-100 px-5 font-bold"><span><span className="block">Calm Mode</span><span className="block text-sm font-normal text-slate-600">Reduced visual pressure and no urgent countdown display.</span></span><input type="checkbox" checked={calmMode} onChange={(event) => setCalmMode(event.target.checked)} className="h-5 w-5" /></label>
              <button type="button" disabled={loadingMission} onClick={() => void startMission()} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-white disabled:cursor-wait disabled:opacity-70"><Sparkles className="h-5 w-5" /> {loadingMission ? 'Preparing mission…' : 'Start with Kiki'}</button>
              {loadError && <p className="mt-4 rounded-xl bg-rose-50 p-4 font-semibold text-rose-900" role="alert">{loadError}</p>}
            </section>
          )}

          {(status === 'running' || status === 'paused') && question && (
            <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{lesson?.subject ?? question.subject}</p><p className="mt-1 text-sm text-slate-600">{calmMode ? 'Calm Mode · ' : ''}{answered} answered</p></div>
                {calmMode ? <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800" aria-label="Calm Mode timer running">Take your time</div> : <div className="font-mono text-2xl font-black" aria-label={`${minutes} minutes ${seconds} seconds remaining`}>{minutes}:{seconds}</div>}
              </div>
              <h2 className="mt-8 text-2xl font-black leading-tight sm:text-3xl">{question.question}</h2>
              <div className="mt-6 grid gap-3">{question.options?.map((option, optionIndex) => {
                const chosen = selected === optionIndex
                const correctOption = selected !== null && optionIndex === question.correctAnswer
                return <button data-testid="arena-option" key={option} type="button" disabled={selected !== null || status === 'paused'} onClick={() => choose(optionIndex)} className={`min-h-14 rounded-2xl border-2 p-4 text-left font-bold ${correctOption ? 'border-emerald-600 bg-emerald-50' : chosen ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white hover:border-violet-400'} disabled:cursor-default`}>{option}</button>
              })}</div>
              {selected !== null && <div className="mt-5 rounded-2xl bg-slate-100 p-5" role="status" aria-live="polite"><p className="font-black">{selected === question.correctAnswer ? (tamil ? 'சரி!' : 'Got it!') : (tamil ? 'மீண்டும் முயற்சிப்போம்.' : 'Keep practising.')}</p><p className="mt-2 leading-7 text-slate-700">{question.explanation}</p><button type="button" onClick={nextQuestion} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Next question</button></div>}
              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
                <button type="button" onClick={() => setStatus(status === 'paused' ? 'running' : 'paused')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 font-black">{status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{status === 'paused' ? 'Resume' : 'Pause'}</button>
                <button type="button" onClick={endMission} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black"><StopCircle className="h-4 w-4" /> End mission</button>
              </div>
            </section>
          )}

          {status === 'complete' && (
            <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-3xl font-black">{tamil ? 'பயிற்சி முடிந்தது' : 'Mission complete'}</h2>
              <p className="mt-3 text-lg text-slate-600">{answered ? `${correct}/${answered} correct` : 'No answers recorded yet.'}</p>
              {!decisionSaved ? <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2"><button type="button" onClick={() => saveDecision('got_it')} className="min-h-12 rounded-2xl bg-emerald-600 px-5 font-black text-white">Got it</button><button type="button" onClick={() => saveDecision('need_more_practice')} className="min-h-12 rounded-2xl bg-amber-100 px-5 font-black text-amber-950">Need more practice</button></div> : <p className="mx-auto mt-6 max-w-xl rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-900" role="status">Kiki saved this practice reflection on this device.</p>}
              <button type="button" onClick={() => setStatus('setup')} className="mt-5 inline-flex items-center gap-2 font-black text-violet-700"><RotateCcw className="h-4 w-4" /> New mission</button>
            </section>
          )}

          <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Recent practice on this device</h2>
            {history.length ? <ul className="mt-4 grid gap-3">{history.slice(0, 5).map((item) => <li key={item.id} className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{item.durationMinutes} min</strong> · {item.correct}/{item.answered} correct · {item.result === 'got_it' ? 'Got it' : 'Need more practice'}</li>)}</ul> : <p className="mt-3 text-slate-600">No Arena sessions saved yet.</p>}
          </section>
        </div>
      </section>
    </main>
  )
}
