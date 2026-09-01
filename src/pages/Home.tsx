import { motion } from 'framer-motion'
import { useLocation } from 'wouter'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Flame,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
} from 'lucide-react'
import { storage } from '../utils/storage'

const worldHighlights = [
  { name: 'Number Nebula', subject: 'Mathematics', symbol: '✦', route: '/subject/mathematics', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Discovery Lab', subject: 'Science', symbol: '⚗', route: '/subject/science', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Story Kingdom', subject: 'English', symbol: '✎', route: '/subject/english', gradient: 'from-fuchsia-500 to-purple-600' },
  { name: 'Code Galaxy', subject: 'Coding', symbol: '</>', route: '/subject/coding', gradient: 'from-orange-500 to-rose-500' },
]

const trustPoints = [
  { icon: ShieldCheck, title: 'Private by default', text: 'Guest progress stays on this device unless you export it.' },
  { icon: CheckCircle2, title: 'Real learning records', text: 'Scores, XP and streaks are calculated from completed activity.' },
  { icon: Sparkles, title: 'Made for every learner', text: 'Keyboard support, reduced motion and clear reading layouts are built in.' },
]

const experienceCards = [
  { icon: UserRound, eyebrow: 'For learners', title: 'Start a personal learning mission', description: 'Choose an avatar, set a daily goal, explore ten worlds and build a real progress story.', route: '/onboarding', action: 'Set up learner' },
  { icon: BarChart3, eyebrow: 'For families', title: 'See progress with clear evidence', description: 'Review lessons, quiz averages, strengths, practice signals and daily-goal activity stored on this device.', route: '/parent-dashboard', action: 'Open Parent View' },
  { icon: GraduationCap, eyebrow: 'For educators', title: 'Plan learning with the live content library', description: 'Browse 77 lessons and 64 quiz questions, save a local class plan and prepare for the secure school release.', route: '/teacher-dashboard', action: 'Open Teacher Workspace' },
]

