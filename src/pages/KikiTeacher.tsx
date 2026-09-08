import { useState } from 'react'
import { Link } from 'wouter'
import { BookOpen, Headphones, Languages, PartyPopper, ShieldCheck, Sparkles } from 'lucide-react'
import KikiTeacherCharacter, { type KikiTeacherState } from '../components/KikiTeacherCharacter'

type Language = 'en' | 'ta'

const copy = {
  en: {
    eyebrow: 'Kiki animated teacher',
    title: 'Learn with Kiki',
    intro: 'Kiki is your friendly KirthiVerse guide. Choose a mode to see how Kiki can listen, explain and celebrate while keeping learning calm and predictable.',
    idle: 'I’m Kiki, your KirthiVerse guide. Pick a lesson or ask for a structured explanation.',
    listening: 'I’m listening. Take your time, think first, and choose the topic you want help with.',
    explaining: 'I’ll explain one idea at a time, show an example, then give you a chance to try it yourself.',
    celebrating: 'Nice progress! Celebrate the learning, not speed or ranking. Ready for the next small step?',
    listen: 'Listening',
    explain: 'Explaining',
    celebrate: 'Celebrate',
    reset: 'Ready',
    guided: 'Open Guided Tutor',
    worlds: 'Open Learning Worlds',
    privacy: 'Kiki v1 is local-first and deterministic. It does not open unrestricted child chat or send learner messages to a third-party AI service.',
  },
  ta: {
    eyebrow: 'கிகி அனிமேஷன் ஆசிரியர்',
    title: 'கிகியுடன் கற்போம்',
    intro: 'கிகி உங்கள் KirthiVerse வழிகாட்டி. கேட்பது, விளக்குவது, சாதனையை கொண்டாடுவது போன்ற நிலைகளை அமைதியான மற்றும் பாதுகாப்பான முறையில் பார்க்கலாம்.',
    idle: 'நான் கிகி, உங்கள் KirthiVerse வழிகாட்டி. ஒரு பாடத்தைத் தேர்ந்தெடுக்கவும் அல்லது கட்டுப்படுத்தப்பட்ட விளக்கத்தைப் பெறவும்.',
    listening: 'நான் கேட்கிறேன். அவசரம் வேண்டாம். முதலில் யோசித்து, எந்த தலைப்பில் உதவி வேண்டும் என்று தேர்ந்தெடுக்கவும்.',
    explaining: 'ஒரு கருத்தை ஒரு படியாக விளக்குவேன், எடுத்துக்காட்டைக் காட்டுவேன், பிறகு நீங்களே முயற்சிக்க நேரம் தருவேன்.',
    celebrating: 'சிறந்த முன்னேற்றம்! வேகம் அல்லது தரவரிசையை அல்ல, கற்றலை கொண்டாடுவோம். அடுத்த சிறிய படிக்கு தயாரா?',
    listen: 'கேட்கிறேன்',
    explain: 'விளக்கம்',
    celebrate: 'கொண்டாடு',
    reset: 'தயார்',
    guided: 'Guided Tutor திறக்கவும்',
    worlds: 'Learning Worlds திறக்கவும்',
    privacy: 'கிகி v1 local-first முறையில் இயங்குகிறது. கட்டுப்பாடற்ற குழந்தை chat இல்லை; learner செய்திகளை third-party AI சேவைக்கு அனுப்பாது.',
  },
} as const

export default function KikiTeacher() {
  const [state, setState] = useState<KikiTeacherState>('idle')
  const [language, setLanguage] = useState<Language>('en')
  const t = copy[language]
  const speech = state === 'listening' ? t.listening : state === 'explaining' ? t.explaining : state === 'celebrating' ? t.celebrating : t.idle

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-violet-50 px-4 py-10 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-end">
          <button type="button" onClick={() => setLanguage((value) => value === 'en' ? 'ta' : 'en')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-black shadow-sm hover:border-cyan-300 dark:border-white/10 dark:bg-white/5">
            <Languages className="h-4 w-4" aria-hidden="true" /> {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>

        <section className="mt-5 grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{t.eyebrow}</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] sm:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{t.intro}</p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Kiki animation modes">
              <button type="button" aria-pressed={state === 'idle'} onClick={() => setState('idle')} className={`min-h-12 rounded-xl px-4 font-black ${state === 'idle' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-white shadow-sm dark:bg-white/10'}`}>{t.reset}</button>
              <button type="button" aria-pressed={state === 'listening'} onClick={() => setState('listening')} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-black ${state === 'listening' ? 'bg-cyan-600 text-white' : 'bg-white shadow-sm dark:bg-white/10'}`}><Headphones className="h-4 w-4" aria-hidden="true" />{t.listen}</button>
              <button type="button" aria-pressed={state === 'explaining'} onClick={() => setState('explaining')} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-black ${state === 'explaining' ? 'bg-violet-600 text-white' : 'bg-white shadow-sm dark:bg-white/10'}`}><BookOpen className="h-4 w-4" aria-hidden="true" />{t.explain}</button>
              <button type="button" aria-pressed={state === 'celebrating'} onClick={() => setState('celebrating')} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-black ${state === 'celebrating' ? 'bg-amber-400 text-slate-950' : 'bg-white shadow-sm dark:bg-white/10'}`}><PartyPopper className="h-4 w-4" aria-hidden="true" />{t.celebrate}</button>
            </div>

            <div className="mt-7 rounded-[1.75rem] border border-violet-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-violet-400/20 dark:bg-slate-900/80" aria-live="polite">
              <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-300" aria-hidden="true" /><h2 className="font-black">Kiki · கிகி</h2></div>
              <p className="mt-3 text-lg leading-8 text-slate-700 dark:text-slate-200">{speech}</p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/ai-tutor" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-5 font-black text-white">{t.guided}</Link>
              <Link href="/learning-worlds" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-950 px-5 font-black dark:border-white">{t.worlds}</Link>
            </div>
          </div>

          <div className="relative rounded-[2.5rem] border border-white/70 bg-gradient-to-br from-white/90 to-cyan-100/80 p-8 shadow-2xl dark:border-white/10 dark:from-slate-800 dark:to-violet-900/70 sm:p-12">
            <div className="absolute left-6 top-6 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-800 dark:bg-emerald-300 dark:text-slate-950">Local-first</div>
            <KikiTeacherCharacter state={state} />
            <p className="mt-4 text-center text-sm font-bold text-slate-500 dark:text-slate-300">Animated state: {state}</p>
          </div>
        </section>

        <section className="mt-10 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          <ShieldCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div><h2 className="font-black">Safe Kiki v1 boundary</h2><p className="mt-1 text-sm leading-6">{t.privacy}</p></div>
        </section>
      </div>
    </main>
  )
}
