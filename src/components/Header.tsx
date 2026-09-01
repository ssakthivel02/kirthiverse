import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Award, BarChart3, Bookmark, CalendarCheck2, CalendarRange, CircleAlert, CircleHelp, ClipboardList, Dumbbell, Flame, GraduationCap, HeartPulse, History, Library, Menu, Rocket, Search, Settings, Target, UserRound, X, Zap } from 'lucide-react'
import { storage } from '../utils/storage'

const primaryLinks = [
  { label: 'Today', href: '/today', icon: CalendarCheck2 },
  { label: 'Practice', href: '/practice', icon: Dumbbell },
  { label: 'Learning Worlds', href: '/learning-worlds', icon: Rocket },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Guided Tutor', href: '/ai-tutor', icon: GraduationCap },
  { label: 'Achievements', href: '/achievements', icon: Award },
]

const utilityLinks = [
  { label: 'Mistake review', href: '/mistake-review', icon: CircleAlert },
  { label: 'Study planner', href: '/study-planner', icon: CalendarRange },
  { label: 'Learning activity', href: '/activity', icon: History },
  { label: 'Learning notes', href: '/learning-notes', icon: ClipboardList },
  { label: 'Saved lessons', href: '/bookmarks', icon: Bookmark },
  { label: 'Progress report', href: '/progress-report', icon: BarChart3 },
  { label: 'Weekly review', href: '/weekly-review', icon: CalendarCheck2 },
  { label: 'Family goals', href: '/family-goals', icon: Target },
  { label: 'Wellbeing centre', href: '/wellbeing', icon: HeartPulse },
  { label: 'Teacher resources', href: '/teacher-resources', icon: Library },
  { label: 'Help centre', href: '/help', icon: CircleHelp },
  { label: 'Settings and data', href: '/settings', icon: Settings },
]

const roleLinks = [
  { label: 'Learner', href: '/dashboard' },
  { label: 'Parent', href: '/parent-dashboard' },
  { label: 'Teacher', href: '/teacher-dashboard' },
]

function isActive(location: string, href: string) {
  return href === '/' ? location === '/' : location === href || location.startsWith(`${href}/`)
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [location] = useLocation()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const profile = storage.getProfile()
  const stats = storage.getStats()
  const level = Math.floor(stats.totalXP / 500) + 1
  const profileRoute = profile ? '/profile' : '/onboarding'

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#071124]/95 dark:text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-slate-950 focus:px-4 focus:py-3 focus:font-bold focus:text-white">Skip to content</a>
      <nav className="container flex min-h-[4.5rem] items-center justify-between gap-4" aria-label="Primary navigation">
        <Link href="/" className="group flex items-center gap-3" aria-label="KirthiVerse home">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 text-slate-950 shadow-lg transition-transform group-hover:-rotate-3 group-hover:scale-105"><Rocket className="h-6 w-6" aria-hidden="true" /></span>
          <span><span className="block text-xl font-black tracking-[-0.04em]">KirthiVerse</span><span className="hidden text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500 sm:block dark:text-slate-300">Learn · Master · Grow</span></span>
        </Link>

        <div className="hidden items-center gap-1 2xl:flex">
          {primaryLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={isActive(location, href) ? 'page' : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-black ${isActive(location, href) ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white'}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>)}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5" aria-label="Choose experience">
            {roleLinks.map((link) => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-xs font-black ${isActive(location, link.href) ? 'bg-white text-slate-950 shadow-sm dark:bg-cyan-300' : 'text-slate-500 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}>{link.label}</Link>)}
          </div>
          <Link href="/help" aria-label="Open help centre" className={`grid h-11 w-11 place-items-center rounded-xl border ${isActive(location, '/help') ? 'border-cyan-400 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white hover:border-cyan-300 dark:border-white/10 dark:bg-white/5'}`}><CircleHelp className="h-5 w-5" aria-hidden="true" /></Link>
          <Link href="/settings" aria-label="Open settings and data" className={`grid h-11 w-11 place-items-center rounded-xl border ${isActive(location, '/settings') ? 'border-cyan-400 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white hover:border-cyan-300 dark:border-white/10 dark:bg-white/5'}`}><Settings className="h-5 w-5" aria-hidden="true" /></Link>
          <Link href={profileRoute} aria-label={profile ? 'Edit learner profile' : 'Set up learner profile'} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm hover:border-cyan-300 dark:border-white/10 dark:bg-white/5">
            <span className="text-2xl" aria-hidden="true">{profile?.avatar ?? '🚀'}</span>
            <span className="hidden 2xl:block"><span className="block max-w-24 truncate text-sm font-black">{profile?.name ?? 'Guest learner'}</span><span className="flex items-center gap-2 text-[0.68rem] font-bold text-slate-500 dark:text-slate-300"><Zap className="h-3 w-3 text-violet-500" aria-hidden="true" /> L{level} · {stats.totalXP} XP <Flame className="ml-1 h-3 w-3 text-orange-500" aria-hidden="true" /> {stats.currentStreak}</span></span>
          </Link>
        </div>

        <button ref={triggerRef} type="button" onClick={() => setIsOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-cyan-200 lg:hidden dark:border-white/10 dark:bg-white/5" aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen} aria-controls={isOpen ? 'mobile-navigation' : undefined}>{isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}</button>
      </nav>

      {isOpen && (
        <div ref={menuRef} id="mobile-navigation" className="absolute left-0 right-0 top-[4.5rem] border-b border-slate-200 bg-white shadow-2xl lg:hidden dark:border-white/10 dark:bg-[#071124]">
          <div className="container max-h-[calc(100vh-4.5rem)] overflow-y-auto py-5">
            <Link href={profileRoute} className="mb-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 p-4 text-white">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-3xl" aria-hidden="true">{profile?.avatar ?? '🚀'}</span>
              <span className="flex-1"><span className="block font-black">{profile?.name ?? 'Set up learner profile'}</span><span className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80"><span>Level {level}</span><span>{stats.totalXP} XP</span><span>{stats.currentStreak} day streak</span></span></span><UserRound className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div className="grid gap-2">
              {primaryLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={isActive(location, href) ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 font-black ${isActive(location, href) ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}><Icon className="h-5 w-5" aria-hidden="true" />{label}</Link>)}
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10"><p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Family, review and support</p><div className="grid gap-2 sm:grid-cols-2">{utilityLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 font-black ${isActive(location, href) ? 'border-cyan-400 bg-cyan-50 text-cyan-900 dark:bg-cyan-300 dark:text-slate-950' : 'border-slate-200 dark:border-white/10'}`}><Icon className="h-5 w-5" aria-hidden="true" />{label}</Link>)}</div></div>
            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10"><p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">Choose experience</p><div className="grid grid-cols-3 gap-2">{roleLinks.map((link) => <Link key={link.href} href={link.href} className={`rounded-xl border px-3 py-3 text-center text-sm font-black ${isActive(location, link.href) ? 'border-cyan-400 bg-cyan-50 text-cyan-900 dark:bg-cyan-300 dark:text-slate-950' : 'border-slate-200 dark:border-white/10'}`}>{link.label}</Link>)}</div></div>
          </div>
        </div>
      )}
    </header>
  )
}
