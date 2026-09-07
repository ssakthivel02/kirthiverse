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

  test('runs a calm practice mission and persists learner evidence', async ({ page }) => {
    const errors = collectPageErrors(page)
    await page.goto('/practice')

    await expect(page.getByRole('heading', { name: /Short, calm practice with Kiki/i })).toBeVisible()
    await expect(page.getByText('கிகி பயிற்சி அரங்கம்')).toBeVisible()

    const threeMinutes = page.getByRole('button', { name: '3 min' })
    await threeMinutes.click()
    await expect(threeMinutes).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('checkbox')).toBeChecked()

    await page.getByRole('button', { name: /Start with Kiki/i }).click()
    await expect(page.getByLabel('Calm Mode timer running')).toBeVisible()
    await page.getByTestId('arena-option').first().click()
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next question' })).toBeVisible()

    const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('kvs_quiz_attempts') || '[]'))
    expect(attempts).toHaveLength(1)
    expect(attempts[0].quizId).toContain('kiki-arena:')
    expect(attempts[0].totalQuestions).toBe(1)

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()
    await page.getByRole('button', { name: 'Resume' }).click()

    await page.getByRole('button', { name: /End mission/i }).click()
    await expect(page.getByRole('heading', { name: /Mission complete/i })).toBeVisible()
    await page.getByRole('button', { name: 'Need more practice' }).click()
    await expect(page.getByRole('status')).toContainText('saved this practice reflection')

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kvs_kiki_practice_history_v1') || '[]'))
    expect(saved).toHaveLength(1)
    expect(saved[0].durationMinutes).toBe(3)
    expect(saved[0].result).toBe('need_more_practice')
    expect(errors).toEqual([])
  })

  test('shows countdown outside Calm Mode', async ({ page }) => {
    await page.goto('/practice')
    await page.getByRole('checkbox').uncheck()
    await page.getByRole('button', { name: /Start with Kiki/i }).click()
    await expect(page.getByLabel(/minutes .* seconds remaining/i)).toBeVisible()
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
