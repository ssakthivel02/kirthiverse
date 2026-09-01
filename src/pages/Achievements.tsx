import { Award, BookOpen, Flame, Lock, Sparkles, Star, Target, Trophy } from 'lucide-react'
import { storage } from '../utils/storage'

const achievementDefinitions = [
  { id: 'first-lesson', title: 'First Mission', description: 'Complete your first lesson.', icon: BookOpen, target: 1, metric: 'lessons' as const },
  { id: 'five-lessons', title: 'World Explorer', description: 'Complete five lessons.', icon: Sparkles, target: 5, metric: 'lessons' as const },
  { id: 'ten-lessons', title: 'Mission Specialist', description: 'Complete ten lessons.', icon: Star, target: 10, metric: 'lessons' as const },
  { id: 'first-quiz', title: 'Quiz Starter', description: 'Complete your first quiz attempt.', icon: Target, target: 1, metric: 'attempts' as const },
  { id: 'five-quizzes', title: 'Practice Pilot', description: 'Complete five quiz attempts.', icon: Trophy, target: 5, metric: 'attempts' as const },
  { id: 'high-score', title: 'Accuracy Ace', description: 'Reach an average quiz score of 80%.', icon: Award, target: 80, metric: 'score' as const },
  { id: 'three-day-streak', title: 'Momentum Builder', description: 'Build a three-day learning streak.', icon: Flame, target: 3, metric: 'streak' as const },
  { id: 'xp-500', title: 'Level Up', description: 'Earn 500 XP.', icon: Star, target: 500, metric: 'xp' as const },
]

export default function Achievements() {
  const stats = storage.getStats()
  const metricValue = (metric: typeof achievementDefinitions[number]['metric']) => ({ lessons: stats.completedLessons, attempts: stats.totalAttempts, score: stats.averageScore, streak: stats.currentStreak, xp: stats.totalXP })[metric]
  const earnedCount = achievementDefinitions.filter((item) => metricValue(item.metric) >= item.target).length

  return (
    <main className="min-h-screen bg-[#071124] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,_rgba(168,85,247,0.28),_transparent_30%),linear-gradient(135deg,#071124,#17113f)]">
        <div className="container py-16">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300">Achievement journey</p>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] sm:text-6xl">Celebrate real progress.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">Badges unlock only when learning activity on this device meets the requirement. No purchased rewards and no fake global rankings.</p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4"><Trophy className="h-6 w-6 text-amber-300" /><span className="font-black">{earnedCount} of {achievementDefinitions.length} earned</span></div>
        </div>
      </section>

      <section className="bg-slate-50 py-12 text-slate-950">
        <div className="container grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {achievementDefinitions.map((achievement) => {
            const value = metricValue(achievement.metric)
            const earned = value >= achievement.target
            const progress = Math.min(100, Math.round((value / achievement.target) * 100))
            const Icon = achievement.icon
            return (
              <article key={achievement.id} className={`rounded-[1.75rem] border p-6 shadow-sm ${earned ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${earned ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}><Icon className="h-7 w-7" /></div>
                  {earned ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Earned</span> : <Lock className="h-5 w-5 text-slate-400" />}
                </div>
                <h2 className="mt-6 text-2xl font-black">{achievement.title}</h2>
                <p className="mt-2 min-h-12 leading-6 text-slate-600">{achievement.description}</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${earned ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-slate-400'}`} style={{ width: `${progress}%` }} /></div>
                <div className="mt-3 flex justify-between text-sm font-bold text-slate-500"><span>{Math.min(value, achievement.target)} / {achievement.target}</span><span>{progress}%</span></div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
