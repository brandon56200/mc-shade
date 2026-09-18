import { test, expect } from '@playwright/test'

test('print text remains readable on white surfaces', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ media: 'print' })
  const ratios = await page.locator('.prose p, .argument p, .hero-deck, .opening-grid > p').evaluateAll(nodes => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number)
    const lum = color => color.map(v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
    return nodes.map(node => {
      let parent = node
      let bg = 'rgb(255, 255, 255)'
      while (parent) {
        const candidate = getComputedStyle(parent).backgroundColor
        if (candidate !== 'rgba(0, 0, 0, 0)' && candidate !== 'transparent') { bg = candidate; break }
        parent = parent.parentElement
      }
      const a = lum(rgb(getComputedStyle(node).color)), b = lum(rgb(bg))
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    })
  })
  expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5)
})

test('editorial redesign uses the report typography and new-checkpoint figures', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Neural renderingfor physical AI.')
  await expect(page.locator('h1')).toHaveCSS('font-family', /Satoshi/)
  await expect(page.getByRole('heading', { name: 'Where the image still falls short.' })).toBeVisible()
  await expect(page.locator('[data-demo="warehouse-1"] video')).toHaveAttribute('src', '/media/warehouse-1-loop.mp4')
  await expect(page.locator('[data-demo="warehouse-2"] video')).toHaveAttribute('src', '/media/warehouse-2-loop.mp4')
  await expect(page.getByRole('link', { name: 'Read the scope' })).toHaveAttribute('href', '#scope')
})
