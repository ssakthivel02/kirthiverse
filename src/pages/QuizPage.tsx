import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react'
import { quizzes, type QuizQuestion } from '../content/quizzes'
import { recordQuizMistakes } from '../utils/mistakeBank'
import { storage } from '../utils/storage'

function normaliseText(value: string | number | undefined) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function correctValue(question: QuizQuestion) {
  if (question.type === 'mcq') {
    if (typeof question.correctAnswer === 'number') return String(question.correctAnswer)
    const optionIndex = question.options?.findIndex((option) => normaliseText(option) === normaliseText(question.correctAnswer)) ?? -1
    return optionIndex >= 0 ? String(optionIndex) : normaliseText(question.correctAnswer)
  }
  if (question.type === 'true-false') {
    if (typeof question.correctAnswer === 'number') return question.correctAnswer === 0 ? 'true' : 'false'
    const value = normaliseText(question.correctAnswer)
    if (value === '0') return 'true'
    if (value === '1') return 'false'
    return value
  }
  return normaliseText(question.correctAnswer)
}

function isCorrect(question: QuizQuestion, answer: string | number | undefined) {
  if (question.type === 'mcq') return normaliseText(answer) === correctValue(question)
  if (question.type === 'true-false') return normaliseText(answer) === correctValue(question)
  return normaliseText(answer) === correctValue(question)
}

function answerLabel(question: QuizQuestion, answer: string | number | undefined) {
  if (answer === undefined || normaliseText(answer) === '') return 'No answer'
  if (question.type === 'mcq' && typeof answer === 'number') return question.options?.[answer] ?? String(answer)
  if (question.type === 'true-false') return normaliseText(answer) === 'true' ? 'True' : 'False'
  return String(answer)
}

function correctLabel(question: QuizQuestion) {
  if (question.type === 'mcq') {
    const index = Number(correctValue(question))
    return Number.isInteger(index) ? question.options?.[index] ?? String(question.correctAnswer) : String(question.correctAnswer)
  }
  if (question.type === 'true-false') return correctValue(question) === 'true' ? 'True' : 'False'
  return String(question.correctAnswer)
}

