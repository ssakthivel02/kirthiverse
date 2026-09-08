import { test, expect } from '@playwright/test'

test.describe('Family Bridge depth v2', () => {
  test('shows local evidence depth without implying cloud monitoring', async ({ page }) => {
    await page.goto('/family-bridge')

    await expect(page.getByRole('heading', { name: 'Learning evidence recorded on this device' })).toBeVisible()
    await expect(page.getByText('Time this week')).toBeVisible()
    await expect(page.getByText('Active learning days')).toBeVisible()
    await expect(page.getByText('7-day learning plan')).toBeVisible()
    await expect(page.getByText('Current milestone')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learning plan summary for the family' })).toBeVisible()
    await expect(page.getByText(/not a teacher-issued assignment/i)).toBeVisible()
    await expect(page.getByText(/No remote monitoring or cloud child profile is used/i)).toBeVisible()
  })
})
