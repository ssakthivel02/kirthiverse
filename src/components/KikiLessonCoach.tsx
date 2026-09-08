import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { Languages, Lightbulb, PartyPopper, Sparkles } from 'lucide-react'
import KikiTeacherCharacter from './KikiTeacherCharacter'

type Language = 'en' | 'ta'
type CoachMode = 'ready' | 'explain' | 'try' | 'celebrate'

type Props = {
  lessonId: string
  subject: string
  title: string
  explanation: string
  example?: string
  completed?: boolean
  compact?: boolean
}

function inferStage(lessonId: string) {
  const match = lessonId.match(/age(\d+)-(\d+)/i)
  if (!match) return 'general'
  const upper = Number(match[2])
  if (upper <= 5) return 'early'
  if (upper <= 10) return 'primary'
  if (upper <= 13) return 'middle'
  return 'teen'
}

export default function KikiLessonCoach({ lessonId, subject, title, explanation, example, completed = false, compact = false }: Props) {
  const [language, setLanguage] = useState<Language>('en')
  const [mode, setMode] = useState<CoachMode>(completed ? 'celebrate' : 'ready')
  const stage = useMemo(() => inferStage(lessonId), [lessonId])
  const characterState = mode === 'explain' ? 'explaining' : mode === 'celebrate' ? 'celebrating' : mode === 'try' ? 'listening' : 'idle'

  const copy = language === 'ta' ? {
    heading: 'கிகி பாட வழிகாட்டி',
    intro: `${title} பாடத்தில் நான் உங்களுடன் இருக்கிறேன்.`,
    ready: stage === 'early' ? 'முதலில் பார்த்து, எண்ணி அல்லது பொருத்திப் பார்ப்போம். மெதுவாக முயற்சி செய்யலாம்.' : 'முதலில் முக்கிய கருத்தை கண்டுபிடிப்போம். பிறகு ஒரு சிறிய படியாக முயற்சி செய்வோம்.',
    explain: `இந்தப் பாடத்தின் முக்கிய கருத்து: ${explanation}`,
    try: example ? `இப்போது இந்த எடுத்துக்காட்டை நீங்களே விளக்கிப் பாருங்கள்: ${example}` : 'இப்போது முக்கிய கருத்தை உங்கள் சொற்களில் சொல்லிப் பாருங்கள்.',
    celebrate: 'நன்றாக முன்னேறுகிறீர்கள். வேகத்தை அல்ல, புரிதலை கொண்டாடுவோம்.',
    explainButton: 'கிகி விளக்கட்டும்',
    tryButton: 'நான் முயற்சிக்கிறேன்',
    celebrateButton: 'முன்னேற்றம்',
    full: 'Kiki Teacher முழுப் பகுதி',
  } : {
    heading: 'Kiki lesson coach',
    intro: `I’m here with you for ${title}.`,
    ready: stage === 'early' ? 'Let’s look, count or match first. We can go slowly and try one small step.' : stage === 'teen' ? 'Start by identifying the core claim, evidence or rule. Then test it with one worked step.' : 'Let’s identify the main idea first, then try one small step.',
    explain: `The key idea in this lesson is: ${explanation}`,
    try: example ? `Now explain this example in your own words: ${example}` : 'Now explain the main idea in your own words.',
    celebrate: 'Good progress. We celebrate understanding, not speed or ranking.',
    explainButton: 'Explain with Kiki',
    tryButton: 'I’ll try',
    celebrateButton: 'Celebrate progress',
    full: 'Open full Kiki Teacher',
  }

  const speech = mode === 'explain' ? copy.explain : mode === 'try' ? copy.try : mode === 'celebrate' ? copy.celebrate : copy.ready

  return (
    <section data-testid="kiki-lesson-coach" className={`rounded-[1.75rem] border border-violet-200 bg-gradient-to-br from-cyan-50 via-white to-violet-50 shadow-sm ${compact ? 'p-5' : 'p-6 sm:p-8'}`} aria-labelledby="kiki-lesson-coach-title">
      <div className={`grid gap-5 ${compact ? '' : 'md:grid-cols-[9rem_1fr] md:items-center'}`}>
        <div className={compact ? 'mx-auto w-28' : 'mx-auto w-36'}>
          <KikiTeacherCharacter state={characterState} />
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">{subject}</p>
              <h2 id="kiki-lesson-coach-title" className="mt-1 text-2xl font-black text-slate-950">{copy.heading}</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">{copy.intro}</p>
            </div>
            <button type="button" onClick={() => setLanguage((value) => value === 'en' ? 'ta' : 'en')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800">
              <Languages className="h-4 w-4" aria-hidden="true" /> {language === 'en' ? 'தமிழ்' : 'English'}
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm" aria-live="polite">
            <div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" /><p className="leading-7 text-slate-700">{speech}</p></div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button type="button" aria-pressed={mode === 'explain'} onClick={() => setMode('explain')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-sm font-black text-white"><Lightbulb className="h-4 w-4" aria-hidden="true" />{copy.explainButton}</button>
            <button type="button" aria-pressed={mode === 'try'} onClick={() => setMode('try')} className="min-h-11 rounded-xl bg-cyan-100 px-3 text-sm font-black text-cyan-950">{copy.tryButton}</button>
            <button type="button" aria-pressed={mode === 'celebrate'} onClick={() => setMode('celebrate')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-3 text-sm font-black text-slate-950"><PartyPopper className="h-4 w-4" aria-hidden="true" />{copy.celebrateButton}</button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500">
            <span>Local-first · no open child chat · no learner message sent externally</span>
            <Link href="/kiki-teacher" className="rounded-lg px-2 py-1 text-violet-700 underline underline-offset-4">{copy.full}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
