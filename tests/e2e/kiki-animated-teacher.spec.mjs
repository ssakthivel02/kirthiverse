import { expect, test } from '@playwright/test'

test.describe('Kiki animated teacher v1', () => {
  test('is directly reachable and exposes deterministic learning states', async ({ page }) => {
    await page.goto('/kiki-teacher')
    await expect(page.getByRole('heading', { name: 'Learn with Kiki' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Kiki is ready to learn with you' })).toBeVisible()

    await page.getByRole('button', { name: 'Listening' }).click()
    await expect(page.getByRole('img', { name: 'Kiki is listening' })).toBeVisible()
    await expect(page.getByText('I’m listening. Take your time', { exact: false })).toBeVisible()

    await page.getByRole('button', { name: 'Explaining' }).click()
    await expect(page.getByRole('img', { name: 'Kiki is explaining' })).toBeVisible()

    await page.getByRole('button', { name: 'Celebrate' }).click()
    await expect(page.getByRole('img', { name: 'Kiki is celebrating your progress' })).toBeVisible()
    await expect(page.getByText('Celebrate the learning, not speed or ranking', { exact: false })).toBeVisible()
  })

  test('supports Tamil and the short /kiki entry route', async ({ page }) => {
    await page.goto('/kiki')
    await expect(page).toHaveURL(/\/kiki-teacher$/)
    await page.getByRole('button', { name: 'தமிழ்' }).click()
    await expect(page.getByRole('heading', { name: 'கிகியுடன் கற்போம்' })).toBeVisible()
    await expect(page.getByText('நான் கிகி', { exact: false })).toBeVisible()
  })

  test('stays reflow-safe on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/kiki-teacher')
    await expect(page.locator('main')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
