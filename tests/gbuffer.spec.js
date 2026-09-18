import { test, expect } from '@playwright/test'

const channels = ['BaseColor', 'Normals', 'Depth', 'Roughness', 'Metallic']

test('actual G-buffers can be inspected in the Approach section', async ({ page }) => {
  await page.goto(process.env.PAGES_TEST_URL || '/')
  const figure = page.locator('#approach .gbuffer-explorer')
  await expect(figure).toBeVisible()
  await expect(figure).toContainText('WAREHOUSE / FRAME 600')
  await expect(figure.getByRole('group', { name: 'Select a G-buffer pass' }).getByRole('button')).toHaveCount(5)
  for (const name of channels) {
    const button = figure.getByRole('button', { name, exact: true })
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    const preview = figure.locator('#gbuffer-preview img')
    await expect(preview).toHaveAttribute('src', new RegExp(`/gbuffers/${name.toLowerCase()}\\.png$`))
    await expect.poll(() => preview.evaluate(img => img.complete && img.naturalWidth === 512 && img.naturalHeight === 288)).toBe(true)
  }
  const first = figure.getByRole('button', { name: 'BaseColor', exact: true })
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await expect(figure).toContainText('pixel values otherwise unchanged')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
