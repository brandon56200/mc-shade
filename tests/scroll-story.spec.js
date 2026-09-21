import { test, expect } from '@playwright/test'

async function progress(page, selector, value) {
  await page.locator(selector).evaluate((el, p) => {
    const top = el.getBoundingClientRect().top + scrollY
    const stage = el.querySelector('.scroll-story-pin')
    const distance = el.offsetHeight - stage.offsetHeight
    window.scrollTo({ top: top - 96 + distance * p, behavior: 'instant' })
  }, value)
}

// Observe every eligibility change, not just an instantaneous attribute snapshot.
async function guidedChanges(story) {
  return story.evaluate(el => new Promise(resolve => {
    const changes = []
    const observer = new MutationObserver(records => {
      for (const record of records) changes.push(record.oldValue)
    })
    observer.observe(el, { attributes: true, attributeFilter: ['data-guided'], attributeOldValue: true })
    setTimeout(() => {
      observer.disconnect()
      resolve(changes)
    }, 800)
  }))
}

for (const { id, width, height } of [
  { id: 'renderer', width: 1366, height: 765 },
  { id: 'gbuffers', width: 1440, height: 776 },
  { id: 'gbuffers', width: 1440, height: 777 },
]) {
  test(`fit eligibility stays stable for ${id} at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const story = page.locator(`[data-story="${id}"]`)
    // Allow the font-driven resize to settle before watching for a feedback loop.
    await page.waitForTimeout(200)
    expect(await guidedChanges(story)).toEqual([])
    await expect(story).toHaveAttribute('data-guided', 'false')
    const fallbackHeight = await story.locator('.scroll-story-content').evaluate(el => el.offsetHeight)
    await page.setViewportSize({ width, height: height + 8 })
    await expect(story).toHaveAttribute('data-guided', 'true')
    expect(await story.locator('.scroll-story-content').evaluate(el => el.offsetHeight)).toBe(fallbackHeight)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(story).toHaveAttribute('data-guided', 'false')
    expect(await story.locator('.scroll-story-content').evaluate(el => el.offsetHeight)).toBe(fallbackHeight)
  })
}

for (const settings of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'short viewport', width: 1440, height: 600 },
  { name: 'reduced motion', width: 1440, height: 1000, reduced: true },
]) {
  test(`${settings.name} keeps manual controls without long pinned sections`, async ({ page }) => {
    await page.setViewportSize({ width: settings.width, height: settings.height })
    if (settings.reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    for (const id of ['renderer', 'gbuffers']) {
      const story = page.locator(`[data-story="${id}"]`)
      await expect(story).toHaveAttribute('data-guided', 'false')
      await expect(story.locator('.scroll-story-pin')).toHaveCSS('position', 'relative')
      expect(await story.evaluate(el => el.offsetHeight - el.querySelector('.scroll-story-content').offsetHeight)).toBeLessThan(4)
    }
    const slider = page.getByRole('slider')
    await slider.focus()
    await page.keyboard.press('End')
    await expect(slider).toHaveValue('100')
    await page.getByRole('button', { name: 'Metallic', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Metallic', exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('G-buffer fit budgets every pass before the Roughness scroll step', async ({ page }) => {
  await page.setViewportSize({ width: 1201, height: 720 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const selector = '[data-story="gbuffers"]'
  const story = page.locator(selector)
  await page.waitForTimeout(200)
  await progress(page, selector, 0.7)
  await page.waitForTimeout(200)
  expect(await guidedChanges(story)).toEqual([])
  // Roughness exceeds the available height here, so even BaseColor must fall back.
  await expect(story).toHaveAttribute('data-guided', 'false')
  const heights = []
  for (const name of ['BaseColor', 'Normals', 'Depth', 'Roughness', 'Metallic']) {
    await story.getByRole('button', { name, exact: true }).click()
    await expect(story.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(await guidedChanges(story)).toEqual([])
    heights.push(await story.locator('.scroll-story-content').evaluate(el => el.offsetHeight))
    await expect(story).toHaveAttribute('data-guided', 'false')
  }
  expect(new Set(heights).size).toBe(1)
  expect(heights[0]).toBeGreaterThan(720 - 128)
})

test('both tours fit a typical laptop viewport without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  for (const id of ['renderer', 'gbuffers']) {
    const selector = `[data-story="${id}"]`
    const story = page.locator(selector)
    await expect(story).toHaveAttribute('data-guided', 'true')
    for (const p of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      await progress(page, selector, p)
      expect(await guidedChanges(story)).toEqual([])
      await expect(story).toHaveAttribute('data-guided', 'true')
      if (id === 'gbuffers') {
        const name = ['BaseColor', 'Normals', 'Depth', 'Roughness', 'Metallic'][Math.floor(p * 5)]
        await expect(story.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
        await expect(story.locator('.gbuffer-explanation:visible')).toHaveCount(1)
      }
      const box = await story.locator('.scroll-story-content').boundingBox()
      expect(box.y).toBeGreaterThanOrEqual(80)
      expect(box.y + box.height).toBeLessThan(768)
    }
  }
})

test('skip exits each pinned sequence and moves keyboard focus after it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  for (const id of ['renderer', 'gbuffers']) {
    const selector = `[data-story="${id}"]`
    const story = page.locator(selector)
    await expect(story).toHaveAttribute('data-guided', 'true')
    await progress(page, selector, 0.3)
    await story.getByRole('button', { name: 'Skip tour' }).click()
    await expect(story.locator('.story-end')).toBeFocused()
    expect(await story.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(116)
  }
})

test('hero copy becomes inert at the exact fully transparent boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const selector = '[data-story="renderer"]'
  const story = page.locator(selector)
  const copy = story.locator('.hero-copy')
  await expect(story).toHaveAttribute('data-guided', 'true')
  await progress(page, selector, 0.17)
  await expect(copy).not.toHaveAttribute('inert')
  await progress(page, selector, 0.18)
  expect(await story.evaluate(el => (96 - el.getBoundingClientRect().top) /
    (el.offsetHeight - el.querySelector('.scroll-story-pin').offsetHeight))).toBe(0.18)
  await expect(copy).toHaveCSS('opacity', '0')
  await expect(copy).toHaveAttribute('inert')
  const link = copy.locator('a').first()
  await link.evaluate(el => el.focus({ preventScroll: true }))
  await expect(link).not.toBeFocused()
  await progress(page, selector, 0.17)
  await expect(copy).not.toHaveAttribute('inert')
})

test('printing after a scroll sequence restores the introduction', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.locator('[data-story="renderer"]')).toHaveAttribute('data-guided', 'true')
  await progress(page, '[data-story="renderer"]', 0.5)
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '0')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero-figure')).toHaveCSS('transform', 'none')
})

test('scrolling pins the renderer and sweeps the comparison', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const story = page.locator('[data-story="renderer"]')
  await expect(story).toHaveAttribute('data-guided', 'true')
  const slider = story.getByRole('slider')
  await progress(page, '[data-story="renderer"]', 0.2)
  await expect.poll(() => slider.inputValue()).toBe('100')
  const a = await story.locator('.image-comparison').boundingBox()
  await progress(page, '[data-story="renderer"]', 0.75)
  await expect.poll(() => slider.inputValue()).toBe('0')
  const b = await story.locator('.image-comparison').boundingBox()
  expect(Math.abs(a.y - b.y)).toBeLessThan(3)
  expect(Math.abs(b.x + b.width / 2 - 720)).toBeLessThan(3)
  expect(b.y).toBeGreaterThan(80)
  expect(b.y + b.height).toBeLessThan(1000)
  await progress(page, '[data-story="renderer"]', 0.2)
  await expect(slider).toHaveValue('100')
})

test('dragging or typing does not move the centered figure or fight scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const story = page.locator('[data-story="renderer"]')
  await expect(story).toHaveAttribute('data-guided', 'true')
  await progress(page, '[data-story="renderer"]', 0.5)
  const slider = story.getByRole('slider')
  await expect(slider).not.toHaveValue('50')
  const before = await story.locator('.image-comparison').boundingBox()
  await slider.focus()
  await page.keyboard.press('Home')
  await expect(slider).toHaveValue('0')
  const after = await story.locator('.image-comparison').boundingBox()
  expect(Math.abs(before.x - after.x)).toBeLessThan(2)
  await progress(page, '[data-story="renderer"]', 0.25)
  await expect(slider).toHaveValue('0')
  await story.getByRole('button', { name: 'Resume scroll tour' }).click()
  await expect(slider).toHaveValue('100')
  const box = await slider.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  const value = await slider.inputValue()
  expect(Number(value)).toBeGreaterThan(70)
  expect(Number(value)).toBeLessThan(90)
  await progress(page, '[data-story="renderer"]', 0.75)
  await expect(slider).toHaveValue(value)
})

test('scroll tour reveals all five G-buffers and manual selection takes priority', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const story = page.locator('[data-story="gbuffers"]')
  await expect(story).toHaveAttribute('data-guided', 'true')
  const channels = ['BaseColor', 'Normals', 'Depth', 'Roughness', 'Metallic']
  let firstY
  for (const [i, name] of channels.entries()) {
    await progress(page, '[data-story="gbuffers"]', (i + 0.5) / 5)
    await expect(story.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
    const preview = story.locator('#gbuffer-preview img')
    await expect(preview).toHaveAttribute('alt', `${name} G-buffer from warehouse camera 1, frame 600`)
    await expect.poll(() => preview.evaluate(img => img.complete && img.naturalWidth === 512)).toBe(true)
    const box = await story.locator('.gbuffer-explorer').boundingBox()
    firstY ??= box.y
    expect(Math.abs(box.y - firstY)).toBeLessThan(3)
    expect(box.y).toBeGreaterThan(80)
    expect(box.y + box.height).toBeLessThan(1000)
  }
  await story.getByRole('button', { name: 'Depth', exact: true }).click()
  await progress(page, '[data-story="gbuffers"]', 0.1)
  await expect(story.getByRole('button', { name: 'Depth', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await story.getByRole('button', { name: 'Resume scroll tour' }).click()
  await expect(story.getByRole('button', { name: 'BaseColor', exact: true })).toHaveAttribute('aria-pressed', 'true')
})
