import { expect, test } from '@playwright/test'

const criticalRoutes = [
  '/',
  '/learning-worlds',
  '/practice',
  '/mastery',
  '/family-bridge',
  '/search',
  '/profile',
  '/progress-report',
]

for (const route of criticalRoutes) {
  test(`direct route and refresh remain stable: ${route}`, async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto(route)
    await expect(page.locator('main').first()).toBeVisible()
    await page.reload()
    await expect(page.locator('main').first()).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    expect(pageErrors).toEqual([])
  })
}

test('browser back and forward preserve the learner journey', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main').first()).toBeVisible()
  await page.goto('/learning-worlds')
  await expect(page).toHaveURL(/\/learning-worlds$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('main').first()).toBeVisible()

  await page.goForward()
  await expect(page).toHaveURL(/\/learning-worlds$/)
  await expect(page.locator('main').first()).toBeVisible()
})

test('keyboard navigation reaches meaningful interactive controls', async ({ page }) => {
  await page.goto('/')
  const focused = []

  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab')
    focused.push(await page.evaluate(() => {
      const element = document.activeElement
      if (!element) return ''
      return [element.tagName, element.getAttribute('href') ?? '', element.textContent?.trim().slice(0, 60) ?? ''].join('|')
    }))
  }

  expect(focused.some((entry) => entry.startsWith('A|') || entry.startsWith('BUTTON|'))).toBeTruthy()
  expect(new Set(focused.filter(Boolean)).size).toBeGreaterThan(2)
})

test('reduced-motion preference suppresses meaningful transition duration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/learning-worlds')
  await expect(page.locator('main').first()).toBeVisible()
  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBeTruthy()

  const durations = await page.locator('button').first().evaluate((element) => {
    const styles = getComputedStyle(element)
    return { animationDuration: styles.animationDuration, transitionDuration: styles.transitionDuration }
  })

  const maxSeconds = (value) => Math.max(...value.split(',').map((item) => {
    const trimmed = item.trim()
    if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed) / 1000
    if (trimmed.endsWith('s')) return Number.parseFloat(trimmed)
    return 0
  }))

  expect(maxSeconds(durations.animationDuration)).toBeLessThanOrEqual(0.001)
  expect(maxSeconds(durations.transitionDuration)).toBeLessThanOrEqual(0.001)
})

test('mobile progress table is keyboard focusable without document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/progress-report')

  const tableRegion = page.getByRole('region', { name: /Mastery by subject table/i })
  await expect(tableRegion).toBeVisible()
  await tableRegion.focus()
  await expect(tableRegion).toBeFocused()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
