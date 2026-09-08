import { CalendarCheck, Clock3, Flag, ListChecks } from 'lucide-react'
import FamilyBridge from './FamilyBridge'
import { getSevenDayActivity, getWeeklyGoalProgress } from '../utils/familyControls'
import { getStudyPlanSummary } from '../utils/studyPlanner'
import { getMasterySummary } from '../utils/mastery'
import { storage } from '../utils/storage'

function milestoneText(tamil: boolean, secure: number, challengeReady: number, activeDays: number, minutes: number) {
  if (challengeReady > 0) {
    return tamil
      ? `${challengeReady} திறன்கள் சவாலுக்கு தயாராக உள்ளன.`
      : `${challengeReady} skill${challengeReady === 1 ? '' : 's'} reached challenge-ready status.`
  }
  if (secure > 0) {
    return tamil
      ? `${secure} திறன்கள் உறுதியான நிலையை அடைந்துள்ளன.`
      : `${secure} skill${secure === 1 ? '' : 's'} reached secure status.`
  }
  if (activeDays >= 3) {
    return tamil
      ? `${activeDays} நாட்களில் கற்றல் செயல்பாடு பதிவாகியுள்ளது.`
      : `Learning activity was recorded on ${activeDays} days this week.`
  }
  if (minutes > 0) {
    return tamil
      ? `${minutes} நிமிட கற்றல் சான்று இந்த வாரம் பதிவாகியுள்ளது.`
      : `${minutes} minutes of learning evidence were recorded this week.`
  }
  return tamil
    ? 'அடுத்த மைல்கல்லைக் காட்ட இன்னும் உள்ளூர் கற்றல் சான்றுகள் தேவை.'
    : 'More local learning evidence is needed before showing a milestone.'
}

export default function FamilyBridgeDepth() {
  const tamil = storage.getPreferences().language === 'Tamil'
  const weekly = getWeeklyGoalProgress()
  const activity = getSevenDayActivity()
  const plan = getStudyPlanSummary()
  const mastery = getMasterySummary()
  const secure = mastery.find((item) => item.state === 'secure')?.count ?? 0
  const challengeReady = mastery.find((item) => item.state === 'challenge_ready')?.count ?? 0
  const recentMinutes = activity.reduce((sum, day) => sum + day.estimatedMinutes, 0)

  return (
    <>
      <FamilyBridge />
      <section className="border-t border-slate-200 bg-white" aria-labelledby="family-depth-heading">
        <div className="container py-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">
              {tamil ? 'Family Bridge ஆழமான சான்றுகள்' : 'Family Bridge evidence depth'}
            </p>
            <h2 id="family-depth-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {tamil ? 'இந்த சாதனத்தில் பதிவான கற்றல் சான்றுகள்' : 'Learning evidence recorded on this device'}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              {tamil
                ? 'இவை உள்ளூர் முன்னேற்றம், வினாடி வினா முயற்சிகள் மற்றும் கற்றல் அமர்வுகளிலிருந்து கணக்கிடப்படுகின்றன. தொலை கண்காணிப்பு அல்லது கிளவுட் குழந்தை சுயவிவரம் பயன்படுத்தப்படவில்லை.'
                : 'These summaries are derived from local progress, quiz attempts and learning sessions. No remote monitoring or cloud child profile is used.'}
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Deeper family evidence">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Clock3 className="h-5 w-5 text-blue-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-black text-slate-500">{tamil ? 'இந்த வார நேரம்' : 'Time this week'}</p>
              <p className="mt-1 text-2xl font-black">{weekly.estimatedMinutes}/{weekly.goals.weeklyMinutes} min</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <CalendarCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-black text-slate-500">{tamil ? 'செயலில் இருந்த நாட்கள்' : 'Active learning days'}</p>
              <p className="mt-1 text-2xl font-black">{weekly.activeDays}/7</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <ListChecks className="h-5 w-5 text-violet-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-black text-slate-500">{tamil ? '7 நாள் கற்றல் திட்டம்' : '7-day learning plan'}</p>
              <p className="mt-1 text-2xl font-black">{plan.totalActivities}</p>
              <p className="mt-1 text-sm text-slate-500">{plan.estimatedMinutes} min · {plan.subjects.length} {tamil ? 'பாடங்கள்' : 'subjects'}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Flag className="h-5 w-5 text-amber-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-black text-slate-500">{tamil ? 'தற்போதைய மைல்கல்' : 'Current milestone'}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{milestoneText(tamil, secure, challengeReady, weekly.activeDays, recentMinutes)}</p>
            </article>
          </div>

          <section className="mt-7 rounded-2xl border border-cyan-200 bg-cyan-50 p-6" aria-labelledby="family-plan-heading">
            <h3 id="family-plan-heading" className="text-xl font-black text-cyan-950">
              {tamil ? 'குடும்பத்திற்கான கற்றல் திட்ட சுருக்கம்' : 'Learning plan summary for the family'}
            </h3>
            <p className="mt-2 leading-7 text-cyan-900">
              {plan.totalActivities
                ? (tamil
                  ? `அடுத்த 7 நாட்களுக்கு ${plan.totalActivities} செயல்பாடுகள் உள்ளன; மதிப்பிடப்பட்ட மொத்த நேரம் ${plan.estimatedMinutes} நிமிடங்கள். ஆசிரியர் வழங்கிய assignment என இது காட்டப்படாது.`
                  : `The next 7 days contain ${plan.totalActivities} planned learning activities with about ${plan.estimatedMinutes} minutes of work. This is a local study plan, not a teacher-issued assignment.`)
                : (tamil
                  ? 'இப்போது திட்டமிட்ட கற்றல் செயல்பாடுகள் இல்லை.'
                  : 'There are no planned learning activities yet.')}
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
