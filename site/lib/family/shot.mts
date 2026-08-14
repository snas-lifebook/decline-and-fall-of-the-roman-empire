/**
 * `out-preview/*.svg` 를 실제 크기로 스크린샷 찍는다. 눈으로 보기 위한 도구다.
 *   npx tsx lib/family/shot.mts
 *
 * qlmanage는 정사각 캔버스에 넣어 잘린 것처럼 보이게 만든다 — 구조 검증을
 * 렌더 아티팩트로 착각하지 않으려고 둔다.
 */
import { chromium } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'

// 설치된 Chrome을 그대로 쓴다. 번들 브라우저를 따로 받지 않는다.
const browser = await chromium.launch({ channel: 'chrome' })
for (const file of readdirSync('out-preview').filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(`out-preview/${file}`, 'utf8')
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/)
  if (!m) continue
  const width = Math.ceil(Number(m[1]))
  const height = Math.ceil(Number(m[2]))
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
  await page.setContent(`<body style="margin:0;background:#fff">${svg}</body>`)
  await page.screenshot({ path: `out-preview/${file}.png` })
  await page.close()
  process.stdout.write(`${file}  ${width}x${height}\n`)
}
await browser.close()
