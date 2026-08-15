import { chromium } from '@playwright/test'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1440, height: 940 } })
await p.goto('http://localhost:4400/objects/person/' + encodeURIComponent('카이사르'), { waitUntil: 'load' })
await p.waitForTimeout(3500)
await p.mouse.move(700, 500)
for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(80) }
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/graph.png' })
console.log('ok')
await b.close()
