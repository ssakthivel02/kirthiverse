import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

const pages = [
  'src/pages/MistakeReview.tsx',
  'src/pages/StudyPlanner.tsx',
  'src/pages/ActivityTimeline.tsx',
  'src/pages/LearningNotes.tsx',
]

for (const file of pages) {
  const content = read(file)
  check(content.includes('<main'), `${file} must contain a main landmark`)
  check(content.includes('<h1'), `${file} must contain a primary heading`)
  check(!/<button(?![^>]*type=)/.test(content), `${file} contains a button without an explicit type`)
  check(!/target="_blank"(?![^>]*rel="[^"]*noopener)/.test(content), `${file} has an unsafe blank-target link`)
}

const mistakeReview = read('src/pages/MistakeReview.tsx')
const learningNotes = read('src/pages/LearningNotes.tsx')
const activity = read('src/pages/ActivityTimeline.tsx')
const updateNotice = read('src/components/AppUpdateNotice.tsx')
const app = read('src/app/App.tsx')
const routeEffects = read('src/components/RouteEffects.tsx')

check(mistakeReview.includes('role="status"') && mistakeReview.includes('aria-live="polite"'), 'Mistake Review must expose status changes to assistive technology')
check(learningNotes.includes('role="status"') && learningNotes.includes('aria-live="polite"'), 'Learning Notes must expose status changes to assistive technology')
check(activity.includes('aria-label="Activity filters"'), 'Activity filter region needs an accessible label')
check(updateNotice.includes('role="status"') && updateNotice.includes('aria-live="polite"'), 'PWA update notice must be announced')
check(updateNotice.includes('aria-label="Dismiss update notice"'), 'PWA update notice needs an accessible dismiss label')
check(app.includes('<div id="main-content"'), 'Application must preserve the skip-link focus target')
check(!app.includes('<main id="main-content"'), 'Application shell must not nest main landmarks')
for (const route of ['/mistake-review', '/study-planner', '/activity', '/learning-notes']) {
  check(routeEffects.includes(route.replace('/', '\\/')), `Route title is missing for ${route}`)
}

for (const file of ['public/parent-guide.html', 'public/acceptable-use.html', 'public/device-storage.html']) {
  const content = read(file)
  check(/<html lang="en">/.test(content), `${file} must declare language`)
  check(/<meta name="viewport"/.test(content), `${file} must contain responsive viewport metadata`)
  check(/<title>[^<]+<\/title>/.test(content), `${file} must contain a title`)
  check(/<main/.test(content), `${file} must contain a main landmark`)
  check(/<h1/.test(content), `${file} must contain a primary heading`)
}

if (failures.length) {
  console.error('Accessibility validation failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`✓ ${pages.length} new interactive pages passed semantic checks`)
console.log('✓ Status announcements and update-notice controls checked')
console.log('✓ Skip-link and route-title behaviour checked')
console.log('✓ New public guidance pages passed document-structure checks')
