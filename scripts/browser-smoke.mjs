import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath, pathToFileURL } from 'url'
import ts from 'typescript'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const outputDir = path.join(root, 'artifacts', 'browser-smoke')
const reportPath = path.join(outputDir, 'report.json')
const markdownPath = path.join(outputDir, 'summary.md')
const baseHost = '127.0.0.1'
const serverPort = 4179
const debugPort = 9339
const baseUrl = `http://${baseHost}:${serverPort}`

const routes = [
  '/', '/onboarding', '/today', '/practice', '/mistake-review', '/study-planner', '/activity',
  '/learning-notes', '/bookmarks', '/progress-report', '/weekly-review', '/family-goals',
  '/wellbeing', '/help', '/platform-health', '/search', '/profile', '/settings', '/dashboard',
  '/parent-dashboard', '/teacher-dashboard', '/teacher-resources', '/achievements', '/leaderboards',
  '/ai-tutor', '/learning-worlds', '/subject/mathematics', '/lesson/math-001', '/quiz/math-001',
]

const viewports = [
  { name: 'mobile-320', width: 320, height: 720 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
]

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function ensure(condition, message, failures) {
  if (!condition) failures.push(message)
}

async function loadTypeScriptModule(relativePath) {
  const sourcePath = path.join(root, relativePath)
  const source = fs.readFileSync(sourcePath, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: sourcePath,
  }).outputText
  const temporaryPath = path.join(os.tmpdir(), `kirthiverse-browser-${path.basename(relativePath, '.ts')}-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
  fs.writeFileSync(temporaryPath, output, 'utf8')
  try {
    return await import(`${pathToFileURL(temporaryPath).href}?v=${Date.now()}`)
  } finally {
    fs.rmSync(temporaryPath, { force: true })
  }
}

async function selectJourneyQuestion() {
  const { quizzes } = await loadTypeScriptModule('src/content/quizzes.ts')
  const byLesson = new Map()
  for (const question of quizzes) byLesson.set(question.lessonId, [...(byLesson.get(question.lessonId) ?? []), question])
  const question = quizzes.find((item) => item.type === 'mcq' && byLesson.get(item.lessonId)?.length === 1 && Array.isArray(item.options) && item.options.length >= 2)
  if (!question) throw new Error('Browser journey requires one lesson containing exactly one MCQ question')
  const correctIndex = typeof question.correctAnswer === 'number'
    ? question.correctAnswer
    : question.options.findIndex((option) => option.trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase())
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= question.options.length) throw new Error(`Journey question ${question.id} has an invalid correct answer`)
  const wrongIndex = question.options.findIndex((_, index) => index !== correctIndex)
  return { ...question, correctIndex, wrongIndex }
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const normal = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  return path.join(dist, normal === '/' ? 'index.html' : normal.replace(/^[/\\]/, ''))
}

function startServer() {
  if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('dist/index.html is missing; run the production build first')
  const server = http.createServer((request, response) => {
    const pathname = request.url ?? '/'
    let target = safePath(pathname)
    if (!target.startsWith(dist)) {
      response.writeHead(403).end('Forbidden')
      return
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      const hasExtension = path.extname(pathname.split('?')[0]) !== ''
      if (hasExtension) {
        response.writeHead(404).end('Not found')
        return
      }
      target = path.join(dist, 'index.html')
    }
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', mime[path.extname(target)] ?? 'application/octet-stream')
    fs.createReadStream(target).pipe(response)
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(serverPort, baseHost, () => resolve(server))
  })
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.GOOGLE_CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  return candidates.find((candidate) => fs.existsSync(candidate))
}

async function pollJson(url, timeoutMs = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {}
    await wait(150)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

class CdpClient {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Set()
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true })
      this.ws.addEventListener('error', reject, { once: true })
    })
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) pending.reject(new Error(message.error.message))
        else pending.resolve(message.result ?? {})
        return
      }
      for (const listener of this.listeners) listener(message)
    })
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++
    const payload = { id, method, params }
    if (sessionId) payload.sessionId = sessionId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(payload))
    })
  }

  waitFor(method, sessionId, timeoutMs = 15_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener)
        reject(new Error(`Timed out waiting for ${method}`))
      }, timeoutMs)
      const listener = (message) => {
        if (message.method !== method || (sessionId && message.sessionId !== sessionId)) return
        clearTimeout(timer)
        this.listeners.delete(listener)
        resolve(message.params ?? {})
      }
      this.listeners.add(listener)
    })
  }

  close() {
    this.ws.close()
  }
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description
      ?? result.exceptionDetails.exception?.value
      ?? result.exceptionDetails.text
      ?? 'Runtime evaluation failed'
    throw new Error(String(description))
  }
  return result.result?.value
}

async function navigate(client, sessionId, url, { allowNetworkError = false } = {}) {
  const loaded = client.waitFor('Page.loadEventFired', sessionId, 8_000).catch(() => null)
  const result = await client.send('Page.navigate', { url }, sessionId)
  if (result.errorText && !allowNetworkError) throw new Error(result.errorText)
  await Promise.race([loaded, wait(2_000)])
  await wait(260)
}

async function waitForPath(client, sessionId, expectedPrefix, timeoutMs = 5_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const current = await evaluate(client, sessionId, 'location.pathname')
    if (current.startsWith(expectedPrefix)) return current
    await wait(80)
  }
  return evaluate(client, sessionId, 'location.pathname')
}

async function clickByText(client, sessionId, pattern, selector = 'button') {
  const clicked = await evaluate(client, sessionId, `(() => {
    const matcher = new RegExp(${JSON.stringify(pattern)}, 'i')
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
    }
    const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => visible(item) && matcher.test((item.textContent || '').trim()))
    if (!element) return false
    element.click()
    return true
  })()`)
  await wait(180)
  return clicked
}

async function selectPressedOption(client, sessionId, index) {
  const selected = await evaluate(client, sessionId, `(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
    }
    const options = [...document.querySelectorAll('button[aria-pressed]')].filter(visible)
    const option = options[${index}]
    if (!option) return { selected: false, count: options.length }
    option.click()
    return { selected: true, count: options.length, text: (option.textContent || '').trim() }
  })()`)
  await wait(150)
  return selected
}

async function captureScreenshot(client, sessionId, fileName) {
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
  fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(screenshot.data, 'base64'))
}

async function createSession(client, viewport) {
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true })
  await client.send('Page.enable', {}, sessionId)
  await client.send('Runtime.enable', {}, sessionId)
  await client.send('Log.enable', {}, sessionId)
  await client.send('Network.enable', {}, sessionId)
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 768,
  }, sessionId)
  await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId)
  return { targetId, sessionId }
}

function routeAssertions(metrics, route, viewport, failures) {
  ensure(metrics.title?.includes('ArivuKids'), `${viewport.name} ${route}: missing ArivuKids page title`, failures)
  ensure(metrics.h1Count === 1, `${viewport.name} ${route}: expected one h1, found ${metrics.h1Count}`, failures)
  ensure(metrics.mainCount === 1, `${viewport.name} ${route}: expected one main landmark, found ${metrics.mainCount}`, failures)
  ensure(metrics.visibleTextLength > 120, `${viewport.name} ${route}: page has insufficient visible content`, failures)
  ensure(!metrics.horizontalOverflow, `${viewport.name} ${route}: horizontal viewport overflow detected`, failures)
  ensure(metrics.duplicateIds.length === 0, `${viewport.name} ${route}: duplicate ids: ${metrics.duplicateIds.join(', ')}`, failures)
  ensure(metrics.unnamedButtons === 0, `${viewport.name} ${route}: ${metrics.unnamedButtons} buttons have no accessible name`, failures)
  ensure(metrics.unnamedLinks === 0, `${viewport.name} ${route}: ${metrics.unnamedLinks} links have no accessible name`, failures)
  ensure(metrics.unlabelledControls === 0, `${viewport.name} ${route}: ${metrics.unlabelledControls} visible form controls have no label`, failures)
  ensure(metrics.imagesWithoutAlt === 0, `${viewport.name} ${route}: ${metrics.imagesWithoutAlt} visible images are missing alt text`, failures)
  ensure(metrics.invalidAriaReferences.length === 0, `${viewport.name} ${route}: invalid ARIA references: ${metrics.invalidAriaReferences.join(', ')}`, failures)
  ensure(metrics.positiveTabIndex === 0, `${viewport.name} ${route}: ${metrics.positiveTabIndex} elements use a positive tabindex`, failures)
  ensure(metrics.tinyButtons === 0, `${viewport.name} ${route}: ${metrics.tinyButtons} visible buttons are smaller than 24×24 CSS pixels`, failures)
  ensure(metrics.emptyHeadings === 0, `${viewport.name} ${route}: ${metrics.emptyHeadings} headings have no text`, failures)
  ensure(metrics.skipLinkExists, `${viewport.name} ${route}: skip-to-content link is missing`, failures)
  ensure(metrics.mainTargetExists, `${viewport.name} ${route}: main-content focus target is missing`, failures)
  ensure(metrics.consoleErrors.length === 0, `${viewport.name} ${route}: console errors: ${metrics.consoleErrors.join(' | ')}`, failures)
  ensure(metrics.runtimeErrors.length === 0, `${viewport.name} ${route}: runtime errors: ${metrics.runtimeErrors.join(' | ')}`, failures)
}

async function routeMetrics(client, sessionId) {
  return evaluate(client, sessionId, `(() => {
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
    }
    const accessibleName = (element) => (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent || '').trim()
    const controlLabelled = (element) => {
      if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.getAttribute('title')) return true
      if (element.labels?.length) return true
      const id = element.getAttribute('id')
      return Boolean(id && document.querySelector('label[for="' + CSS.escape(id) + '"]'))
    }
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean)
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
    const ariaReferences = [...document.querySelectorAll('[aria-controls], [aria-describedby], [aria-labelledby]')].flatMap((element) =>
      ['aria-controls', 'aria-describedby', 'aria-labelledby'].flatMap((attribute) =>
        (element.getAttribute(attribute) || '').trim().split(' ').filter(Boolean).filter((id) => !document.getElementById(id)).map((id) => attribute + ':' + id)
      )
    )
    const formControls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')].filter(visible)
    const buttons = [...document.querySelectorAll('button')].filter(visible)
    return {
      title: document.title,
      h1Count: document.querySelectorAll('h1').length,
      h1Text: [...document.querySelectorAll('h1')].map((node) => node.textContent.trim()).slice(0, 2),
      mainCount: document.querySelectorAll('main').length,
      visibleTextLength: document.body.innerText.trim().length,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      duplicateIds: duplicates,
      unnamedButtons: buttons.filter((node) => !accessibleName(node)).length,
      unnamedLinks: [...document.querySelectorAll('a[href]')].filter((node) => visible(node) && !accessibleName(node) && !node.querySelector('img[alt]')).length,
      unlabelledControls: formControls.filter((node) => !controlLabelled(node)).length,
      imagesWithoutAlt: [...document.querySelectorAll('img')].filter((node) => visible(node) && !node.hasAttribute('alt')).length,
      invalidAriaReferences: [...new Set(ariaReferences)],
      positiveTabIndex: [...document.querySelectorAll('[tabindex]')].filter((node) => visible(node) && Number(node.getAttribute('tabindex')) > 0).length,
      tinyButtons: buttons.filter((node) => { const rect = node.getBoundingClientRect(); return rect.width < 24 || rect.height < 24 }).length,
      emptyHeadings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((node) => visible(node) && !(node.textContent || '').trim()).length,
      skipLinkExists: Boolean(document.querySelector('a[href="#main-content"]')),
      mainTargetExists: Boolean(document.getElementById('main-content')),
      mobileMenuTriggerVisible: buttons.some((button) => /open menu|close menu/i.test(button.getAttribute('aria-label') || '')),
      consoleErrors: [],
      runtimeErrors: [],
    }
  })()`)
}

async function runRouteMatrix(client, failures, checks) {
  for (const viewport of viewports) {
    const { targetId, sessionId } = await createSession(client, viewport)
    const consoleErrors = []
    const runtimeErrors = []
    const listener = (message) => {
      if (message.sessionId !== sessionId) return
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        consoleErrors.push(message.params.args?.map((arg) => arg.value ?? arg.description ?? '').join(' ') ?? 'console error')
      }
      if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails?.text ?? 'uncaught exception')
      if (message.method === 'Log.entryAdded' && message.params.entry?.level === 'error') consoleErrors.push(message.params.entry.text)
    }
    client.listeners.add(listener)

    for (const route of routes) {
      consoleErrors.length = 0
      runtimeErrors.length = 0
      const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' })
      ensure(response.status === 200, `${viewport.name} ${route}: server returned ${response.status}`, failures)
      await navigate(client, sessionId, `${baseUrl}${route}`)
      const metrics = await routeMetrics(client, sessionId)
      metrics.consoleErrors = [...consoleErrors]
      metrics.runtimeErrors = [...runtimeErrors]
      routeAssertions(metrics, route, viewport, failures)
      if (viewport.width < 1024) ensure(metrics.mobileMenuTriggerVisible, `${viewport.name} ${route}: mobile navigation trigger is not visible`, failures)
      checks.push({ viewport: viewport.name, route, status: response.status, ...metrics })

      if (['/', '/learning-worlds', '/today', '/parent-dashboard'].includes(route)) {
        await captureScreenshot(client, sessionId, `${viewport.name}-${route === '/' ? 'home' : route.slice(1)}.png`)
      }
    }

    if (viewport.width < 1024) {
      await navigate(client, sessionId, `${baseUrl}/`)
      const triggerFound = await evaluate(client, sessionId, `(() => {
        const button = [...document.querySelectorAll('button')].find((item) => /open menu/i.test(item.getAttribute('aria-label') || ''))
        if (!button) return false
        button.click()
        return true
      })()`)
      await wait(180)
      const opened = triggerFound && await evaluate(client, sessionId, `Boolean(document.getElementById('mobile-navigation'))`)
      ensure(opened, `${viewport.name}: mobile menu did not open`, failures)
      const closeButton = await evaluate(client, sessionId, `[...document.querySelectorAll('button')].some((item) => /close menu/i.test(item.getAttribute('aria-label') || ''))`)
      ensure(closeButton, `${viewport.name}: mobile menu has no accessible close control`, failures)
    }

    client.listeners.delete(listener)
    await client.send('Target.closeTarget', { targetId })
  }
}

async function compactBodyText(client, sessionId) {
  return evaluate(client, sessionId, `document.body.innerText.split(String.fromCharCode(10)).map((line) => line.trim()).filter(Boolean).join(' ')`)
}

async function runLearnerRecoveryJourney(client, failures, checks, journeyQuestion) {
  const { targetId, sessionId } = await createSession(client, { name: 'journey-mobile', width: 390, height: 844 })
  await navigate(client, sessionId, `${baseUrl}/`)
  await evaluate(client, sessionId, `(() => {
    localStorage.clear()
    localStorage.setItem('kvs_profile', JSON.stringify({ name: 'Browser QA Learner', grade: '5', avatar: '🚀', joinDate: Date.now() }))
    localStorage.setItem('kvs_preferences', JSON.stringify({ ageBand: '9-11', language: 'English', learningLevel: 'Explorer', dailyGoal: 2, favouriteSubjects: [${JSON.stringify(journeyQuestion.subject)}], reducedMotion: true, largerText: false }))
    return true
  })()`)

  await navigate(client, sessionId, `${baseUrl}/today`)
  const personalised = (await compactBodyText(client, sessionId)).includes('Browser QA Learner')
  ensure(personalised, 'Journey: Today page did not read the saved learner profile', failures)

  await navigate(client, sessionId, `${baseUrl}/learning-worlds`)
  const worldButtonFound = await clickByText(client, sessionId, 'enter world')
  const subjectPath = await waitForPath(client, sessionId, '/subject/')
  ensure(worldButtonFound && subjectPath.startsWith('/subject/'), 'Journey: Learning Worlds did not enter a subject', failures)
  const lessonButtonFound = await clickByText(client, sessionId, 'start lesson|review lesson')
  const lessonPath = await waitForPath(client, sessionId, '/lesson/')
  ensure(lessonButtonFound && lessonPath.startsWith('/lesson/'), 'Journey: Subject page did not open a lesson', failures)
  ensure(Boolean(await evaluate(client, sessionId, `document.querySelector('h1')?.textContent?.trim() || ''`)), 'Journey: Lesson page did not render a title', failures)

  await navigate(client, sessionId, `${baseUrl}/lesson/${journeyQuestion.lessonId}`)
  const completed = await clickByText(client, sessionId, '^mark lesson complete$')
  const completionState = await evaluate(client, sessionId, `(() => ({
    buttonComplete: [...document.querySelectorAll('button')].some((button) => /lesson completed/i.test(button.textContent || '')),
    progress: JSON.parse(localStorage.getItem('kvs_lessons_progress') || '{}')[${JSON.stringify(journeyQuestion.lessonId)}] || null,
    stats: JSON.parse(localStorage.getItem('kvs_stats') || '{}'),
  }))()`)
  ensure(completed && completionState.buttonComplete, 'Recovery journey: lesson could not be completed', failures)
  ensure(completionState.progress?.completed === true, 'Recovery journey: lesson completion was not persisted', failures)
  ensure(completionState.stats?.totalXP === 50, `Recovery journey: expected 50 lesson XP, found ${completionState.stats?.totalXP}`, failures)

  const openedQuiz = await clickByText(client, sessionId, 'take lesson quiz')
  const quizPath = await waitForPath(client, sessionId, `/quiz/${journeyQuestion.lessonId}`)
  ensure(openedQuiz && quizPath === `/quiz/${journeyQuestion.lessonId}`, 'Recovery journey: lesson did not open its quiz', failures)
  const wrongSelection = await selectPressedOption(client, sessionId, journeyQuestion.wrongIndex)
  ensure(wrongSelection.selected, `Recovery journey: incorrect option ${journeyQuestion.wrongIndex + 1} was not selectable`, failures)
  const submittedWrong = await clickByText(client, sessionId, 'submit quiz')
  await wait(250)
  const wrongResult = await evaluate(client, sessionId, `(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    attempts: JSON.parse(localStorage.getItem('kvs_quiz_attempts') || '[]'),
    mistakes: JSON.parse(localStorage.getItem('kvs_mistake_bank') || '[]'),
    stats: JSON.parse(localStorage.getItem('kvs_stats') || '{}'),
  }))()`)
  ensure(submittedWrong && wrongResult.h1 === '0%', `Recovery journey: expected an intentional 0% result, found ${wrongResult.h1}`, failures)
  ensure(wrongResult.attempts.length === 1 && wrongResult.attempts[0]?.percentage === 0, 'Recovery journey: incorrect quiz attempt was not persisted', failures)
  ensure(wrongResult.mistakes.length === 1 && wrongResult.mistakes[0]?.resolved === false, 'Recovery journey: incorrect answer did not enter Mistake Review', failures)
  ensure(wrongResult.mistakes[0]?.questionId === journeyQuestion.id, 'Recovery journey: stored mistake does not match the tested question', failures)
  ensure(wrongResult.stats?.totalXP === 50, 'Recovery journey: an incorrect quiz changed total XP unexpectedly', failures)
  ensure(wrongResult.stats?.awardedQuizIds?.filter((id) => id === journeyQuestion.lessonId).length === 1, 'Recovery journey: quiz reward key was not recorded exactly once', failures)
  await captureScreenshot(client, sessionId, 'journey-quiz-needs-review.png')

  const openedMistakes = await clickByText(client, sessionId, 'open mistake review')
  const mistakePath = await waitForPath(client, sessionId, '/mistake-review')
  ensure(openedMistakes && mistakePath === '/mistake-review', 'Recovery journey: result page did not open Mistake Review', failures)
  const openReviewText = await compactBodyText(client, sessionId)
  const retryButton = await evaluate(client, sessionId, `[...document.querySelectorAll('button')].some((button) => /retry quiz/i.test(button.textContent || ''))`)
  ensure(openReviewText.includes(journeyQuestion.question), 'Recovery journey: Mistake Review did not show the incorrect question', failures)
  ensure(openReviewText.includes('Open review 1'), 'Recovery journey: Mistake Review open count was not one', failures)
  ensure(openReviewText.includes(String(journeyQuestion.options[journeyQuestion.correctIndex])), 'Recovery journey: Mistake Review did not show the correct answer', failures)
  ensure(retryButton, 'Recovery journey: Mistake Review did not offer a quiz retry', failures)
  await captureScreenshot(client, sessionId, 'journey-mistake-review-open.png')

  await navigate(client, sessionId, `${baseUrl}/parent-dashboard`)
  const parentBeforeText = await compactBodyText(client, sessionId)
  const parentBeforeRetry = {
    openMistake: parentBeforeText.includes('1 open item'),
    completedLesson: parentBeforeText.includes('Lessons completed 1'),
    averageScore: parentBeforeText.includes('Average quiz score 0%'),
    totalXp: parentBeforeText.includes('Total XP 50'),
  }
  ensure(parentBeforeRetry.openMistake, 'Recovery journey: Parent View did not show one open mistake', failures)
  ensure(parentBeforeRetry.completedLesson, 'Recovery journey: Parent View did not show the completed lesson', failures)
  ensure(parentBeforeRetry.averageScore, 'Recovery journey: Parent View did not show the first quiz score', failures)
  ensure(parentBeforeRetry.totalXp, 'Recovery journey: Parent View did not show the expected XP', failures)
  await captureScreenshot(client, sessionId, 'journey-parent-before-recovery.png')

  await navigate(client, sessionId, `${baseUrl}/quiz/${journeyQuestion.lessonId}`)
  const correctSelection = await selectPressedOption(client, sessionId, journeyQuestion.correctIndex)
  ensure(correctSelection.selected, `Recovery journey: correct option ${journeyQuestion.correctIndex + 1} was not selectable`, failures)
  const submittedCorrect = await clickByText(client, sessionId, 'submit quiz')
  await wait(250)
  const correctResult = await evaluate(client, sessionId, `(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    attempts: JSON.parse(localStorage.getItem('kvs_quiz_attempts') || '[]'),
    mistakes: JSON.parse(localStorage.getItem('kvs_mistake_bank') || '[]'),
    stats: JSON.parse(localStorage.getItem('kvs_stats') || '{}'),
  }))()`)
  ensure(submittedCorrect && correctResult.h1 === '100%', `Recovery journey: expected a 100% retry, found ${correctResult.h1}`, failures)
  ensure(correctResult.attempts.length === 2 && correctResult.attempts[1]?.percentage === 100, 'Recovery journey: successful retry was not persisted', failures)
  ensure(correctResult.mistakes.length === 1 && correctResult.mistakes[0]?.resolved === true, 'Recovery journey: correct retry did not resolve the mistake', failures)
  ensure(typeof correctResult.mistakes[0]?.resolvedAt === 'number', 'Recovery journey: resolved mistake has no resolution timestamp', failures)
  ensure(correctResult.stats?.averageScore === 50, `Recovery journey: expected 50% two-attempt average, found ${correctResult.stats?.averageScore}`, failures)
  ensure(correctResult.stats?.totalXP === 50, `Recovery journey: retry farming changed total XP to ${correctResult.stats?.totalXP}`, failures)
  ensure(correctResult.stats?.awardedQuizIds?.filter((id) => id === journeyQuestion.lessonId).length === 1, 'Recovery journey: duplicate quiz reward keys were created', failures)
  await captureScreenshot(client, sessionId, 'journey-quiz-recovered.png')

  await navigate(client, sessionId, `${baseUrl}/mistake-review`)
  const openQueueText = await compactBodyText(client, sessionId)
  ensure(openQueueText.includes('Nothing in this view') && openQueueText.includes('Open review 0'), 'Recovery journey: resolved item remained in the open review queue', failures)
  const resolvedFilter = await clickByText(client, sessionId, '^resolved$')
  const resolvedText = await compactBodyText(client, sessionId)
  const resolvedReview = {
    question: resolvedText.includes(journeyQuestion.question),
    resolvedBadge: resolvedText.includes('Resolved'),
    openCount: resolvedText.includes('Open review 0'),
    resolvedCount: resolvedText.includes('Resolved 1'),
  }
  ensure(resolvedFilter && resolvedReview.question && resolvedReview.resolvedBadge, 'Recovery journey: resolved filter did not show the recovered question', failures)
  ensure(resolvedReview.openCount && resolvedReview.resolvedCount, 'Recovery journey: resolved/open counters are inconsistent', failures)

  await navigate(client, sessionId, `${baseUrl}/parent-dashboard`)
  const parentAfterText = await compactBodyText(client, sessionId)
  const parentAfterRetry = {
    openMistake: parentAfterText.includes('0 open items'),
    averageScore: parentAfterText.includes('Average quiz score 50%'),
    quizzesThisWeek: parentAfterText.includes('2/') && parentAfterText.includes('quizzes'),
    mistakeCard: await evaluate(client, sessionId, `[...document.querySelectorAll('button')].some((button) => /mistake review/i.test(button.textContent || '') && /0 open items/i.test(button.textContent || ''))`),
  }
  ensure(parentAfterRetry.openMistake, 'Recovery journey: Parent View did not clear the open-mistake count', failures)
  ensure(parentAfterRetry.averageScore, 'Recovery journey: Parent View did not show the two-attempt average', failures)
  ensure(parentAfterRetry.quizzesThisWeek, 'Recovery journey: Parent View did not count both quiz attempts', failures)
  ensure(parentAfterRetry.mistakeCard, 'Recovery journey: Parent View mistake card did not reflect the resolved state', failures)
  await captureScreenshot(client, sessionId, 'journey-parent-after-recovery.png')

  await navigate(client, sessionId, `${baseUrl}/settings`)
  const settingsText = await compactBodyText(client, sessionId)
  const settingsControls = await evaluate(client, sessionId, `({
    exportButton: [...document.querySelectorAll('button')].some((button) => /export all local data/i.test(button.textContent || '')),
    importButton: [...document.querySelectorAll('button')].some((button) => /import local data/i.test(button.textContent || '')),
    resetButton: [...document.querySelectorAll('button')].some((button) => /reset all local data/i.test(button.textContent || '')),
  })`)
  settingsControls.attempts = settingsText.includes('Quiz attempts 2')
  settingsControls.mistakes = settingsText.includes('Mistake records 1')
  ensure(settingsControls.exportButton, 'Journey: Settings export control is missing', failures)
  ensure(settingsControls.importButton, 'Journey: Settings import control is missing', failures)
  ensure(settingsControls.resetButton, 'Journey: Settings reset control is missing', failures)
  ensure(settingsControls.attempts, 'Journey: Settings did not report both quiz attempts', failures)
  ensure(settingsControls.mistakes, 'Journey: Settings did not report the mistake record', failures)

  await navigate(client, sessionId, `${baseUrl}/`)
  const focusSequence = []
  for (let index = 0; index < 18; index += 1) {
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId)
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }, sessionId)
    focusSequence.push(await evaluate(client, sessionId, `(() => {
      const element = document.activeElement
      return (element?.getAttribute('aria-label') || element?.textContent || element?.tagName || '').trim().slice(0, 80)
    })()`))
  }
  const uniqueFocus = new Set(focusSequence.filter(Boolean))
  ensure(uniqueFocus.size >= 8, `Keyboard: only ${uniqueFocus.size} unique controls received focus`, failures)

  const result = {
    journey: 'learner-lesson-quiz-mistake-recovery-parent-settings-keyboard',
    question: { id: journeyQuestion.id, lessonId: journeyQuestion.lessonId, subject: journeyQuestion.subject },
    personalised,
    subjectPath,
    lessonPath,
    completionState,
    wrongResult: { score: wrongResult.h1, attempts: wrongResult.attempts.length, mistakes: wrongResult.mistakes.length, totalXP: wrongResult.stats?.totalXP },
    parentBeforeRetry,
    correctResult: { score: correctResult.h1, attempts: correctResult.attempts.length, resolved: correctResult.mistakes[0]?.resolved, averageScore: correctResult.stats?.averageScore, totalXP: correctResult.stats?.totalXP },
    resolvedReview,
    parentAfterRetry,
    settingsControls,
    focusSequence,
  }
  checks.push(result)
  await client.send('Target.closeTarget', { targetId })
  return result
}

async function runOfflineJourney(client, failures, checks) {
  const { targetId, sessionId } = await createSession(client, { name: 'offline-mobile', width: 390, height: 844 })
  let offlineEnabled = false
  try {
    await navigate(client, sessionId, `${baseUrl}/`)
    const serviceWorkerReady = await evaluate(client, sessionId, `navigator.serviceWorker?.ready.then(() => true).catch(() => false) || false`)
    ensure(serviceWorkerReady, 'Offline journey: service worker did not become ready', failures)
    if (!(await evaluate(client, sessionId, 'Boolean(navigator.serviceWorker.controller)'))) await navigate(client, sessionId, `${baseUrl}/`)
    const serviceWorkerControlled = await evaluate(client, sessionId, 'Boolean(navigator.serviceWorker.controller)')
    ensure(serviceWorkerControlled, 'Offline journey: page is not controlled by the service worker', failures)

    const cacheState = await evaluate(client, sessionId, `(async () => {
      const names = await caches.keys()
      const name = names.find((item) => item.startsWith('kirthiverse-shell-v4')) || null
      if (!name) return { names, name: null, urls: [] }
      const cache = await caches.open(name)
      const urls = (await cache.keys()).map((request) => new URL(request.url).pathname)
      return { names, name, urls }
    })()`)
    ensure(Boolean(cacheState.name), 'Offline journey: current shell cache was not created', failures)
    ensure(cacheState.urls.includes('/index.html'), 'Offline journey: index.html is not precached', failures)
    ensure(cacheState.urls.includes('/offline.html'), 'Offline journey: offline fallback is not precached', failures)
    ensure(cacheState.urls.some((url) => url.startsWith('/assets/') && url.endsWith('.js')), 'Offline journey: compiled JavaScript is not precached', failures)
    ensure(cacheState.urls.some((url) => url.startsWith('/assets/') && url.endsWith('.css')), 'Offline journey: compiled CSS is not precached', failures)
    ensure(cacheState.urls.includes('/release-status.json'), 'Offline journey: release status is not precached', failures)

    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
      connectionType: 'none',
    }, sessionId)
    offlineEnabled = true
    await wait(250)
    const navigatorOffline = await evaluate(client, sessionId, 'navigator.onLine === false')
    ensure(navigatorOffline, 'Offline journey: navigator did not report offline status', failures)

    await navigate(client, sessionId, `${baseUrl}/weekly-review?offline-audit=1`, { allowNetworkError: true })
    const offlinePage = await evaluate(client, sessionId, `(() => ({
      path: location.pathname,
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      banner: document.body.innerText.includes('You are offline.'),
      controller: Boolean(navigator.serviceWorker.controller),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    }))()`)
    ensure(offlinePage.path === '/weekly-review', `Offline journey: fallback rendered the wrong path ${offlinePage.path}`, failures)
    ensure(offlinePage.h1.toLowerCase().includes('weekly review'), `Offline journey: saved SPA route did not render; h1 was ${offlinePage.h1}`, failures)
    ensure(offlinePage.banner, 'Offline journey: accessible offline status banner was not shown', failures)
    ensure(offlinePage.controller, 'Offline journey: service worker control was lost', failures)
    ensure(!offlinePage.horizontalOverflow, 'Offline journey: weekly review overflows the mobile viewport', failures)

    const offlineResources = await evaluate(client, sessionId, `(async () => {
      const release = await fetch('/release-status.json').then((response) => response.ok ? response.json() : null).catch(() => null)
      const privacy = await fetch('/child-privacy.html').then((response) => response.ok ? response.text() : '').catch(() => '')
      const icon = await fetch('/icons/kirthiverse-icon.svg').then((response) => response.ok ? response.text() : '').catch(() => '')
      return { release: release?.release || null, localFirst: release?.localFirst, privacyLength: privacy.length, iconLength: icon.length }
    })()`)
    ensure(offlineResources.release === 'KVS-PLATFORM-001' && offlineResources.localFirst === true, 'Offline journey: release-status.json was unavailable or invalid offline', failures)
    ensure(offlineResources.privacyLength > 500, 'Offline journey: child-readable privacy notice was unavailable offline', failures)
    ensure(offlineResources.iconLength > 100, 'Offline journey: application icon was unavailable offline', failures)
    await captureScreenshot(client, sessionId, 'offline-weekly-review.png')

    const result = { journey: 'service-worker-compiled-shell-offline-recovery', serviceWorkerReady, serviceWorkerControlled, cacheState, navigatorOffline, offlinePage, offlineResources }
    checks.push(result)
    return result
  } finally {
    if (offlineEnabled) {
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
        connectionType: 'wifi',
      }, sessionId).catch(() => undefined)
    }
    await client.send('Target.closeTarget', { targetId }).catch(() => undefined)
  }
}

async function run() {
  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })
  const failures = []
  const checks = []
  const journeyQuestion = await selectJourneyQuestion()
  const server = await startServer()
  const chromePath = findChrome()
  if (!chromePath) throw new Error('Chrome/Chromium executable not found. Set CHROME_PATH.')
  const profileDir = fs.mkdtempSync(path.join(outputDir, 'chrome-profile-'))
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] })
  let chromeStderr = ''
  chrome.stderr.on('data', (chunk) => { chromeStderr += chunk.toString() })

  try {
    const version = await pollJson(`http://${baseHost}:${debugPort}/json/version`)
    const client = new CdpClient(version.webSocketDebuggerUrl)
    await client.connect()
    await runRouteMatrix(client, failures, checks)
    await runLearnerRecoveryJourney(client, failures, checks, journeyQuestion)
    await runOfflineJourney(client, failures, checks)
    client.close()
  } finally {
    server.close()
    chrome.kill('SIGTERM')
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    chromePath,
    viewports,
    routes,
    routeChecks: viewports.length * routes.length,
    journeyQuestion: { id: journeyQuestion.id, lessonId: journeyQuestion.lessonId, subject: journeyQuestion.subject },
    failures,
    passed: failures.length === 0,
    checks,
    chromeStderr: failures.length ? chromeStderr.slice(-4000) : undefined,
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  const summary = [
    '# KirthiVerse browser smoke summary',
    '',
    `- Result: **${report.passed ? 'PASS' : 'FAIL'}**`,
    `- Route/viewport checks: **${report.routeChecks}**`,
    '- Route quality: **landmarks, headings, overflow, labels, alt text, ARIA references, focus order, target size, console and runtime errors**',
    '- Learner journey: **profile → lesson completion → intentional incorrect quiz → Mistake Review → Parent View → correct retry → automatic resolution → Settings evidence → keyboard traversal**',
    '- Offline journey: **service-worker control, compiled JS/CSS precache, unvisited SPA route recovery, offline banner and cached trust resources**',
    `- Viewports: ${viewports.map((item) => `${item.width}×${item.height}`).join(', ')}`,
    `- Failures: **${failures.length}**`,
    '',
    ...(failures.length ? ['## Failures', ...failures.map((failure) => `- ${failure}`)] : ['All automated browser, recovery and offline controls passed.']),
  ].join('\n')
  fs.writeFileSync(markdownPath, summary)
  console.log(summary)
  if (failures.length) process.exit(1)
}

run().catch((error) => {
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify({ passed: false, fatal: error.message, stack: error.stack }, null, 2))
  console.error(error)
  process.exit(1)
})
