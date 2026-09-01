import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

const routes = [
  ['/practice', 'src/pages/PracticeHub.tsx', 'Practice Hub'],
  ['/mistake-review', 'src/pages/MistakeReview.tsx', 'Mistake Review'],
  ['/study-planner', 'src/pages/StudyPlanner.tsx', 'Study Planner'],
  ['/activity', 'src/pages/ActivityTimeline.tsx', 'Learning Activity'],
  ['/learning-notes', 'src/pages/LearningNotes.tsx', 'Learning Notes'],
  ['/bookmarks', 'src/pages/Bookmarks.tsx', 'Saved Lessons'],
  ['/progress-report', 'src/pages/ProgressReport.tsx', 'Progress Report'],
  ['/teacher-resources', 'src/pages/TeacherResources.tsx', 'Teacher'],
  ['/family-goals', 'src/pages/FamilyGoals.tsx', 'Family'],
  ['/weekly-review', 'src/pages/WeeklyReview.tsx', 'weekly'],
  ['/wellbeing', 'src/pages/Wellbeing.tsx', 'Wellbeing'],
  ['/help', 'src/pages/HelpCentre.tsx', 'Help'],
  ['/platform-health', 'src/pages/PlatformHealth.tsx', 'Platform Health'],
]

const app = read('src/app/App.tsx')
const header = read('src/components/Header.tsx')
const footer = read('src/components/Footer.tsx')
const routeEffects = read('src/components/RouteEffects.tsx')
const normalisedRouteEffects = routeEffects.replaceAll('\\/', '/')
const robots = read('public/robots.txt')
const sitemap = read('public/sitemap.xml')

for (const [route, file, title] of routes) {
  assert(exists(file), `Missing experience page: ${file}`)
  assert(app.includes(`path="${route}"`), `Route not registered in App: ${route}`)
  assert(normalisedRouteEffects.includes(route), `Accessible page title not registered: ${route}`)
  if (exists(file)) {
    const content = read(file)
    assert(content.includes('<main'), `${file} must use a main landmark`)
    assert(content.includes('<h1'), `${file} must contain one primary heading`)
    assert(content.toLowerCase().includes(title.toLowerCase()), `${file} appears to be missing its expected experience label`)
  }
}

assert(!app.includes('<main id="main-content"'), 'Application shell must not create a nested main landmark around page-level main elements')
assert(app.includes('<div id="main-content"'), 'Application shell must preserve a focusable main-content target')
assert(app.includes('<AppUpdateNotice />'), 'Application shell must expose controlled PWA update notice')
assert(header.includes("href: '/practice'"), 'Practice Hub must be present in primary navigation')
for (const route of ['/mistake-review', '/study-planner', '/activity', '/learning-notes', '/bookmarks', '/progress-report', '/teacher-resources', '/family-goals', '/weekly-review', '/wellbeing', '/help']) {
  assert(header.includes(`href: '${route}'`), `Header utility navigation is missing ${route}`)
}

for (const route of ['/practice', '/mistake-review', '/study-planner', '/activity', '/learning-notes', '/bookmarks', '/progress-report', '/teacher-resources', '/family-goals', '/weekly-review', '/wellbeing', '/help', '/platform-health']) {
  assert(footer.includes(`href="${route}"`), `Footer is missing ${route}`)
}

for (const privateRoute of ['/today', '/practice', '/mistake-review', '/study-planner', '/activity', '/learning-notes', '/bookmarks', '/progress-report', '/weekly-review', '/family-goals', '/wellbeing', '/platform-health', '/dashboard', '/parent-dashboard', '/teacher-dashboard', '/profile', '/settings', '/onboarding', '/achievements']) {
  assert(robots.includes(`Disallow: ${privateRoute}`), `robots.txt must protect personalised route ${privateRoute}`)
}

assert(sitemap.includes('/teacher-resources'), 'Public teacher resource route must be in sitemap')
assert(sitemap.includes('/help'), 'Public help route must be in sitemap')
for (const page of ['/parent-guide.html', '/acceptable-use.html', '/device-storage.html', '/child-privacy.html', '/accessibility.html']) {
  assert(sitemap.includes(page), `Public guidance page must be in sitemap: ${page}`)
}
for (const route of ['/mistake-review', '/study-planner', '/activity', '/learning-notes', '/progress-report', '/weekly-review', '/family-goals']) {
  assert(!sitemap.includes(`<loc>https://kirthiverse.omsaravanabhava.org${route}</loc>`), `Personal route must not be in sitemap: ${route}`)
}

const sensitivePages = [
  'src/pages/PracticeHub.tsx',
  'src/pages/MistakeReview.tsx',
  'src/pages/StudyPlanner.tsx',
  'src/pages/ActivityTimeline.tsx',
  'src/pages/LearningNotes.tsx',
  'src/pages/ProgressReport.tsx',
  'src/pages/TeacherResources.tsx',
  'src/pages/FamilyGoals.tsx',
  'src/pages/WeeklyReview.tsx',
  'src/pages/Wellbeing.tsx',
  'src/pages/PlatformHealth.tsx',
]
for (const file of sensitivePages) {
  const content = read(file).toLowerCase()
  assert(content.includes('local') || content.includes('device') || content.includes('browser'), `${file} must clearly state its local-data boundary`)
}

const progressReport = read('src/pages/ProgressReport.tsx').toLowerCase()
assert(/not (?:a )?formal school assessment/.test(progressReport), 'Progress report needs a non-formal-assessment disclaimer')
const weeklyReview = read('src/pages/WeeklyReview.tsx').toLowerCase()
assert(/not (?:a )?formal school assessment/.test(weeklyReview), 'Weekly review needs a non-formal-assessment disclaimer')
const teacherResources = read('src/pages/TeacherResources.tsx').toLowerCase()
assert(teacherResources.includes('does not create teacher accounts'), 'Teacher resources needs an honest account/roster boundary')
const wellbeing = read('src/pages/Wellbeing.tsx').toLowerCase()
assert(wellbeing.includes('stop without penalty'), 'Wellbeing page must state that rest is not penalised')
const studyPlanner = read('src/pages/StudyPlanner.tsx').toLowerCase()
assert(studyPlanner.includes('missing a planned activity does not remove xp'), 'Study Planner must not punish missed plans')
const learningNotes = read('src/pages/LearningNotes.tsx').toLowerCase()
assert(learningNotes.includes('do not enter passwords'), 'Learning Notes must warn against sensitive information')

const newSource = routes.map(([, file]) => read(file)).join('\n')
assert(!/20,?000\+|millions of learners|trusted by thousands|real-time ai/i.test(newSource), 'Unsupported scale or AI marketing claim detected in new experience pages')
assert(!/target="_blank"(?![^>]*rel="[^"]*noopener)/i.test(newSource), 'External blank-target link must use rel="noopener"')

if (failures.length) {
  console.error('Experience validation failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`✓ ${routes.length} premium routes registered with pages and accessible titles`)
console.log('✓ Primary, mobile and footer navigation checked')
console.log('✓ Personalised routes excluded from indexing')
console.log('✓ Public support and trust discovery checked')
console.log('✓ Local-data, assessment, wellbeing and school-account boundaries checked')
console.log('✓ Unsupported scale and AI claims not present in new pages')
