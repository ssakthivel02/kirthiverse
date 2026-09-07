import { useMemo } from 'react'
import { useLocation } from 'wouter'
import { ArrowRight, CalendarDays, Download, Home, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react'
import { storage } from '../utils/storage'
import { getAllLocalData, exportAllLocalData } from '../utils/localDataBundle'
import { getLessonMastery, getMasterySummary } from '../utils/mastery'
import { getWeeklyGoalProgress } from '../utils/familyControls'

function downloadLocalReport(name: string) {
  const report = exportAllLocalData()
  const blob = new Blob([report], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kirthiverse-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'learner'}-family-bridge.json`
  link.click()
  URL.revokeObjectURL(url)
}

export default function FamilyBridge() {
  const [, navigate] = useLocation()
  const preferences = storage.getPreferences()
  const tamil = preferences.language === 'Tamil'
  const data = getAllLocalData()
  const weekly = getWeeklyGoalProgress()
  const mastery = getLessonMastery().filter((item) => item.quizQuestions > 0)
  const summary = getMasterySummary()

  const strongest = useMemo(
    () => [...mastery].filter((item) => item.latestScore !== null).sort((a, b) => (b.latestScore ?? 0) - (a.latestScore ?? 0))[0],
    [mastery],
  )
  const needsPractice = useMemo(
    () => [...mastery].filter((item) => item.latestScore !== null).sort((a, b) => (a.latestScore ?? 100) - (b.latestScore ?? 100))[0],
    [mastery],
  )
  const practiceItems = mastery
    .filter((item) => item.state === 'needs_practice' || item.state === 'building')
    .sort((a, b) => (a.latestScore ?? 101) - (b.latestScore ?? 101))
    .slice(0, 3)

  const secureCount = summary.find((item) => item.state === 'secure')?.count ?? 0
  const challengeCount = summary.find((item) => item.state === 'challenge_ready')?.count ?? 0
  const needsCount = summary.find((item) => item.state === 'needs_practice')?.count ?? 0

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-[#071124] text-white">
        <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Family Bridge · குடும்ப இணைப்பு</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">
              {tamil ? 'கற்றல் சான்றுகளை குடும்பத்துக்கு தெளிவாக மாற்றுங்கள்.' : 'Turn learning evidence into clear family support.'}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
              {tamil
                ? 'இந்த பதிப்பு இந்த சாதனத்தில் உள்ள கற்றல் சான்றுகளை மட்டும் பயன்படுத்துகிறது. கிளவுட் குழந்தை கணக்கு, தொலை கண்காணிப்பு அல்லது பள்ளி இணைப்பு இல்லை.'
                : 'This version uses only learning evidence stored on this device. There is no cloud child account, remote monitoring or school connection.'}
            </p>
          </div>
          <button type="button" onClick={() => downloadLocalReport(data.profile.name)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 font-black text-slate-950">
            <Download className="h-4 w-4" aria-hidden="true" /> {tamil ? 'உள்ளூர் அறிக்கையை ஏற்றுமதி செய்' : 'Export local report'}
          </button>
        </div>
      </section>

      <section className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Family learning summary">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black text-slate-500">{tamil ? 'இந்த வார பாடங்கள்' : 'Lessons this week'}</p><p className="mt-3 text-3xl font-black">{weekly.completedLessons}/{weekly.goals.weeklyLessons}</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black text-slate-500">{tamil ? 'உறுதியான திறன்கள்' : 'Secure skills'}</p><p className="mt-3 text-3xl font-black">{secureCount}</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black text-slate-500">{tamil ? 'மேலும் பயிற்சி' : 'Needs practice'}</p><p className="mt-3 text-3xl font-black">{needsCount}</p></article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-black text-slate-500">{tamil ? 'சவாலுக்கு தயார்' : 'Challenge ready'}</p><p className="mt-3 text-3xl font-black">{challengeCount}</p></article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <TrendingUp className="h-7 w-7 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-emerald-950">{tamil ? 'தற்போதைய வலிமை' : 'Current strength'}</h2>
            <p className="mt-3 leading-7 text-emerald-900">{strongest ? `${strongest.lesson.title} · ${strongest.lesson.subject} · ${strongest.latestScore}%` : (tamil ? 'வலிமையை காட்ட இன்னும் வினாடி வினா சான்றுகள் தேவை.' : 'More quiz evidence is needed before showing a strength.')}</p>
          </section>
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <Target className="h-7 w-7 text-amber-700" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-amber-950">{tamil ? 'அடுத்த ஆதரவு பகுதி' : 'Next support area'}</h2>
            <p className="mt-3 leading-7 text-amber-900">{needsPractice ? `${needsPractice.lesson.title} · ${needsPractice.lesson.subject} · ${needsPractice.latestScore}%` : (tamil ? 'இப்போது தனிப்பட்ட பயிற்சி சிக்னல் இல்லை.' : 'There is no individual needs-practice signal yet.')}</p>
          </section>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-800"><Home className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-sm font-black uppercase tracking-[0.15em] text-violet-700">{tamil ? 'வீட்டு ஆதரவு' : 'Home support'}</p><h2 className="mt-2 text-3xl font-black">{tamil ? 'இன்று குடும்பம் உதவக்கூடிய வழிகள்' : 'Ways the family can help today'}</h2></div></div>
          <div className="mt-6 grid gap-4">
            {practiceItems.length ? practiceItems.map((item) => (
              <article key={item.lesson.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-black">{item.lesson.title}</p><p className="mt-1 text-sm text-slate-500">{item.lesson.subject} · {item.latestScore === null ? (tamil ? 'மதிப்பெண் இன்னும் இல்லை' : 'No score yet') : `${item.latestScore}%`}</p><p className="mt-3 leading-7 text-slate-700">{tamil ? item.recommendationReasonTamil : item.recommendationReason}</p></div>
                  <button type="button" onClick={() => navigate(`/lesson/${item.lesson.id}`)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 font-black text-white">{tamil ? 'பாடத்தை திற' : 'Open lesson'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </article>
            )) : <p className="text-slate-500">{tamil ? 'பயிற்சி பரிந்துரைக்க போதுமான சான்றுகள் இன்னும் இல்லை.' : 'There is not enough evidence yet to suggest focused practice.'}</p>}
          </div>
          <p className="mt-5 rounded-xl bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">{tamil ? 'வீட்டு செயல்: குழந்தை ஒரு கருத்தை தன் சொற்களில் விளக்கட்டும்; சரியான பதிலை மட்டும் கேட்காமல் “எப்படி தெரியும்?” என்று கேளுங்கள்.' : 'Home activity: ask the learner to explain one idea in their own words. Instead of only checking the answer, ask “How do you know?”'}</p>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <button type="button" onClick={() => navigate('/mastery')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm"><Sparkles className="h-6 w-6 text-violet-700" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">{tamil ? 'கிகி திறன் விண்மீன்' : 'Kiki Mastery Constellation'}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{tamil ? 'கிகி ஏன் அடுத்த செயலைத் தேர்ந்தெடுத்தது என்பதைப் பாருங்கள்.' : 'See why Kiki picked the next activity.'}</p></button>
          <button type="button" onClick={() => navigate('/weekly-review')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm"><CalendarDays className="h-6 w-6 text-blue-700" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">{tamil ? 'வாராந்திர மதிப்பாய்வு' : 'Weekly review'}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{tamil ? 'ஏழு நாள் கற்றல் செயல்பாட்டை மதிப்பாய்வு செய்யுங்கள்.' : 'Review seven days of learning activity.'}</p></button>
          <button type="button" onClick={() => navigate('/family-goals')} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-sm"><Target className="h-6 w-6 text-emerald-700" aria-hidden="true" /><h2 className="mt-4 text-xl font-black">{tamil ? 'குடும்ப இலக்குகள்' : 'Family goals'}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{tamil ? 'அழுத்தமில்லாத வாராந்திர இலக்குகளை அமைக்கவும்.' : 'Set healthy weekly goals without pressure.'}</p></button>
        </div>

        <section className="mt-8 flex gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" />
          <div><h2 className="text-xl font-black text-blue-950">{tamil ? 'தனியுரிமை வரம்பு' : 'Privacy boundary'}</h2><p className="mt-3 leading-7 text-blue-800">{tamil ? 'Family Bridge இந்த உலாவியின் உள்ளூர் கற்றல் பதிவை மட்டும் படிக்கிறது. இந்த பதிப்பு தொலை கண்காணிப்பு, கிளவுட் குழந்தை சுயவிவரம், ஆசிரியர் சரிபார்ப்பு அல்லது பள்ளி அறிக்கையை வழங்காது.' : 'Family Bridge reads only this browser’s local learning record. This version does not provide remote monitoring, a cloud child profile, teacher verification or school reporting.'}</p></div>
        </section>
      </section>
    </main>
  )
}
