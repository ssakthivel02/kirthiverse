import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, ArrowRight, BookOpen, HelpCircle, Languages, Lightbulb, PartyPopper, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import KikiTeacherCharacter, { type KikiTeacherState } from '../components/KikiTeacherCharacter'

interface TutorTopic {
  explanation: string
  example: string
  hint: string
  nextStudy: string
}

type Language = 'en' | 'ta'
type TutorMode = 'ready' | 'explain' | 'try' | 'celebrate'

const tutorContent: Record<string, Record<string, TutorTopic>> = {
  Mathematics: {
    Fractions: {
      explanation: 'A fraction represents a part of a whole. The denominator tells how many equal parts make the whole, and the numerator tells how many parts are being used.',
      example: '3/4 means three parts out of four equal parts.',
      hint: 'Draw a shape, divide it into equal parts and shade the numerator.',
      nextStudy: 'Continue with equivalent fractions and comparing fractions.',
    },
    Decimals: {
      explanation: 'Decimals express whole numbers and fractional parts using place value. The first digit after the point is tenths, followed by hundredths and thousandths.',
      example: '0.5 is the same as 1/2, while 0.25 is the same as 1/4.',
      hint: 'Use a place-value chart before calculating with decimals.',
      nextStudy: 'Practise converting between fractions and decimals.',
    },
    Percentages: {
      explanation: 'A percentage describes an amount out of 100. It can also be written as a fraction or decimal.',
      example: '75% = 75/100 = 0.75.',
      hint: 'To convert a decimal to a percentage, multiply it by 100.',
      nextStudy: 'Calculate simple percentages of quantities.',
    },
  },
  Science: {
    Photosynthesis: {
      explanation: 'Photosynthesis is the process plants use to make glucose using light energy, carbon dioxide and water. Oxygen is released during the process.',
      example: 'A healthy plant placed in suitable light can make the food it needs for growth.',
      hint: 'Remember: photo means light and synthesis means making.',
      nextStudy: 'Explore how leaves, roots and stems support photosynthesis.',
    },
    'The Water Cycle': {
      explanation: 'Water continually moves through evaporation, condensation, precipitation and collection.',
      example: 'Water vapour cools and condenses into droplets, similar to droplets forming on a cold surface.',
      hint: 'Follow one drop of water through each stage of the cycle.',
      nextStudy: 'Investigate how temperature and weather affect the water cycle.',
    },
    'The Human Body': {
      explanation: 'Body systems perform different jobs and work together, including the skeletal, muscular, circulatory, respiratory and digestive systems.',
      example: 'During exercise, the respiratory and circulatory systems work together to deliver more oxygen.',
      hint: 'Connect each organ to its system and its main job.',
      nextStudy: 'Compare how two body systems cooperate during an activity.',
    },
  },
  English: {
    Nouns: {
      explanation: 'A noun names a person, place, thing or idea. Nouns can act as subjects and objects in sentences.',
      example: 'In “The cat sat on the mat”, cat and mat are nouns.',
      hint: 'Ask what person, place, thing or idea the word names.',
      nextStudy: 'Explore common, proper, concrete and abstract nouns.',
    },
    Verbs: {
      explanation: 'A verb shows an action, occurrence or state of being. It helps explain what the subject does or is.',
      example: 'In “She runs quickly”, runs is the verb.',
      hint: 'Ask what is happening or what state is being described.',
      nextStudy: 'Practise past, present and future verb forms.',
    },
    Adjectives: {
      explanation: 'An adjective describes or adds detail to a noun.',
      example: 'In “The blue sky is beautiful”, blue and beautiful are adjectives.',
      hint: 'Look for words answering what kind, which one or how many.',
      nextStudy: 'Compare comparative and superlative adjectives.',
    },
  },
  Coding: {
    Variables: {
      explanation: 'A variable is a named place for storing a value that a program can use or change.',
      example: 'let age = 10 stores the number 10 in a variable named age.',
      hint: 'Choose a clear name that explains what the value represents.',
      nextStudy: 'Explore numbers, strings and Boolean values.',
    },
    Loops: {
      explanation: 'A loop repeats instructions, reducing duplicated code and making repeated tasks easier to manage.',
      example: 'A for loop can run the same instruction ten times.',
      hint: 'Identify what repeats and when the repetition should stop.',
      nextStudy: 'Compare for loops and while loops.',
    },
    Functions: {
      explanation: 'A function is a reusable group of instructions designed to complete a specific task.',
      example: 'A greet function can display a welcome message whenever it is called.',
      hint: 'Give each function one clear responsibility.',
      nextStudy: 'Learn about parameters, arguments and return values.',
    },
  },
}

