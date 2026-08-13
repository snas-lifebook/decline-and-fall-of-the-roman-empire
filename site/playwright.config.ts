import { defineConfig } from '@playwright/test'

/**
 * output: 'export' 사이트라 `next start`가 안 된다. `out/`을 정적 서버로 띄운다.
 * (Next.js 16 static export — next start는 서버 모드 전용)
 */
export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npx --yes serve out -l 3000 -s',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:3000' },
})