export default function QuizPage() {
  const [, params] = useRoute('/quiz/:id')
  const [, navigate] = useLocation()
  const lessonId = params?.id ?? ''
  const allQuestions = useMemo(() => quizzes.filter((question) => question.lessonId === lessonId), [lessonId])
  const [activeIndexes, setActiveIndexes] = useState<number[]>(() => allQuestions.map((_, index) => index))
  const [position, setPosition] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [status, setStatus] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setActiveIndexes(allQuestions.map((_, index) => index))
    setPosition(0)
    setAnswers({})
    setSubmitted(false)
    setShowHint(false)
  }, [allQuestions])

  const originalIndex = activeIndexes[position] ?? 0
  const question = allQuestions[originalIndex]
  const currentAnswer = answers[originalIndex]
  const allAnswered = activeIndexes.every((index) => normaliseText(answers[index]) !== '')
  const unansweredCount = activeIndexes.filter((index) => normaliseText(answers[index]) === '').length
  const latestAttempts = storage.getQuizAttempts().filter((attempt) => attempt.lessonId === lessonId).slice(-5).reverse()

  useEffect(() => {
    if (!submitted) headingRef.current?.focus({ preventScroll: true })
    setShowHint(false)
  }, [position, submitted])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (submitted || !question || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      if (question.type === 'mcq') {
        const option = Number(event.key) - 1
        if (Number.isInteger(option) && option >= 0 && option < (question.options?.length ?? 0)) {
          setAnswers((current) => ({ ...current, [originalIndex]: option }))
          setStatus(`Option ${option + 1} selected.`)
        }
      }
      if (question.type === 'true-false' && ['t', 'f'].includes(event.key.toLowerCase())) {
        const value = event.key.toLowerCase() === 't' ? 'true' : 'false'
        setAnswers((current) => ({ ...current, [originalIndex]: value }))
        setStatus(`${value === 'true' ? 'True' : 'False'} selected.`)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [originalIndex, question, submitted])

  if (!question || allQuestions.length === 0) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 py-12 text-slate-950">
        <section className="max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-3xl font-black">Quiz not available</h1>
          <p className="mt-3 leading-7 text-slate-600">This lesson does not currently have quiz questions. Continue through another Learning World.</p>
          <button type="button" onClick={() => navigate('/learning-worlds')} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Choose another world</button>
        </section>
      </main>
    )
  }

  function selectAnswer(value: string | number) {
    setAnswers((current) => ({ ...current, [originalIndex]: value }))
    setStatus('Answer selected.')
  }

  function submitQuiz() {
    if (!allAnswered) {
      setStatus(`Answer ${unansweredCount} remaining question${unansweredCount === 1 ? '' : 's'} before submitting.`)
      return
    }
    const correctCount = activeIndexes.filter((index) => isCorrect(allQuestions[index], answers[index])).length
    const finalScore = Math.round((correctCount / activeIndexes.length) * 100)
    const rewardEligible = !storage.getStats().awardedQuizIds.includes(lessonId)
    setScore(finalScore)
    setXpEarned(rewardEligible ? Math.round(finalScore / 2) : 0)
    setSubmitted(true)
    storage.recordQuizAttempt({
      quizId: `lesson-quiz:${lessonId}`,
      lessonId,
      subject: question.subject,
      score: correctCount,
      totalQuestions: activeIndexes.length,
      percentage: finalScore,
      attemptDate: Date.now(),
      answers,
    })
    recordQuizMistakes(lessonId, activeIndexes, answers)
    setStatus(`Quiz submitted. Score ${finalScore} percent.`)
  }

  function restart(indexes: number[]) {
    const retainedAnswers = Object.fromEntries(Object.entries(answers).filter(([index]) => !indexes.includes(Number(index))))
    setActiveIndexes(indexes)
    setAnswers(retainedAnswers)
    setPosition(0)
    setSubmitted(false)
    setScore(0)
    setXpEarned(0)
    setStatus('Quiz ready for another attempt.')
  }

  const incorrectIndexes = activeIndexes.filter((index) => !isCorrect(allQuestions[index], answers[index]))
  const correctCount = activeIndexes.length - incorrectIndexes.length
  const mastery = score >= 80 ? 'Mastered' : score >= 60 ? 'Practising' : 'Learning'
  const subjectSlug = question.subject.toLowerCase().replace(/\s+/g, '-')

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
        <div className="mx-auto max-w-4xl">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
            <div className={`p-8 text-center text-white sm:p-12 ${score >= 80 ? 'bg-gradient-to-br from-emerald-500 to-cyan-600' : score >= 60 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-violet-600 to-indigo-700'}`}>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white/20 backdrop-blur">{score >= 80 ? <Trophy className="h-11 w-11" /> : <Target className="h-11 w-11" />}</div>
              <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-white/80">{mastery} · {question.subject}</p>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">{score}%</h1>
              <p className="mt-3 text-lg text-white/90">{correctCount} of {activeIndexes.length} answers correct</p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
              <div className="rounded-2xl bg-slate-50 p-5 text-center"><p className="text-sm font-bold text-slate-500">Mastery state</p><p className="mt-2 text-2xl font-black">{mastery}</p></div>
              <div className="rounded-2xl bg-slate-50 p-5 text-center"><p className="text-sm font-bold text-slate-500">XP earned now</p><p className="mt-2 text-2xl font-black text-violet-700">{xpEarned}</p><p className="mt-1 text-xs text-slate-500">XP is awarded once per lesson quiz.</p></div>
              <div className="rounded-2xl bg-slate-50 p-5 text-center"><p className="text-sm font-bold text-slate-500">Needs review</p><p className="mt-2 text-2xl font-black text-rose-700">{incorrectIndexes.length}</p></div>
            </div>

            <div className="grid gap-3 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
              {incorrectIndexes.length > 0 && <button type="button" onClick={() => restart(incorrectIndexes)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 font-black text-slate-950"><RotateCcw className="h-4 w-4" /> Retry incorrect only</button>}
              <button type="button" onClick={() => restart(allQuestions.map((_, index) => index))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white"><RotateCcw className="h-4 w-4" /> Retry full quiz</button>
              {incorrectIndexes.length > 0 && <button type="button" onClick={() => navigate('/mistake-review')} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-700 px-5 font-black text-white">Open Mistake Review</button>}
              <button type="button" onClick={() => navigate(`/subject/${subjectSlug}`)} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-950 px-5 font-black">Back to subject</button>
            </div>
          </section>

          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-violet-600" /><h2 className="text-2xl font-black">Review and learn</h2></div>
            <div className="mt-6 space-y-5">
              {activeIndexes.map((index, reviewPosition) => {
                const item = allQuestions[index]
                const correct = isCorrect(item, answers[index])
                return (
                  <article key={item.id} className={`rounded-2xl border p-5 ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                    <div className="flex items-start gap-3">{correct ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" /> : <XCircle className="mt-1 h-5 w-5 shrink-0 text-rose-700" />}<div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Question {reviewPosition + 1}</p><h3 className="mt-1 text-lg font-black">{item.question}</h3></div></div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-white/70 p-3"><dt className="font-bold text-slate-500">Your answer</dt><dd className="mt-1 font-black">{answerLabel(item, answers[index])}</dd></div><div className="rounded-xl bg-white/70 p-3"><dt className="font-bold text-slate-500">Correct answer</dt><dd className="mt-1 font-black">{correctLabel(item)}</dd></div></dl>
                    <p className="mt-4 leading-7 text-slate-700"><span className="font-black">Why:</span> {item.explanation}</p>
                  </article>
                )
              })}
            </div>
          </section>

          {latestAttempts.length > 1 && <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><History className="h-5 w-5 text-cyan-700" /><h2 className="text-xl font-black">Recent attempts</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{latestAttempts.map((attempt) => <div key={`${attempt.attemptDate}-${attempt.percentage}`} className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-black">{attempt.percentage}%</p><p className="mt-1 text-xs text-slate-500">{new Date(attempt.attemptDate).toLocaleDateString()}</p></div>)}</div></section>}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{status}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate(`/lesson/${lessonId}`)} className="mb-7 inline-flex items-center gap-2 font-black text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to lesson</button>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">{question.subject} · {question.difficulty}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">Quiz mission</h1></div>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black">Question {position + 1} of {activeIndexes.length}</div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`${Math.round(((position + 1) / activeIndexes.length) * 100)} percent through quiz`}><div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500" style={{ width: `${((position + 1) / activeIndexes.length) * 100}%` }} /></div>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="Question navigation">
            {activeIndexes.map((index, itemPosition) => <button type="button" key={allQuestions[index].id} onClick={() => setPosition(itemPosition)} aria-label={`Go to question ${itemPosition + 1}${normaliseText(answers[index]) ? ', answered' : ', unanswered'}`} aria-current={position === itemPosition ? 'step' : undefined} className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-black ${position === itemPosition ? 'bg-slate-950 text-white' : normaliseText(answers[index]) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{itemPosition + 1}</button>)}
          </div>

          <div className="mt-8">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-black leading-tight outline-none">{question.question}</h2>
            <button type="button" onClick={() => setShowHint((value) => !value)} aria-expanded={showHint} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-black text-amber-900"><Lightbulb className="h-4 w-4" /> {showHint ? 'Hide hint' : 'Show hint'}</button>
            {showHint && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 leading-7 text-amber-950">Return to the lesson’s main rule or example, then remove answers that do not fit. This is a {question.difficulty} question.</p>}
          </div>

          {question.type === 'mcq' && <div className="mt-7 grid gap-3">{question.options?.map((option, index) => <button type="button" key={option} onClick={() => selectAnswer(index)} aria-pressed={currentAnswer === index} className={`flex min-h-14 items-center gap-4 rounded-2xl border-2 p-4 text-left font-bold ${currentAnswer === index ? 'border-violet-500 bg-violet-50 text-violet-950' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${currentAnswer === index ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span>{option}</button>)}</div>}

          {question.type === 'true-false' && <div className="mt-7 grid gap-3 sm:grid-cols-2">{(['true', 'false'] as const).map((value) => <button type="button" key={value} onClick={() => selectAnswer(value)} aria-pressed={currentAnswer === value} className={`min-h-16 rounded-2xl border-2 p-4 text-lg font-black ${currentAnswer === value ? 'border-cyan-500 bg-cyan-50 text-cyan-950' : 'border-slate-200 hover:border-cyan-300'}`}>{value === 'true' ? 'True' : 'False'}</button>)}</div>}

          {question.type === 'short-answer' && <label className="mt-7 grid gap-2 font-black">Your answer<input type="text" value={String(currentAnswer ?? '')} onChange={(event) => selectAnswer(event.target.value)} maxLength={120} autoComplete="off" className="min-h-14 rounded-2xl border-2 border-slate-200 px-4 text-lg font-semibold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /><span className="text-sm font-normal text-slate-500">Spelling and spacing are checked without case sensitivity.</span></label>}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setPosition((current) => Math.max(0, current - 1))} disabled={position === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 font-black disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>
            {position < activeIndexes.length - 1 ? <button type="button" onClick={() => setPosition((current) => Math.min(activeIndexes.length - 1, current + 1))} disabled={normaliseText(currentAnswer) === ''} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 font-black text-white disabled:opacity-40">Next question <ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={submitQuiz} disabled={!allAnswered} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 font-black text-white disabled:opacity-40"><CheckCircle2 className="h-4 w-4" /> Submit quiz {unansweredCount ? `(${unansweredCount} remaining)` : ''}</button>}
          </div>
          <p className="mt-4 min-h-5 text-sm font-bold text-violet-700" role="status" aria-live="polite">{status}</p>
        </section>
      </div>
    </main>
  )
}
