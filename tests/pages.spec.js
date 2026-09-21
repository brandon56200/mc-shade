import { test, expect } from '@playwright/test'

test('GitHub Pages subpath resolves every displayed asset and plays both demos', async ({ page }) => {
  const url = process.env.PAGES_TEST_URL
  test.skip(!url, 'Set PAGES_TEST_URL to test a Pages-style production build')
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(url)
  await expect(page.locator('h1')).toContainText('Neural rendering')
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded()
    await expect(image).toHaveAttribute('src', /^\/mc-shade\//)
    await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true)
  }
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.fonts.check('300 80px Satoshi'))).toBe(true)
  for (const cam of [1, 2]) {
    const figure = page.locator(`[data-demo="warehouse-${cam}"]`)
    const video = figure.locator('video')
    await expect(video).toHaveAttribute('src', `/mc-shade/media/warehouse-${cam}-loop.mp4`)
    await video.scrollIntoViewIfNeeded()
    await video.evaluate(v => v.play())
    await expect.poll(() => video.evaluate(v => v.currentTime)).toBeGreaterThan(0.1)
    await video.evaluate(v => v.pause())
    await expect(figure.getByRole('link', { name: 'Full sequence' })).toHaveAttribute('href', `/mc-shade/media/warehouse-${cam}-full.mp4`)
  }
  expect(errors).toEqual([])
})
