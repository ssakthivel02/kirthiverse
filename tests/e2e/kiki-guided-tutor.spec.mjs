import { test, expect } from '@playwright/test'

test('Guided Tutor shows animated Kiki and reviewed local-first boundary', async ({ page }) => {
  await page.goto('/ai-tutor')
  await expect(page.getByRole('heading', { name: 'Guided Tutor' })).toBeVisible()
  await expect(page.getByTestId('guided-tutor-kiki')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Kiki is ready to learn with you' })).toBeVisible()
  await expect(page.getByText('Reviewed fixed guidance · no open child chat · no learner prompt sent externally')).toBeVisible()
})

test('Kiki follows topic learning states without open chat', async ({ page }) => {
  await page.goto('/ai-tutor')
  await page.getByRole('button', { name: 'Fractions' }).click()

  await page.getByRole('button', { name: 'Explain with Kiki' }).click()
  await expect(page.getByRole('img', { name: 'Kiki is explaining' })).toBeVisible()
  await expect(page.getByText(/Let’s focus on the key idea first/)).toBeVisible()

  await page.getByRole('button', { name: /I[’']ll try/ }).click()
  await expect(page.getByRole('img', { name: 'Kiki is listening' })).toBeVisible()
  await expect(page.getByText(/Your turn: explain the example/)).toBeVisible()

  await page.getByRole('button', { name: 'Celebrate progress' }).click()
  await expect(page.getByRole('img', { name: 'Kiki is celebrating your progress' })).toBeVisible()
})

test('Guided Tutor switches Kiki interface to Tamil and remains reflow safe on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ai-tutor')
  await page.getByRole('button', { name: 'தமிழ்' }).click()
  await expect(page.getByRole('heading', { name: 'வழிகாட்டும் ஆசிரியர்' })).toBeVisible()
  await expect(page.getByText(/கிகி சரிபார்க்கப்பட்ட நிலையான கற்றல் உள்ளடக்கத்தைப் பயன்படுத்துகிறது/)).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