const uiCopy = {
  en: {
    eyebrow: 'Curated guidance with Kiki',
    title: 'Guided Tutor',
    intro: 'Choose a subject and topic. Kiki will guide you through a reviewed explanation, example, hint and next step.',
    subject: '1. Select a subject',
    topic: '2. Select a topic',
    choose: 'Choose a topic to begin',
    chooseBody: 'Kiki uses reviewed, fixed learning guidance. Learner questions are not sent to a cloud AI service.',
    ready: 'Pick a topic and I’ll learn it with you one calm step at a time.',
    explain: 'Let’s focus on the key idea first. Read the explanation, then connect it to the example below.',
    try: 'Your turn: explain the example in your own words before opening the hint.',
    celebrate: 'Nice work. Understanding matters more than speed or ranking. Your next study step is ready below.',
    explainButton: 'Explain with Kiki',
    tryButton: 'I’ll try',
    celebrateButton: 'Celebrate progress',
    another: 'Choose another',
    localTitle: 'Local and predictable',
    localBody: 'This release provides curated explanations without open chat, child profiling, third-party tracking or unrestricted generated answers.',
  },
  ta: {
    eyebrow: 'கிகியுடன் தேர்ந்தெடுக்கப்பட்ட வழிகாட்டல்',
    title: 'வழிகாட்டும் ஆசிரியர்',
    intro: 'பாடப்பிரிவையும் தலைப்பையும் தேர்ந்தெடுக்கவும். சரிபார்க்கப்பட்ட விளக்கம், எடுத்துக்காட்டு, குறிப்பு மற்றும் அடுத்த படி மூலம் கிகி வழிகாட்டும்.',
    subject: '1. பாடப்பிரிவை தேர்ந்தெடுக்கவும்',
    topic: '2. தலைப்பை தேர்ந்தெடுக்கவும்',
    choose: 'தொடங்க ஒரு தலைப்பை தேர்ந்தெடுக்கவும்',
    chooseBody: 'கிகி சரிபார்க்கப்பட்ட நிலையான கற்றல் உள்ளடக்கத்தைப் பயன்படுத்துகிறது. மாணவர் கேள்விகள் cloud AI சேவைக்கு அனுப்பப்படுவதில்லை.',
    ready: 'ஒரு தலைப்பைத் தேர்ந்தெடுக்கவும். அவசரமின்றி ஒவ்வொரு படியாகவும் உங்களுடன் கற்பேன்.',
    explain: 'முதலில் முக்கிய கருத்தை கவனிப்போம். விளக்கத்தை வாசித்து, கீழே உள்ள எடுத்துக்காட்டுடன் இணைத்துப் பாருங்கள்.',
    try: 'இப்போது உங்கள் முறை: குறிப்பைப் பார்க்கும் முன் எடுத்துக்காட்டை உங்கள் சொற்களில் விளக்கிப் பாருங்கள்.',
    celebrate: 'நல்ல முன்னேற்றம். வேகம் அல்லது தரவரிசையை விட புரிதலே முக்கியம். அடுத்த கற்றல் படி கீழே உள்ளது.',
    explainButton: 'கிகி விளக்கட்டும்',
    tryButton: 'நான் முயற்சிக்கிறேன்',
    celebrateButton: 'முன்னேற்றத்தை கொண்டாடு',
    another: 'வேறு தலைப்பு',
    localTitle: 'உள்ளூர் மற்றும் கணிக்கக்கூடியது',
    localBody: 'Open chat, குழந்தை profiling, third-party tracking அல்லது கட்டுப்பாடற்ற generated answers இன்றி தேர்ந்தெடுக்கப்பட்ட விளக்கங்கள் வழங்கப்படுகின்றன.',
  },
} as const

