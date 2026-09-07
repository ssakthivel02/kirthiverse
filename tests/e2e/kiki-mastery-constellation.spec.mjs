import { expect, test } from '@playwright/test'

function attempt({ quizId, lessonId, subject, percentage, attemptDate }) {
  return {
    quizId,
    lessonId,
    subject,
    score: percentage >= 50 ? 1 : 0,
    totalQuestions: 1,
    percentage,
    attemptDate,
  }
}

test.describe('Kiki Mastery Constellation', () => {
  test('explains repeated difficulty without opaque AI wording', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('kvs_quiz_attempts', JSON.stringify([
        { quizId: 'seed-1', lessonId: 'math-001', subject: 'Mathematics', score: 0, totalQuestions: 1, percentage: 40, attemptDate: 1000 },
        { quizId: 'seed-2', lessonId: 'math-001', subject: 'Mathematics', score: 0, totalQuestions: 1, percentage: 50, attemptDate: 2000 },
      ]))
    })

    await page.goto('/mastery')
    await expect(page.getByRole('heading', { name: /why Kiki picked what comes next/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Why Kiki picked this for you' })).toBeVisible()
    await expect(page.getByText(/repeated difficulty here/i).first()).toBeVisible()
    await expect(page.getByText('Repeated difficulty signal').first()).toBeVisible()
    await expect(page.getByText(/opaque AI score is used/i)).toBeVisible()
  })

  test('marks strong evidence as challenge ready', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('kvs_quiz_attempts', JSON.stringify([
        { quizId: 'seed-strong', lessonId: 'math-001', subject: 'Mathematics', score: 1, totalQuestions: 1, percentage: 95, attemptDate: 3000 },
      ]))
    })

    await page.goto('/mastery')
    await expect(page.getByText('Challenge ready').first()).toBeVisible()
    await expect(page.getByText(/recent evidence is strong/i).first()).toBeVisible()
  })

  test('requires every explicit prerequisite before challenge routing', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('kvs_quiz_attempts', JSON.stringify([
        { quizId: 'seed-math-005', lessonId: 'math-005', subject: 'Mathematics', score: 1, totalQuestions: 1, percentage: 90, attemptDate: 1000 },
        { quizId: 'seed-math-006', lessonId: 'math-006', subject: 'Mathematics', score: 1, totalQuestions: 1, percentage: 95, attemptDate: 2000 },
      ]))
    })

    await page.goto('/mastery')
    const card = page.getByRole('heading', { name: 'Introduction to Division' }).locator('..').locator('..')
    await expect(card.getByText(/prerequisite lessons still need evidence/i)).toBeVisible()
    await expect(card.getByText(/Introduction to Multiplication — needs evidence first/)).toBeVisible()
    await expect(card.getByText(/Multiplication Facts 6-10 — secure enough to continue/)).toBeVisible()
    await expect(card.getByRole('button', { name: /Strengthen prerequisite/ })).toBeVisible()
  })

  test('is local-first, refresh-safe and free from horizontal overflow', async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto('/mastery')
    await page.reload()
    await expect(page.getByText(/local-first model/i)).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    expect(pageErrors).toEqual([])
  })
})
