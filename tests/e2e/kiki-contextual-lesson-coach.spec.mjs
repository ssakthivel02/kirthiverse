import { test, expect } from '@playwright/test'

const lessonRoute = '/lesson/math-001'

test('lesson exposes contextual Kiki coach without blocking the lesson', async ({ page }) => {
  await page.goto(lessonRoute)
  await expect(page.getByRole('heading', { name: 'Understanding Place Value' })).toBeVisible()
  const trigger = page.getByRole('button', { name: 'Open Kiki lesson coach' })
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.getByTestId('kiki-lesson-coach')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Kiki lesson coach' })).toBeVisible()
  await expect(page.getByText('Local-first · no open child chat · no learner message sent externally')).toBeVisible()
})

test('contextual Kiki explains, invites a learner try and switches to Tamil', async ({ page }) => {
  await page.goto(lessonRoute)
  await page.getByRole('button', { name: 'Open Kiki lesson coach' }).click()

  await page.getByRole('button', { name: 'Explain with Kiki' }).click()
  await expect(page.getByText(/The key idea in this lesson is:/)).toBeVisible()

  await page.getByRole('button', { name: "I'll try" }).click()
  await expect(page.getByText(/Now explain this example in your own words:/)).toBeVisible()

  await page.getByRole('button', { name: 'தமிழ்' }).click()
  await expect(page.getByRole('heading', { name: 'கிகி பாட வழிகாட்டி' })).toBeVisible()
})

test('contextual Kiki closes cleanly and remains mobile reflow safe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(lessonRoute)
  await page.getByRole('button', { name: 'Open Kiki lesson coach' }).click()
  await expect(page.getByTestId('kiki-lesson-coach')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.getByRole('button', { name: 'Close Kiki lesson coach' }).click()
  await expect(page.getByTestId('kiki-lesson-coach')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open Kiki lesson coach' })).toBeVisible()
})
