import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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
  test(`axe WCAG A/AA: ${route}`, async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto(route)
    await page.locator('main').first().waitFor({ state: 'visible' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(pageErrors).toEqual([])
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })
}