export default function GuidedTutor() {
  const [, navigate] = useLocation()
  const subjects = Object.keys(tutorContent)
  const [selectedSubject, setSelectedSubject] = useState(subjects[0])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [mode, setMode] = useState<TutorMode>('ready')
  const topics = useMemo(() => Object.keys(tutorContent[selectedSubject] ?? {}), [selectedSubject])
  const content = selectedTopic ? tutorContent[selectedSubject]?.[selectedTopic] : undefined
  const copy = uiCopy[language]

  const kikiState: KikiTeacherState = mode === 'explain' ? 'explaining' : mode === 'try' ? 'listening' : mode === 'celebrate' ? 'celebrating' : 'idle'
  const kikiSpeech = mode === 'explain' ? copy.explain : mode === 'try' ? copy.try : mode === 'celebrate' ? copy.celebrate : copy.ready

  function chooseSubject(subject: string) {
    setSelectedSubject(subject)
    setSelectedTopic('')
    setMode('ready')
  }

  function chooseTopic(topic: string) {
    setSelectedTopic(topic)
    setMode('ready')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 text-slate-950 dark:from-slate-900 dark:to-slate-800 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/')} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back to home
          </button>
          <button type="button" onClick={() => setLanguage((value) => value === 'en' ? 'ta' : 'en')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-white">
            <Languages className="h-4 w-4" aria-hidden="true" /> {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>

        <header className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{copy.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{copy.intro}</p>
        </header>

        <section data-testid="guided-tutor-kiki" className="mb-8 grid gap-5 rounded-[2rem] border border-violet-200 bg-gradient-to-br from-cyan-50 via-white to-violet-50 p-6 shadow-sm md:grid-cols-[10rem_1fr] md:items-center dark:border-violet-900/70 dark:from-slate-800 dark:via-slate-800 dark:to-violet-950/30">
          <div className="mx-auto w-36"><KikiTeacherCharacter state={kikiState} compact /></div>
          <div>
            <div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" /><p className="text-lg font-bold leading-8 text-slate-700 dark:text-slate-200" aria-live="polite">{kikiSpeech}</p></div>
            {content && (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button type="button" aria-pressed={mode === 'explain'} onClick={() => setMode('explain')} className="min-h-11 rounded-xl bg-violet-600 px-3 text-sm font-black text-white">{copy.explainButton}</button>
                <button type="button" aria-pressed={mode === 'try'} onClick={() => setMode('try')} className="min-h-11 rounded-xl bg-cyan-100 px-3 text-sm font-black text-cyan-950">{copy.tryButton}</button>
                <button type="button" aria-pressed={mode === 'celebrate'} onClick={() => setMode('celebrate')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-300 px-3 text-sm font-black text-slate-950"><PartyPopper className="h-4 w-4" aria-hidden="true" />{copy.celebrateButton}</button>
              </div>
            )}
            <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">Reviewed fixed guidance · no open child chat · no learner prompt sent externally</p>
          </div>
        </section>

        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-6" aria-label="Tutor topic selection">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h2 className="text-xl font-black">{copy.subject}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {subjects.map((subject) => (
                  <button key={subject} type="button" aria-pressed={selectedSubject === subject} onClick={() => chooseSubject(subject)} className={`min-h-12 rounded-xl px-3 font-black ${selectedSubject === subject ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'}`}>
                    {subject}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h2 className="text-xl font-black">{copy.topic}</h2>
              <div className="mt-5 grid gap-3">
                {topics.map((topic) => (
                  <button key={topic} type="button" aria-pressed={selectedTopic === topic} onClick={() => chooseTopic(topic)} className={`min-h-12 rounded-xl px-4 text-left font-bold ${selectedTopic === topic ? 'bg-violet-100 text-violet-950 ring-2 ring-violet-500 dark:bg-violet-400 dark:text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'}`}>
                    {topic}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8 dark:border-white/10 dark:bg-slate-800" aria-live="polite">
            {content ? (
              <div>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                  <div><p className="text-sm font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">{selectedSubject}</p><h2 className="mt-1 text-3xl font-black">{selectedTopic}</h2></div>
                  <button type="button" onClick={() => { setSelectedTopic(''); setMode('ready') }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 font-bold hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"><RotateCcw className="h-4 w-4" aria-hidden="true" /> {copy.another}</button>
                </div>
                <div className="mt-7 space-y-6">
                  <article><div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-blue-600" aria-hidden="true" /><h3 className="text-xl font-black">Explanation</h3></div><p className="mt-3 text-lg leading-8 text-slate-700 dark:text-slate-200">{content.explanation}</p></article>
                  <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20"><div className="flex items-center gap-3"><HelpCircle className="h-6 w-6 text-blue-700" aria-hidden="true" /><h3 className="text-xl font-black text-blue-950 dark:text-blue-200">Example</h3></div><p className="mt-3 leading-7 text-blue-900 dark:text-blue-200">{content.example}</p></article>
                  <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20"><div className="flex items-center gap-3"><Lightbulb className="h-6 w-6 text-amber-700" aria-hidden="true" /><h3 className="text-xl font-black text-amber-950 dark:text-amber-200">Hint</h3></div><p className="mt-3 leading-7 text-amber-900 dark:text-amber-200">{content.hint}</p></article>
                  <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20"><h3 className="text-xl font-black text-emerald-950 dark:text-emerald-200">Next study step</h3><p className="mt-3 leading-7 text-emerald-900 dark:text-emerald-200">{content.nextStudy}</p></article>
                </div>
                <button type="button" onClick={() => navigate('/learning-worlds')} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 font-black text-white">Open Learning Worlds <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            ) : (
              <div className="grid min-h-[28rem] place-items-center text-center">
                <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400 dark:text-slate-950"><BookOpen className="h-8 w-8" aria-hidden="true" /></div><h2 className="mt-5 text-3xl font-black">{copy.choose}</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600 dark:text-slate-300">{copy.chooseBody}</p></div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          <ShieldCheck className="h-6 w-6 shrink-0" aria-hidden="true" /><div><h2 className="font-black">{copy.localTitle}</h2><p className="mt-1 text-sm leading-6">{copy.localBody}</p></div>
        </section>
      </div>
    </main>
  )
}
