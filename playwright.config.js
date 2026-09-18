import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: { baseURL: process.env.BLOG_TEST_URL || 'http://127.0.0.1:5173', channel: 'chrome', headless: true },
  reporter: 'list',
})
