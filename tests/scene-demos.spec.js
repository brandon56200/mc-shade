import { test, expect } from '@playwright/test'

const pageUrl = process.env.PAGES_TEST_URL || '/'
const assetBase = process.env.PAGES_TEST_URL
  ? new URL(process.env.PAGES_TEST_URL).pathname.replace(/\/?$/, '/')
  : '/'

test('office and kitchen use the same accessible figure treatment as warehouse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(pageUrl)
  await expect(page.locator('.demo-figure')).toHaveCount(4)
  for (const [id, label] of [['office', 'Office / earlier study'], ['kitchen', 'Kitchen / earlier study']]) {
    const figure = page.locator(`[data-demo="${id}"]`)
    await expect(figure).toHaveClass('demo-figure')
    await expect(figure.locator('.figure-topline')).toContainText('5-SECOND EXCERPT')
    await expect(figure.locator('.demo-labels')).toHaveText('BaseColor inputMC-Shade')
    await expect(figure.locator('figcaption')).toContainText('five-second edited excerpt')
    await expect(figure.locator('figcaption')).toContainText('playback speed is not inference speed')
    const video = figure.locator('video')
    await video.scrollIntoViewIfNeeded()
    await expect(video).toHaveAttribute('src', `${assetBase}legacy/${id}.mp4`)
    await expect(video).toHaveAttribute('poster', `${assetBase}legacy/${id}-poster.jpg`)
    await expect.poll(() => video.evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2)
    await expect(video).toHaveJSProperty('paused', true)
    await figure.getByRole('button', { name: `Play ${label}` }).click()
    await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0)
    await figure.getByRole('button', { name: `Pause ${label}` }).click()
    await expect(video).toHaveJSProperty('paused', true)
    await expect(figure.getByRole('link', { name: 'Open clip' })).toHaveAttribute('href', `${assetBase}legacy/${id}.mp4`)
    await expect(figure).not.toContainText('998-frame')
    await expect(figure).not.toContainText('UE5 reference')
  }
  await expect(page.locator('.detail-figure .figure-topline')).toContainText('FIGURE 05')
  const presentation = page.locator('dt').filter({ hasText: /^Presentation$/ }).locator('..').locator('dd')
  await expect(presentation).toContainText('The warehouse excerpts remove letterboxing from both panels; full warehouse sequences retain it.')
  await expect(presentation).toContainText('No temporal smoothing or color correction is applied to the warehouse clips.')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
