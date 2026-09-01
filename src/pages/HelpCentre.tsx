import { Link } from 'wouter'
import { BookOpen, CircleHelp, Download, GraduationCap, HeartHandshake, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react'

const topics = [
  { icon: BookOpen, title: 'Start as a learner', text: 'Create a local learner profile, choose favourite subjects, open Today’s Mission and complete one lesson or quiz.', href: '/onboarding', label: 'Set up learner profile' },
  { icon: HeartHandshake, title: 'Use the parent view', text: 'Review activity stored on this device, set realistic family goals and print a weekly reflection.', href: '/parent-dashboard', label: 'Open Parent View' },
  { icon: GraduationCap, title: 'Use teacher resources', text: 'Search the lesson and quiz catalogue, prepare a local lesson plan and print a resource list.', href: '/teacher-resources', label: 'Open Teacher Resources' },
  { icon: Smartphone, title: 'Install for easier access', text: 'Use your browser’s Install App or Add to Home Screen option. KirthiVerse remains usable as a normal website.', href: '/platform-health', label: 'Check install readiness' },
]

export default function HelpCentre() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container py-14"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200"><CircleHelp className="h-4 w-4" /> Help centre</div><h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em]">Clear help for learners, families and teachers.</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">Find the right starting point, solve common browser issues and understand exactly what this local-first release can and cannot do.</p></div>
      </section>

      <section className="container py-10">
        <div className="grid gap-6 md:grid-cols-2">{topics.map(({ icon: Icon, title, text, href, label }) => <article key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Icon className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-black">{title}</h2><p className="mt-2 leading-7 text-slate-600">{text}</p><Link href={href} className="mt-5 inline-flex font-black text-violet-700 underline">{label}</Link></article>)}</div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-3xl font-black">Common troubleshooting</h2><div className="mt-6 space-y-5">
            <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-black">My progress is missing</summary><p className="mt-3 leading-7 text-slate-600">Progress is stored in the current browser. Check that you are using the same device and browser profile. Private browsing, browser cleanup or a different device will not contain the original record.</p><Link href="/settings" className="mt-3 inline-flex font-black text-violet-700 underline">Open data settings</Link></details>
            <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-black">A direct page link opens the homepage first</summary><p className="mt-3 leading-7 text-slate-600">GitHub Pages briefly redirects application routes through the homepage, then restores the requested route. Wait for the interactive application to finish loading.</p></details>
            <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-black">The website looks outdated</summary><p className="mt-3 leading-7 text-slate-600">Reload once while online. Installed browsers may keep an older offline shell until the current production files are downloaded.</p></details>
            <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-black">A quiz score did not add more XP</summary><p className="mt-3 leading-7 text-slate-600">XP is awarded only once for the first completed quiz linked to a lesson. Repeated attempts improve mastery evidence without creating unlimited XP.</p></details>
            <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-black">Can a school see this learner record?</summary><p className="mt-3 leading-7 text-slate-600">No. This release has no school accounts, cloud roster, remote monitoring or teacher access to the browser’s local learner record.</p></details>
          </div></section>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6"><div className="flex gap-3"><Download className="h-6 w-6 shrink-0 text-emerald-700" /><div><h2 className="text-xl font-black text-emerald-950">Protect local progress</h2><p className="mt-2 leading-7 text-emerald-800">Export a backup before clearing browser data, changing devices or reinstalling the browser.</p><Link href="/settings" className="mt-4 inline-flex font-black text-emerald-900 underline">Export progress data</Link></div></div></section>
            <section className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><div className="flex gap-3"><RefreshCw className="h-6 w-6 shrink-0 text-blue-700" /><div><h2 className="text-xl font-black text-blue-950">Run a local diagnostic</h2><p className="mt-2 leading-7 text-blue-800">Check browser storage, connectivity, service-worker support and content availability without sending diagnostic data anywhere.</p><Link href="/platform-health" className="mt-4 inline-flex font-black text-blue-900 underline">Open Platform Health</Link></div></div></section>
            <section className="rounded-[1.75rem] border border-slate-300 bg-white p-6"><div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-slate-700" /><div><h2 className="text-xl font-black">Safety and privacy</h2><p className="mt-2 leading-7 text-slate-600">Review child-readable privacy, accessibility, data-retention and support information.</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-black"><a href="/child-privacy.html" className="underline">Child privacy</a><a href="/accessibility.html" className="underline">Accessibility</a><a href="/grievance.html" className="underline">Support</a></div></div></div></section>
          </aside>
        </div>
      </section>
    </main>
  )
}
