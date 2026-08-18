import { test, expect } from '@playwright/test'

/**
 * 읽는 사람이 실제로 하는 일.
 *
 * 헌장 4절 경계표가 `e2e/`에 **「구현 세부를 두지 않는다」**고 못박았다. 여기서 보는
 * 것은 「카드가 몇 장인가」가 아니라 「이름을 누르면 그 사람이 누구인지 알 수 있는가」다.
 */

const POINT = '/read/point/5'

test.describe('대목 읽기', () => {
  test('**본문이 뜬다** — `serve -s`가 켜져 있으면 여기서 허브가 잡힌다', async ({ page }) => {
    // 이 테스트가 첫 줄에 있는 이유: 앞 판 설정의 `-s`(SPA 모드)가 모든 경로에
    // `index.html`을 줘서, 아래 테스트가 전부 허브를 보고 초록이 될 뻔했다
    await page.goto(POINT)
    await expect(page.locator('h1')).toContainText('카이사르 등장 이전의 혼란')
    await expect(page.locator('.read-block').first()).toBeVisible()
  })

  test('옆에 그 사람이 누구인지 뜬다', async ({ page }) => {
    await page.goto(POINT)
    const card = page.locator('.read-grid > .read-card').first()
    await expect(card).toBeVisible()
    // 이름 · 한 줄 소개가 다 있어야 카드다. 이름만 있으면 링크와 다를 게 없다
    await expect(card.locator('.read-card-name')).not.toBeEmpty()
    await expect(card.locator('.read-card-line')).not.toBeEmpty()
  })

  test('카드를 누르면 그 사람 화면으로 간다', async ({ page }) => {
    await page.goto(POINT)
    const card = page.locator('.read-grid > .read-card').first()
    const href = await card.getAttribute('href')
    await card.click()
    // 주소는 퍼센트 인코딩돼 있고 브라우저가 풀어서 보여준다. 정규식으로 꼬리를
    // 맞추면 한글에서 어긋나므로 **디코딩해서 통째로** 견준다
    await page.waitForURL((url) => decodeURIComponent(url.pathname) === decodeURIComponent(href!))
    await expect(page.locator('h1')).not.toBeEmpty()
  })

  test('목차가 붙어 있고 지금 절을 알려준다', async ({ page }) => {
    await page.goto(POINT)
    const rail = page.locator('.read-rail')
    await expect(rail).toBeVisible()

    // 굴려도 목차는 화면에 남아 있어야 한다 — 그게 이 자리에 둔 이유다
    await page.evaluate(() => {
      document.getElementById('astryx-app-shell-main')!.scrollTop = 2000
    })
    await expect(rail).toBeInViewport()
  })

  test('**지명에 마우스를 올리면 지도가 뜨고 그 자리가 켜진다**', async ({ page }) => {
    await page.goto(POINT)
    const place = page.locator('.read-block a[href^="/objects/place/"]').first()
    await place.scrollIntoViewIfNeeded()
    await place.hover()

    // 120ms 늦게 뜬다. `waitForTimeout`이 아니라 나타남을 기다린다
    await expect(page.locator('.point-map .lit')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.map-slot')).toBeVisible()
  })

  test('앞뒤로 넘어가는 길이 딸린 자료보다 먼저 나온다', async ({ page }) => {
    await page.goto(POINT)
    const next = page.locator('a', { hasText: '천적과의 전쟁' }).first()
    const map = page.locator('.map-slot')
    const [nextY, mapY] = await Promise.all([
      next.evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
      map.evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
    ])
    expect(nextY, '앞뒤 링크가 지도보다 뒤에 있다').toBeLessThan(mapY)
  })

  test('딸린 자료 넷이 접혀 있다 — 다 펴 두면 본문보다 길다', async ({ page }) => {
    await page.goto(POINT)
    for (const label of ['이 대목의 관계망', '이 대목을 표로 받기', '자주 묻는 것']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })
})

test.describe('폰으로 읽기', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('**카드가 본문 사이에 하나도 없다** — River가 「상당히 큰 불편」이라 한 자리', async ({
    page,
  }) => {
    await page.goto(POINT)
    await expect(page.locator('.read-block').first()).toBeVisible()
    const info = await page.evaluate(() => ({
      w: window.innerWidth,
      mq: window.matchMedia('(max-width: 1100px)').matches,
      grid: getComputedStyle(document.querySelector('.read-grid')!).display,
      shown: [...document.querySelectorAll('.read-card')].filter(
        (e) => getComputedStyle(e).display !== 'none',
      ).length,
      total: document.querySelectorAll('.read-card').length,
    }))
    expect(info.shown, `본문 흐름에 카드가 남아 있다 ${JSON.stringify(info)}`).toBe(0)
  })

  test('이름을 누르면 아래에서 카드가 올라온다', async ({ page }) => {
    await page.goto(POINT)
    // 카드가 붙은 이름을 찾는다. 47개 중 카드가 있는 것은 14개다
    const href = await page.evaluate(() => {
      const has = new Set(
        [...document.querySelectorAll('.read-grid > .read-card')].map((c) => c.getAttribute('href')),
      )
      return (
        [...document.querySelectorAll('.read-block a[href^="/objects/"]')].find((a) =>
          has.has(a.getAttribute('href')),
        )?.getAttribute('href') ?? null
      )
    })
    expect(href, '카드가 붙은 본문 링크가 없다').not.toBeNull()

    await page.locator(`.read-block a[href="${href}"]`).first().click()
    await expect(page.locator('.read-card[data-open]')).toBeVisible()
    // 본문에 그대로 남아 있어야 한다 — 눌렀다고 화면을 떠나면 읽던 자리를 잃는다
    await expect(page).toHaveURL(new RegExp('/read/point/5'))

    await page.keyboard.press('Escape')
    await expect(page.locator('.read-card[data-open]')).toHaveCount(0)
  })

  test('가로로 안 넘친다', async ({ page }) => {
    await page.goto(POINT)
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(over).toBe(false)
  })
})

/**
 * 책 한 권으로 묶은 뒤 (2026-08-19).
 *
 * River: 「읽기에는 여러 텍스트를 큰 책 단위로 묶어보자 … 그 책을 눌러 들어갔을 때는
 * 책과 저자에 대한 소개페이지가 있고, 바로 쉽게 각 목차별로 들어갈 수 있게」.
 *
 * 여기서 지키는 것은 **아무도 빠지지 않는 것**이다. 일러두기·책머리에·옮기고 나서는
 * 파일로 있으면서 사이트 어디에도 안 걸려 있었다 — 그 사고를 다시 안 내려고 본다.
 */
test.describe('책으로 들어가기', () => {
  test('읽기는 책장이고, 책을 누르면 문패가 뜬다', async ({ page }) => {
    await page.goto('/read')
    await expect(page.locator('.book')).toBeVisible()
    // 사이드바에도 같은 이름이 걸려 있다. 책장의 책을 누른다 — 표지를 눌러도
    // 열려야 하므로 숨은 링크가 아니라 **표지 자체**를 누른다
    await page.locator('.shelf .book').click()
    await expect(page.locator('h1')).toContainText('30포인트로 읽어내는')
  })

  test('차례에 앞뒤 글까지 33편이 있고 종이책 쪽수가 붙는다', async ({ page }) => {
    await page.goto('/read/rome30')
    // 차례 줄마다 하나씩 있는 번호칸으로 센다. 사이드바에도 33편이 걸려 있고,
    // 본문에도 「처음부터 읽기」 같은 링크가 따로 있어서 링크를 세면 안 맞는다
    await expect(page.locator('.toc-n')).toHaveCount(33)
    // 앞뒤 글 셋은 이름으로 확인한다. 이게 빠졌던 것이 이 작업의 출발점이다
    for (const t of ['일러두기', '책머리에', '옮기고 나서']) {
      await expect(page.locator('.doc').getByRole('link', { name: t }).first()).toBeVisible()
    }
    await expect(page.locator('.doc').getByText('317', { exact: true })).toBeVisible()
  })

  test('앞뒤 글도 읽기 환경을 그대로 쓴다', async ({ page }) => {
    await page.goto('/read/text/책머리에')
    await expect(page.locator('h1')).toContainText('책머리에')
    await expect(page.locator('.read-block').first()).toBeVisible()
    // 글꼴·크기·바탕을 여는 톱니가 여기에도 있어야 한다
    await expect(page.locator('.read-rail-gear')).toBeAttached()
  })

  test('책을 끝까지 읽으면 닫는 글로 이어진다 — 30에서 끊기지 않는다', async ({ page }) => {
    await page.goto('/read/point/30')
    await expect(page.getByRole('link', { name: /옮기고 나서/ })).toBeVisible()
  })
})

/**
 * 지도가 읽는 자리를 따라간다 (River, 2026-08-19).
 *
 * 「패널이 뜨는 지도 화면은 스크롤 시에 '이 대목의 절'과 함께 움직이며 … 얼추 스크롤이
 * 되었을 때 해당 지도 위치를 함께 띄워주시오」.
 */
test.describe('지도가 따라온다', () => {
  test('「옆에」는 목차 아래로 들어가고, 절이 바뀌면 켜지는 지명이 바뀐다', async ({ page }) => {
    await page.goto(POINT)
    await page.evaluate(() => localStorage.setItem('read-map', 'side'))
    await page.reload()
    await page.waitForSelector('.read-block')

    // 목차와 한 몸이어야 스크롤을 같이 탄다
    await expect(page.locator('.read-rail .map-slot')).toBeVisible()

    const lit = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.point-map .at')].map((a) => a.getAttribute('href')).sort(),
      )

    const first = await lit()
    expect(first.length, '첫 절인데 켜진 지명이 없다').toBeGreaterThan(0)

    // 두 번째 절로 굴린다. `AppShell height="fill"`이라 구르는 것은 안쪽 칸이다
    await page.evaluate(() => {
      const heads = [...document.querySelectorAll('.read-block[id]')]
      heads[heads.length - 1]?.scrollIntoView({ block: 'start' })
    })
    await page.waitForTimeout(400)

    const second = await lit()
    expect(second, '절이 바뀌었는데 지도가 그대로다').not.toEqual(first)
  })

  /**
   * River가 화면을 보고 짚었다: 「지도를 사이드 패널에 두니까 이렇게 간격이 생기네?」
   *
   * 원인은 지도가 아니라 **그리드였다.** `grid-row: 1 / -1`은 명시 행이 없으면
   * `1 / 1`로 풀려서 레일이 1행 한 칸에 갇히고, 그 행이 레일 키만큼 늘어난다.
   * 레일이 짧을 때는 안 보이다가 지도가 들어가자 253px 빈 자리로 드러났다.
   */
  test('**첫 문단 아래가 안 벌어진다** — 레일이 1행을 늘리면 안 된다', async ({ page }) => {
    await page.goto('/read/point/1')
    await page.evaluate(() => localStorage.setItem('read-map', 'side'))
    await page.reload()
    await page.waitForSelector('.read-block')
    await page.waitForTimeout(400)

    const seen = await page.evaluate(() => {
      const grid = document.querySelector('.read-grid')!
      const row1 = parseFloat(getComputedStyle(grid).gridTemplateRows.split(' ')[0])
      const first = document.querySelector('.read-grid > .read-block')!.getBoundingClientRect()
      const rail = document.querySelector('.read-rail')!.getBoundingClientRect()
      return { row1, block: first.height, rail: rail.height }
    })
    // 1행은 첫 블록 높이여야 한다. 레일 키를 따라가면 그만큼이 통째로 빈 자리다
    expect(seen.rail, '지도가 레일에 안 들어갔다').toBeGreaterThan(seen.block)
    expect(
      seen.row1,
      `1행이 첫 블록(${seen.block})이 아니라 레일(${seen.rail})을 따라간다`,
    ).toBeLessThan(seen.block + 8)
  })

  test('레일이 본문 끝까지 따라온다 — 붙박이가 중간에 떨어지지 않는다', async ({ page }) => {
    await page.goto('/read/point/1')
    await page.evaluate(() => localStorage.setItem('read-map', 'side'))
    await page.reload()
    await page.waitForSelector('.read-block')

    /*
     * **끝까지 굴리면 안 된다.** 그리드가 페이지보다 먼저 끝나므로(아래에 딸린 자료와
     * 푸터가 있다) 맨 아래에서는 레일이 제 칸을 다 쓰고 놓여난다 — 그게 맞는 동작이다.
     * 여기서 볼 것은 **본문을 읽는 동안** 붙어 있는가다.
     */
    const top = await page.evaluate(async () => {
      const main = document.getElementById('astryx-app-shell-main')!
      main.scrollTop = Math.min(1500, main.scrollHeight - main.clientHeight - 400)
      await new Promise((r) => setTimeout(r, 250))
      return document.querySelector('.read-rail')!.getBoundingClientRect().top
    })
    // 붙어 있으면 화면 위쪽에 남는다(상단 바 아래). 흘러가면 음수로 한참 내려간다
    expect(top, '레일이 굴러가 버렸다').toBeGreaterThan(0)
    expect(top, '레일이 화면 아래에 있다').toBeLessThan(120)
  })

  test('모드를 되돌리면 지도가 본문 아래 제자리로 간다', async ({ page }) => {
    await page.goto(POINT)
    await page.evaluate(() => localStorage.setItem('read-map', 'side'))
    await page.reload()
    await page.waitForSelector('.read-rail .map-slot')

    await page.evaluate(() => {
      document.documentElement.dataset.map = 'bottom'
    })
    await expect(page.locator('.read-rail .map-slot')).toHaveCount(0)
    await expect(page.locator('.map-slot .point-map')).toBeVisible()
  })
})
