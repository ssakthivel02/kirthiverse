import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

const bundle = read('src/utils/localDataBundle.ts')
const mistakes = read('src/utils/mistakeBank.ts')
const notes = read('src/utils/learningNotes.ts')
const settings = read('src/pages/Settings.tsx')
const quiz = read('src/pages/QuizPage.tsx')
const serviceWorker = read('public/sw.js')
const updateNotice = read('src/components/AppUpdateNotice.tsx')
const installHandler = serviceWorker.match(/self\.addEventListener\('install',[\s\S]*?\n\}\)/)?.[0] ?? ''

check(bundle.includes('mistakes: getMistakeRecords()'), 'Complete export must include mistake-review records')
check(bundle.includes('learningNotes: getLearningNotes()'), 'Complete export must include learning notes')
check(bundle.includes('clearMistakeBank()'), 'Complete reset must clear the mistake bank')
check(bundle.includes('clearLearningNotes()'), 'Complete reset must clear learning notes')
check(bundle.includes('slice(0, 200)'), 'Mistake import must have a finite record cap')
check(bundle.includes('slice(0, 100)'), 'Learning-note import must have a finite record cap')
check(mistakes.includes('const MAX_RECORDS = 200'), 'Mistake bank retention cap must be 200 records')
check(notes.includes('const MAX_NOTES = 100'), 'Learning-note retention cap must be 100 notes')
check(quiz.includes('recordQuizMistakes(lessonId, activeIndexes, answers)'), 'Quiz submission must update the mistake bank')
check(settings.includes('Export all local data'), 'Settings must expose complete local export')
check(settings.includes('Reset all local data'), 'Settings must expose complete local reset')
check(settings.includes('file.size > 1_000_000'), 'Import must retain the 1 MB file-size gate')
check(!/aadhaar|apaar|phone|address|medical/i.test(notes.split('export interface LearningNote')[1]?.split('const KEY')[0] ?? ''), 'Learning-note data model must not define sensitive personal-data fields')
check(serviceWorker.includes("event.data?.type === 'SKIP_WAITING'"), 'Service worker must support controlled updates')
check(installHandler.length > 0 && !installHandler.includes('skipWaiting'), 'Service worker install must not force an immediate update')
check(updateNotice.includes("registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })"), 'Update notice must activate the waiting service worker')
check(updateNotice.includes("removeEventListener('controllerchange'"), 'Update notice must clean up controller-change listener')

if (failures.length) {
  console.error('Data lifecycle validation failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('✓ Complete local export, import and reset coverage checked')
console.log('✓ Mistake-review and learning-note retention caps checked')
console.log('✓ Quiz-to-review persistence checked')
console.log('✓ Controlled PWA update lifecycle checked')
