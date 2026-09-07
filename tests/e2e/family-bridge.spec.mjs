import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('kvs_preferences', JSON.stringify({
      language: 'English',
      ageBand: '9-11',
      learningLevel: 'Explorer',
      dailyGoal: 3,
      favouriteSubjects: [],
      largerText: false,
      reducedMotion: false,
    }))
  })
})

test('Family Bridge is local-first, explainable and directly refreshable', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/family-bridge')
  await expect(page.getByRole('heading', { name: 'Turn learning evidence into clear family support.' })).toBeVisible()
  await expect(page.getByText('Privacy boundary', { exact: true })).toBeVisible()
  await expect(page.getByText(/does not provide remote monitoring/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Kiki Mastery Constellation/ })).toBeVisible()

  await page.reload()
  await expect(page.getByText('Family Bridge · குடும்ப இணைப்பு')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  expect(overflow).toBe(true)
  expect(pageErrors).toEqual([])
})

test('Family Bridge follows the saved Tamil preference', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kvs_preferences', JSON.stringify({
      language: 'Tamil',
      ageBand: '9-11',
      learningLevel: 'Explorer',
      dailyGoal: 3,
      favouriteSubjects: [],
      largerText: false,
      reducedMotion: false,
    }))
  })

  await page.goto('/family-bridge')
  await expect(page.getByRole('heading', { name: 'கற்றல் சான்றுகளை குடும்பத்துக்கு தெளிவாக மாற்றுங்கள்.' })).toBeVisible()
  await expect(page.getByText('தனியுரிமை வரம்பு', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /கிகி திறன் விண்மீன்/ })).toBeVisible()
})
