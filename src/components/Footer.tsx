import { Link } from 'wouter'
import { GraduationCap, Heart, ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#071124] text-white">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-violet-500 text-slate-950"><GraduationCap className="h-6 w-6" /></span><div><h2 className="text-xl font-black">KirthiVerse</h2><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Learn · Master · Grow</p></div></div>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">A local-first learning experience with curated lessons, quizzes, mistake review, study planning, family goals, wellbeing controls and separate learner, parent and teacher journeys.</p>
          </div>

          <div>
            <h3 className="text-base font-black">Learning</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><Link href="/today" className="hover:text-cyan-300">Today’s Mission</Link></li>
              <li><Link href="/practice" className="hover:text-cyan-300">Practice Hub</Link></li>
              <li><Link href="/mistake-review" className="hover:text-cyan-300">Mistake Review</Link></li>
              <li><Link href="/study-planner" className="hover:text-cyan-300">Study Planner</Link></li>
              <li><Link href="/learning-worlds" className="hover:text-cyan-300">Learning Worlds</Link></li>
              <li><Link href="/ai-tutor" className="hover:text-cyan-300">Guided Tutor</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-black">Progress and family</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><Link href="/dashboard" className="hover:text-cyan-300">Learner Dashboard</Link></li>
              <li><Link href="/activity" className="hover:text-cyan-300">Learning Activity</Link></li>
              <li><Link href="/bookmarks" className="hover:text-cyan-300">Saved Lessons</Link></li>
              <li><Link href="/progress-report" className="hover:text-cyan-300">Progress Report</Link></li>
              <li><Link href="/weekly-review" className="hover:text-cyan-300">Weekly Review</Link></li>
              <li><Link href="/family-goals" className="hover:text-cyan-300">Family Goals</Link></li>
              <li><Link href="/wellbeing" className="hover:text-cyan-300">Wellbeing Centre</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-black">Adults and support</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><Link href="/parent-dashboard" className="hover:text-cyan-300">Parent View</Link></li>
              <li><Link href="/teacher-dashboard" className="hover:text-cyan-300">Teacher Workspace</Link></li>
              <li><Link href="/teacher-resources" className="hover:text-cyan-300">Teacher Resources</Link></li>
              <li><Link href="/learning-notes" className="hover:text-cyan-300">Learning Notes</Link></li>
              <li><Link href="/help" className="hover:text-cyan-300">Help Centre</Link></li>
              <li><Link href="/platform-health" className="hover:text-cyan-300">Platform Health</Link></li>
              <li><Link href="/settings" className="hover:text-cyan-300">Settings and Data</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-black">Trust and information</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><a href="/parent-guide.html" className="hover:text-cyan-300">Parent and Guardian Guide</a></li>
              <li><a href="/acceptable-use.html" className="hover:text-cyan-300">Acceptable Use</a></li>
              <li><a href="/device-storage.html" className="hover:text-cyan-300">Device Storage</a></li>
              <li><a href="/child-privacy.html" className="hover:text-cyan-300">Privacy for Learners</a></li>
              <li><a href="/privacy.html" className="hover:text-cyan-300">Full Privacy Notice</a></li>
              <li><a href="/safety.html" className="hover:text-cyan-300">Child Safety</a></li>
              <li><a href="/accessibility.html" className="hover:text-cyan-300">Accessibility</a></li>
              <li><a href="/data-retention.html" className="hover:text-cyan-300">Data Retention</a></li>
              <li><a href="/grievance.html" className="hover:text-cyan-300">Support and Grievance</a></li>
              <li><a href="/security.html" className="hover:text-cyan-300">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 KirthiVerse. Learning progress is stored on the current device in this release.</p>
          <div className="flex flex-wrap gap-4"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> No behavioural advertising</span><span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 text-rose-300" /> Built for safe learning</span></div>
        </div>
      </div>
    </footer>
  )
}
