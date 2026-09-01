export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'lessons' | 'quizzes' | 'xp' | 'streak' | 'bookmarks';
}

export const achievements: Achievement[] = [
  {
    id: 'first-lesson',
    name: 'First Step',
    description: 'Complete your first lesson',
    icon: '🚀',
    requirement: 1,
    type: 'lessons',
  },
  {
    id: 'lesson-master',
    name: 'Lesson Master',
    description: 'Complete 10 lessons',
    icon: '📚',
    requirement: 10,
    type: 'lessons',
  },
  {
    id: 'quiz-champion',
    name: 'Quiz Champion',
    description: 'Score 100% on 5 quizzes',
    icon: '🏆',
    requirement: 5,
    type: 'quizzes',
  },
  {
    id: 'xp-collector',
    name: 'XP Collector',
    description: 'Earn 500 XP',
    icon: '⚡',
    requirement: 500,
    type: 'xp',
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: 7,
    type: 'streak',
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Bookmark 10 lessons',
    icon: '🔖',
    requirement: 10,
    type: 'bookmarks',
  },
];

export function checkAchievements(stats: any): string[] {
  const unlockedIds: string[] = [];

  achievements.forEach(achievement => {
    switch (achievement.type) {
      case 'lessons':
        if (stats.completedLessons >= achievement.requirement) {
          unlockedIds.push(achievement.id);
        }
        break;
      case 'xp':
        if (stats.totalXP >= achievement.requirement) {
          unlockedIds.push(achievement.id);
        }
        break;
      case 'streak':
        if (stats.currentStreak >= achievement.requirement) {
          unlockedIds.push(achievement.id);
        }
        break;
      case 'bookmarks':
        if (stats.bookmarks >= achievement.requirement) {
          unlockedIds.push(achievement.id);
        }
        break;
    }
  });

  return unlockedIds;
}

export function getNextAchievement(stats: any): Achievement | null {
  const unlocked = checkAchievements(stats);
  
  for (const achievement of achievements) {
    if (!unlocked.includes(achievement.id)) {
      return achievement;
    }
  }

  return null;
}

export function getProgressToNextAchievement(stats: any): { current: number; required: number; percentage: number } {
  const next = getNextAchievement(stats);
  if (!next) {
    return { current: 0, required: 0, percentage: 100 };
  }

  let current = 0;
  switch (next.type) {
    case 'lessons':
      current = stats.completedLessons;
      break;
    case 'xp':
      current = stats.totalXP;
      break;
    case 'streak':
      current = stats.currentStreak;
      break;
    case 'bookmarks':
      current = stats.bookmarks;
      break;
  }

  const percentage = Math.min(100, Math.round((current / next.requirement) * 100));
  return { current, required: next.requirement, percentage };
}
