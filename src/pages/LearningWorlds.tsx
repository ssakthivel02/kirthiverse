import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'wouter'
import { ArrowRight, BookOpen, Compass, Search, Sparkles, Trophy, Zap } from 'lucide-react'
import { lessons } from '../content/lessons'
import { quizzes } from '../content/quizzes'
import { storage } from '../utils/storage'

const subjects = [
  { id: 'mathematics', name: 'Mathematics', world: 'Number Nebula', icon: '✦', color: 'from-blue-500 via-indigo-500 to-violet-600', description: 'Navigate patterns, numbers, shapes and problem-solving missions.' },
  { id: 'science', name: 'Science', world: 'Discovery Lab', icon: '⚗', color: 'from-emerald-500 via-teal-500 to-cyan-600', description: 'Investigate life, Earth, energy and the physical world.' },
  { id: 'english', name: 'English', world: 'Story Kingdom', icon: '✎', color: 'from-fuchsia-500 via-purple-500 to-indigo-600', description: 'Build confidence in reading, grammar, speaking and writing.' },
  { id: 'coding', name: 'Coding', world: 'Code Galaxy', icon: '</>', color: 'from-orange-500 via-rose-500 to-pink-600', description: 'Think like a programmer and solve computational challenges.' },
  { id: 'geography', name: 'Geography', world: 'Planet Explorer', icon: '◎', color: 'from-cyan-500 via-sky-500 to-blue-600', description: 'Explore maps, places, people, climates and our changing planet.' },
  { id: 'history', name: 'History', world: 'Time Archive', icon: '⌛', color: 'from-amber-500 via-orange-500 to-red-600', description: 'Decode evidence, civilisations, inventions and turning points.' },
  { id: 'tamil', name: 'Tamil', world: 'Tamil Constellation', icon: 'தமிழ்', color: 'from-red-500 via-rose-500 to-fuchsia-600', description: 'Grow confidence with letters, words, meaning and expression.' },
  { id: 'music', name: 'Music', world: 'Rhythm Orbit', icon: '♫', color: 'from-pink-500 via-fuchsia-500 to-purple-600', description: 'Discover beat, pitch, instruments and musical patterns.' },
  { id: 'arts', name: 'Arts', world: 'Creative Studio', icon: '◉', color: 'from-violet-500 via-indigo-500 to-blue-600', description: 'Experiment with colour, drawing, shape and visual storytelling.' },
  { id: 'life-skills', name: 'Life Skills', world: 'Life Launchpad', icon: '★', color: 'from-lime-500 via-emerald-500 to-teal-600', description: 'Practise communication, organisation, choices and wellbeing.' },
]

const slug = (value: string) => value.toLowerCase().replace(/\s+/g, '-')

export default function LearningWorlds() {
  const [, navigate] = useLocation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'started' | 'complete'>('all')
  const progress = storage.getLessonsProgress()

  const cards = useMemo(() => subjects.map((subject) => {
    const subjectLessons = lessons.filter((lesson) => slug(lesson.subject) === subject.id)
    const subjectQuizzes = quizzes.filter((question) => slug(question.subject) === subject.id)
    const completed = subjectLessons.filter((lesson) => progress[lesson.id]?.completed).length
    const percentage = subjectLessons.length ? Math.round((completed / subjectLessons.length) * 100) : 0
    return { ...subject, lessonCount: subjectLessons.length, quizCount: subjectQuizzes.length, completed, percentage }
  }), [progress])

  const visibleCards = cards.filter((subject) => {
    const matchesSearch = `${subject.name} ${subject.world} ${subject.description}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'started' && subject.percentage > 0 && subject.percentage < 100) || (filter === 'complete' && subject.percentage === 100)
    return matchesSearch && matchesFilter
  })

  const completedLessons = Object.values(progress).filter((item) => item.completed).length
  const activeWorlds = cards.filter((subject) => subject.percentage > 0).length

  return (
    <main className="min-h-screen bg-[#071124] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(34,211,238,0.2),_transparent_30%),radial-gradient(circle_at_80%_10%,_rgba(139,92,246,0.25),_transparent_28%),linear-gradient(135deg,#071124,#111742,#231044)]" />
        <div className="container relative z-10 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200">
                <Sparkles className="h-4 w-4" /> Ten worlds. One learner journey.
              </div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-violet-300">Mission map</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-6xl">Choose a world. Start a mission. Build mastery.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">Each world contains curated lessons and quizzes. Your real activity unlocks progress, XP and achievements on this device.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, value: lessons.length, label: 'Lessons' },
                { icon: Trophy, value: quizzes.length, label: 'Questions' },
                { icon: Zap, value: completedLessons, label: 'Completed' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
                  <Icon className="mx-auto h-5 w-5 text-cyan-200" />
                  <div className="mt-2 text-2xl font-black">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-10 text-slate-950">
        <div className="container">
          <div className="mb-8 grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">Search learning worlds</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search worlds, subjects or missions" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-semibold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
            </label>
            <div className="flex flex-wrap gap-2" aria-label="Filter worlds">
              {([
                ['all', 'All worlds'],
                ['started', 'In progress'],
                ['complete', 'Completed'],
              ] as const).map(([value, label]) => (
                <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-3 text-sm font-black ${filter === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-600">Your universe</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{visibleCards.length} worlds ready to explore</h2>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">
              <Compass className="h-4 w-4" /> {activeWorlds} worlds started
            </div>
          </div>

          {visibleCards.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleCards.map((subject, index) => (
                <motion.button
                  key={subject.id}
                  type="button"
                  onClick={() => navigate(`/subject/${subject.id}`)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035 }}
                  whileHover={{ y: -7 }}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white text-left shadow-sm hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-violet-300"
                >
                  <div className={`relative min-h-48 overflow-hidden bg-gradient-to-br ${subject.color} p-6 text-white`}>
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/15 bg-white/10" />
                    <div className="absolute bottom-3 right-5 text-[6rem] font-black leading-none text-white/10">{subject.icon}</div>
                    <div className="relative flex items-start justify-between">
                      <div className="grid h-14 min-w-14 place-items-center rounded-2xl border border-white/20 bg-white/15 px-3 text-xl font-black backdrop-blur">{subject.icon}</div>
                      <span className="rounded-full bg-slate-950/20 px-3 py-1 text-xs font-black backdrop-blur">{subject.percentage}% complete</span>
                    </div>
                    <div className="relative mt-8">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">{subject.name}</p>
                      <h3 className="mt-1 text-3xl font-black tracking-tight text-white">{subject.world}</h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="min-h-14 leading-7 text-slate-600">{subject.description}</p>
                    <div className="mt-5 flex items-center justify-between text-sm font-bold text-slate-500">
                      <span>{subject.lessonCount} lessons</span>
                      <span>{subject.quizCount} questions</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full bg-gradient-to-r ${subject.color}`} style={{ width: `${subject.percentage}%` }} />
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-500">{subject.completed} missions complete</span>
                      <span className="inline-flex items-center gap-2 font-black text-slate-950">Enter world <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center">
              <Compass className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-2xl font-black">No worlds match that search</h2>
              <p className="mt-2 text-slate-500">Try another word or reset the filters.</p>
              <button onClick={() => { setQuery(''); setFilter('all') }} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Reset filters</button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
