import { useLocation } from 'wouter'
import { ArrowRight, BrainCircuit, CheckCircle2, Compass, Sparkles, Target } from 'lucide-react'
import { storage } from '../utils/storage'
import { getMasterySummary, getRecommendedMasteryItems, type LearnerMasteryState } from '../utils/mastery'

const stateCopy: Record<LearnerMasteryState, { label: string; tamil: string; className: string }> = {
  needs_practice: { label: 'Needs practice', tamil: 'மேலும் பயிற்சி', className: 'bg-rose-50 text-rose-900 border-rose-200' },
  building: { label: 'Building', tamil: 'வளர்கிறது', className: 'bg-amber-50 text-amber-900 border-amber-200' },
  secure: { label: 'Secure', tamil: 'உறுதி', className: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  challenge_ready: { label: 'Challenge ready', tamil: 'சவாலுக்கு தயார்', className: 'bg-violet-50 text-violet-900 border-violet-200' },
}

export default function MasteryConstellation() {
  const [, navigate] = useLocation()
  const preferences = storage.getPreferences()
  const tamil = preferences.language === 'Tamil'
  const summary = getMasterySummary()
  const recommendations = getRecommendedMasteryItems(8)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="overflow-hidden bg-[#071124] text-white">
        <div className="container py-14">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Kiki Mastery Constellation · கிகி திறன் விண்மீன்</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">{tamil ? 'நீங்கள் எதை அறிந்துள்ளீர்கள் — அடுத்து ஏன் இதைத் தேர்ந்தெடுத்தோம்.' : 'See what is secure — and why Kiki picked what comes next.'}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{tamil ? 'இது உங்கள் சாதனத்தில் உள்ள பாட நிறைவு மற்றும் மதிப்பீட்டு சான்றுகளை மட்டும் பயன்படுத்தும் விளக்கக்கூடிய, உள்ளூர்-முதல் மாதிரி.' : 'This is an explainable, local-first model using only lesson completion and assessment evidence stored on this device.'}</p>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => {
            const copy = stateCopy[item.state]
            return <article key={item.state} className={`rounded-[1.5rem] border p-5 ${copy.className}`}><p className="text-sm font-black uppercase tracking-[0.14em]">{copy.label}</p><p className="mt-1 text-xs font-bold opacity-75">{copy.tamil}</p><p className="mt-5 text-4xl font-black">{item.count}</p><p className="mt-1 text-sm">lesson{item.count === 1 ? '' : 's'}</p></article>
          })}
        </div>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-800"><Compass className="h-6 w-6" /></span><div><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">Explainable diagnostics</p><h2 className="mt-2 text-3xl font-black">Why Kiki picked this for you</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">No opaque AI score is used. Recommendations come from quiz evidence, repeated low-score signals and explicit prerequisite relationships where the production curriculum has them. A same-subject sequence is used only as a fallback for lessons whose prerequisite metadata has not yet been promoted.</p></div></div>

          <div className="mt-8 grid gap-5">{recommendations.map((item, index) => {
            const copy = stateCopy[item.state]
            const firstUnsecured = item.prerequisites.find((candidate) => {
              const progress = storage.getLessonProgress(candidate.id)
              const attempt = storage.getQuizAttempts().filter((entry) => entry.lessonId === candidate.id).sort((a, b) => b.attemptDate - a.attemptDate)[0]
              return !progress?.completed && (attempt?.percentage ?? 0) < 80
            })
            const target = !item.prerequisiteSecure ? (firstUnsecured ?? item.prerequisite ?? item.lesson) : item.lesson
            return <article key={item.lesson.id} className="rounded-[1.5rem] border border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">{index + 1}</span><span className={`rounded-full border px-3 py-1 text-xs font-black ${copy.className}`}>{copy.label}</span><span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{item.lesson.subject}</span></div><h3 className="mt-4 text-2xl font-black">{item.lesson.title}</h3><p className="mt-3 leading-7 text-slate-700">{tamil ? item.recommendationReasonTamil : item.recommendationReason}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-slate-500"><span>{item.latestScore === null ? 'No score yet' : `Latest ${item.latestScore}%`}</span><span>·</span><span>{item.attemptCount} attempt{item.attemptCount === 1 ? '' : 's'}</span><span>·</span><span>{item.quizQuestions} canonical question{item.quizQuestions === 1 ? '' : 's'}</span>{item.misconceptionSignal && <><span>·</span><span className="text-rose-700">Repeated difficulty signal</span></>}</div>
                  {item.prerequisites.length > 0 && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><strong>Prerequisite path:</strong><ul className="mt-2 list-disc space-y-1 pl-5">{item.prerequisites.map((prerequisite) => {
                    const progress = storage.getLessonProgress(prerequisite.id)
                    const attempt = storage.getQuizAttempts().filter((entry) => entry.lessonId === prerequisite.id).sort((a, b) => b.attemptDate - a.attemptDate)[0]
                    const secure = Boolean(progress?.completed) || (attempt?.percentage ?? 0) >= 80
                    return <li key={prerequisite.id}>{prerequisite.title} — {secure ? 'secure enough to continue' : 'needs evidence first'}</li>
                  })}</ul></div>}
                </div>
                <button type="button" onClick={() => navigate(`/lesson/${target.id}`)} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">{!item.prerequisiteSecure ? 'Strengthen prerequisite' : item.nextAction === 'challenge' ? 'Take challenge' : item.nextAction === 'remediate' ? 'Review lesson' : 'Continue'} <ArrowRight className="h-4 w-4" /></button>
              </div>
            </article>
          })}</div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><BrainCircuit className="h-7 w-7 text-violet-700" /><h2 className="mt-4 text-xl font-black">Evidence, not labels</h2><p className="mt-2 leading-7 text-slate-600">A mastery state can change after new practice. It is a learning signal, not a fixed judgement about the learner.</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><Target className="h-7 w-7 text-rose-700" /><h2 className="mt-4 text-xl font-black">Misconception signal</h2><p className="mt-2 leading-7 text-slate-600">Two recent checks below 60% trigger a focused-review signal. Kiki does not infer a diagnosis or hidden cause.</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><CheckCircle2 className="h-7 w-7 text-emerald-700" /><h2 className="mt-4 text-xl font-black">Local-first privacy</h2><p className="mt-2 leading-7 text-slate-600">The constellation is calculated in the browser. This version does not create cloud child profiles or remote monitoring.</p></article>
        </div>

        <button type="button" onClick={() => navigate('/practice')} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 font-black text-white"><Sparkles className="h-5 w-5" /> Practise with Kiki</button>
      </section>
    </main>
  )
}
