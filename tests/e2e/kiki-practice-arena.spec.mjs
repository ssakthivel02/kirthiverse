import { expect, test } from '@playwright/test'

function collectPageErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

test.describe('Kiki Practice Arena', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
  })

  test('runs a calm practice mission and persists a learner decision', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/practice')

    await expect(page.getByRole('heading', { name: /Short, calm practice with Kiki/i })).toBeVisible()
    await expect(page.getByText('கிகி பயிற்சி அரங்கம்')).toBeVisible()

    const threeMinutes = page.getByRole('button', { name: '3 min' })
    await threeMinutes.click()
    await expect(threeMinutes).toHaveAttribute('aria-pressed', 'true')

    const calmMode = page.getByRole('checkbox')
    await expect(calmMode).toBeChecked()

    await page.getByRole('button', { name: /Start with Kiki/i }).click()
    await expect(page.getByLabel(/minutes .* seconds remaining/i)).toBeVisible()

    const optionButtons = page.locator('section').filter({ has: page.getByText(/answered/i) }).getByRole('button')
    const answer = optionButtons.filter({ hasNotText: /Pause|End mission/i }).first()
    await answer.click()
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next question' })).toBeVisible()

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
    await page.getByRole('button', { name: 'Resume' }).click()

    await page.getByRole('button', { name: /End mission/i }).click()
    await expect(page.getByRole('heading', { name: /Mission complete/i })).toBeVisible()
    await page.getByRole('button', { name: 'Need more practice' }).click()
    await expect(page.getByText(/Need more practice/).last()).toBeVisible()

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kvs_kiki_practice_history_v1') || '[]'))
    expect(saved.length).toBeGreaterThan(0)
    expect(saved[0].durationMinutes).toBe(3)
    expect(saved[0].result).toBe('need_more_practice')
    expect(errors).toEqual([])
  })

  test('has no horizontal overflow at the active viewport', async ({ page }) => {
    await page.goto('/practice')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('survives refresh on the direct practice route', async ({ page }) => {
    await page.goto('/practice')
    await page.reload()
    await expect(page.getByText(/Kiki Practice Arena/).first()).toBeVisible()
  })
})