export default function Home() {
  const [, navigate] = useLocation()
  const profile = storage.getProfile()
  const stats = storage.getStats()
  const hasProgress = stats.completedLessons > 0 || stats.totalAttempts > 0

  return (
    <main className="overflow-hidden bg-[#071124] text-white">
      <section className="relative isolate min-h-[720px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(66,211,146,0.24),_transparent_34%),radial-gradient(circle_at_78%_18%,_rgba(112,92,255,0.32),_transparent_28%),linear-gradient(135deg,#071124_0%,#111742_52%,#1d0f45_100%)]" />
        <div className="absolute -left-24 top-36 h-72 w-72 rounded-full border border-white/10 bg-cyan-300/10 blur-2xl" />
        <div className="absolute -right-20 bottom-16 h-96 w-96 rounded-full border border-white/10 bg-fuchsia-500/10 blur-3xl" />

        <div className="container relative z-10 grid min-h-[720px] items-center gap-14 py-20 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> A universe built for curious minds aged 3–16
            </div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">KirthiVerse Learning Mission</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.05em] sm:text-6xl lg:text-8xl">Learn boldly. <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">Level up daily.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">Explore ten original learning worlds, complete missions, master quizzes and build a progress story that belongs to you.</p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button onClick={() => navigate(profile ? '/today' : '/onboarding')} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 text-lg font-black text-slate-950 shadow-[0_18px_50px_rgba(52,211,153,0.28)] hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(52,211,153,0.38)]">{profile ? 'Open today’s mission' : 'Create learner profile'} <ArrowRight className="h-5 w-5" /></button>
              <button onClick={() => navigate(hasProgress ? '/dashboard' : '/learning-worlds')} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-7 text-lg font-bold text-white backdrop-blur hover:bg-white/15">{hasProgress ? 'Continue my journey' : 'Explore all worlds'} <Compass className="h-5 w-5" /></button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ['77', 'curated lessons'],
                ['64', 'quiz questions'],
                ['10', 'learning worlds'],
              ].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><div className="text-2xl font-black text-white sm:text-3xl">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:text-sm">{label}</div></div>)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.08 }} className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-10 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="relative rounded-[2.25rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">Mission control</p><h2 className="mt-1 text-2xl font-black text-white">{profile ? `Welcome back, ${profile.name}` : 'Choose your next adventure'}</h2></div><div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-3xl">{profile?.avatar ?? '🚀'}</div></div>
              <div className="grid grid-cols-2 gap-3">
                {worldHighlights.map((world) => <motion.button key={world.name} type="button" onClick={() => navigate(world.route)} whileHover={{ y: -5, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className={`group min-h-40 rounded-3xl bg-gradient-to-br ${world.gradient} p-5 text-left shadow-lg focus-visible:ring-white`}><div className="mb-7 flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 text-lg font-black backdrop-blur">{world.symbol}</span><ArrowRight className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" /></div><p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">{world.subject}</p><h3 className="mt-1 text-xl font-black text-white">{world.name}</h3></motion.button>)}
              </div>
              <button onClick={() => navigate('/learning-worlds')} className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/25 px-5 py-4 text-left hover:bg-slate-950/40"><span><span className="block font-black">View all ten worlds</span><span className="text-sm text-slate-300">Find your next lesson or quiz mission</span></span><ArrowRight className="h-5 w-5" /></button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-black uppercase tracking-[0.22em] text-violet-600">One platform, three clear experiences</p><h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Useful every day for learners, families and educators.</h2><p className="mt-5 text-lg leading-8 text-slate-600">The current release is local-first. It delivers real learning value now while identity, secure score sync and school tenancy are built behind controlled release gates.</p></div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {experienceCards.map(({ icon: Icon, eyebrow, title, description, route, action }) => <article key={eyebrow} className="group rounded-[2rem] border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-7 w-7" /></div><p className="mt-7 text-sm font-black uppercase tracking-[0.16em] text-violet-700">{eyebrow}</p><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mt-4 min-h-24 leading-7 text-slate-600">{description}</p><button onClick={() => navigate(route)} className="mt-6 inline-flex items-center gap-2 font-black text-slate-950">{action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></article>)}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 text-slate-950">
        <div className="container">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-violet-600">Your learner journey</p><h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">Every activity moves your story forward.</h2></div><button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white hover:-translate-y-0.5">Open dashboard <ArrowRight className="h-4 w-4" /></button></div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: BookOpen, label: 'Lessons completed', value: stats.completedLessons, tone: 'from-blue-500 to-indigo-600' },
              { icon: Trophy, label: 'Total XP', value: stats.totalXP, tone: 'from-violet-500 to-fuchsia-600' },
              { icon: Flame, label: 'Current streak', value: `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`, tone: 'from-orange-400 to-rose-500' },
            ].map(({ icon: Icon, label, value, tone }) => <div key={label} className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm"><div className={`absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-br ${tone} opacity-10`} /><div className={`mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon className="h-6 w-6" /></div><p className="text-4xl font-black tracking-tight">{value}</p><p className="mt-2 font-semibold text-slate-500">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-slate-950">
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div><p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">Built for trust</p><h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Fun for learners. Clear for families.</h2><p className="mt-5 text-lg leading-8 text-slate-600">KirthiVerse keeps the current experience simple and local-first while preparing for secure family and school profiles in future platform releases.</p><button onClick={() => navigate('/parent-dashboard')} className="mt-8 inline-flex items-center gap-2 rounded-2xl border-2 border-slate-950 px-5 py-3 font-black hover:bg-slate-950 hover:text-white">Explore Parent View <BarChart3 className="h-5 w-5" /></button></div>
          <div className="grid gap-4">{trustPoints.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-6 w-6" /></div><div><h3 className="text-xl font-black">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></div></div>)}</div>
        </div>
      </section>

      <section className="bg-[#071124] py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 p-8 text-center shadow-2xl sm:p-14">
            <Star className="absolute left-8 top-8 h-10 w-10 text-white/20" /><Star className="absolute bottom-10 right-10 h-14 w-14 text-white/20" />
            <h2 className="relative text-4xl font-black text-white sm:text-5xl">Your next great idea starts here.</h2>
            <p className="relative mx-auto mt-5 max-w-2xl text-lg text-white/85">Choose a world, complete a mission and let your progress unlock the next challenge.</p>
            <button onClick={() => navigate(profile ? '/today' : '/onboarding')} className="relative mt-8 inline-flex min-h-14 items-center gap-3 rounded-2xl bg-white px-7 text-lg font-black text-indigo-700 shadow-xl hover:-translate-y-1">{profile ? 'Continue today’s mission' : 'Create a learner profile'} <ArrowRight className="h-5 w-5" /></button>
          </div>
        </div>
      </section>
    </main>
  )
}
