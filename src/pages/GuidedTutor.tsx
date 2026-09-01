import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, ArrowRight, BookOpen, HelpCircle, Lightbulb, RotateCcw, ShieldCheck } from 'lucide-react'

interface TutorTopic {
  explanation: string
  example: string
  hint: string
  nextStudy: string
}

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

export default function GuidedTutor() {
  const [, navigate] = useLocation()
  const subjects = Object.keys(tutorContent)
  const [selectedSubject, setSelectedSubject] = useState(subjects[0])
  const [selectedTopic, setSelectedTopic] = useState('')
  const topics = useMemo(() => Object.keys(tutorContent[selectedSubject] ?? {}), [selectedSubject])
  const content = selectedTopic ? tutorContent[selectedSubject]?.[selectedTopic] : undefined

  function chooseSubject(subject: string) {
    setSelectedSubject(subject)
    setSelectedTopic('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 text-slate-950 dark:from-slate-900 dark:to-slate-800 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate('/')} className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Back to home
        </button>

        <header className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Curated guidance</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Guided Tutor</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">Choose a subject and topic for a structured explanation, worked example, hint and next-study recommendation.</p>
        </header>

        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-6" aria-label="Tutor topic selection">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h2 className="text-xl font-black">1. Select a subject</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {subjects.map((subject) => (
                  <button key={subject} type="button" aria-pressed={selectedSubject === subject} onClick={() => chooseSubject(subject)} className={`min-h-12 rounded-xl px-3 font-black ${selectedSubject === subject ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'}`}>
                    {subject}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-800">
              <h2 className="text-xl font-black">2. Select a topic</h2>
              <div className="mt-5 grid gap-3">
                {topics.map((topic) => (
                  <button key={topic} type="button" aria-pressed={selectedTopic === topic} onClick={() => setSelectedTopic(topic)} className={`min-h-12 rounded-xl px-4 text-left font-bold ${selectedTopic === topic ? 'bg-violet-100 text-violet-950 ring-2 ring-violet-500 dark:bg-violet-400 dark:text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'}`}>
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
                  <button type="button" onClick={() => setSelectedTopic('')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 font-bold hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Choose another</button>
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
                <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400 dark:text-slate-950"><BookOpen className="h-8 w-8" aria-hidden="true" /></div><h2 className="mt-5 text-3xl font-black">Choose a topic to begin</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600 dark:text-slate-300">The tutor uses reviewed, fixed learning guidance. It does not send learner questions to a cloud AI service.</p></div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          <ShieldCheck className="h-6 w-6 shrink-0" aria-hidden="true" /><div><h2 className="font-black">Local and predictable</h2><p className="mt-1 text-sm leading-6">This release provides curated explanations without open chat, child profiling, third-party tracking or unrestricted generated answers.</p></div>
        </section>
      </div>
    </main>
  )
}
