import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, Flame } from 'lucide-react'
import { storage } from '../utils/storage'

interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  xp: number
  streak: number
  lessons: number
}

export default function Leaderboards() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const data = storage.getAllData()
    const stats = storage.getStats()
    setLeaderboard([
      { rank: 1, name: data.profile.name, avatar: data.profile.avatar, xp: stats.totalXP, streak: stats.currentStreak, lessons: stats.completedLessons },
    ])
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <Trophy className="h-10 w-10 text-yellow-500" aria-hidden="true" />
            <h1 className="text-4xl font-bold">Local Progress Board</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Your private learning progress on this device. This is not a public child leaderboard.</p>
        </header>

        <section aria-labelledby="progress-table-heading" className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-lg dark:border-blue-800 dark:bg-slate-800">
          <h2 id="progress-table-heading" className="sr-only">Current learner progress</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem]">
              <caption className="sr-only">XP, streak and completed lessons saved for the current local learner</caption>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-700">
                  <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-gray-300">Position</th>
                  <th scope="col" className="px-6 py-4 text-left font-semibold text-gray-600 dark:text-gray-300">Learner</th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-600 dark:text-gray-300">XP</th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-600 dark:text-gray-300">Streak</th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold text-gray-600 dark:text-gray-300">Lessons</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-b border-gray-200 bg-blue-50 dark:border-slate-700 dark:bg-blue-900/20">
                    <td className="px-6 py-4"><span className="text-2xl" aria-label="Current learner">🏆</span></td>
                    <th scope="row" className="px-6 py-4 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">{entry.avatar}</span>
                        <div><span className="font-semibold text-gray-900 dark:text-white">{entry.name}</span><p className="text-xs font-normal text-gray-500 dark:text-gray-400">This device</p></div>
                      </div>
                    </th>
                    <td className="px-6 py-4 text-right"><span className="inline-flex items-center justify-end gap-2 font-bold text-purple-600 dark:text-purple-400"><span className="text-lg">{entry.xp}</span><TrendingUp className="h-4 w-4" aria-hidden="true" /></span></td>
                    <td className="px-6 py-4 text-right"><span className="inline-flex items-center justify-end gap-2 font-bold text-orange-600 dark:text-orange-400"><span className="text-lg">{entry.streak}</span><Flame className="h-4 w-4" aria-hidden="true" /></span></td>
                    <td className="px-6 py-4 text-right"><span className="text-lg font-bold text-blue-600 dark:text-blue-400">{entry.lessons}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-800 dark:bg-blue-900/20" aria-labelledby="progress-board-about">
          <h2 id="progress-board-about" className="mb-4 text-xl font-bold text-blue-900 dark:text-blue-200">About this progress board</h2>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300">
            <li>✓ Shows only the current learner record saved in this browser.</li>
            <li>✓ Does not publish, rank or compare children.</li>
            <li>✓ Complete lessons and quizzes to build XP and a learning streak.</li>
            <li>✓ Export local data before clearing the browser or moving devices.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
