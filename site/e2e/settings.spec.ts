import { test, expect } from '@playwright/test'

/**
 * 읽기 설정 — **고른 것이 새로고침을 넘어 남는가.**
 *
 * 이 파일이 있는 이유: `read-map`이 실제로 안 남았다(2026-08-18 발견). 첫 페인트
 * 스크립트가 `theme`과 `cards`만 칠하고 지도를 빠뜨려서, 「본문 아래」를 골라둔
 * 사람이 새로고침하면 **단추는 그대로인데 화면은 호버로 돌아가 있었다.**
 *
 * 설정이 여덟 개로 늘었으므로 같은 사고가 날 자리도 여덟 배다. 값을 바꾸고 →
 * 새로고침하고 → 그대로인지 보는 것을 **키마다** 돌린다.
 */

const POINT = '/read/point/5'

/** `[저장 키, data 속성, 넣어볼 값]` — `lib/read/boot.ts`의 `PAINTED`와 짝이다 */
const KEYS: [string, string, string][] = [
  ['read-cards', 'cards', 'person group'],
  ['read-map', 'map', 'bottom'],
  ['read-font', 'font', 'maruburi'],
  ['read-size', 'size', '1.26'],
  ['read-tone', 'tone', 'sepia'],
  ['read-focus', 'focus', 'on'],
  ['read-rail', 'rail', 'off'],
  ['read-layers', 'layers', 'city'],
]

test.describe('설정이 새로고침을 넘어 남는다', () => {
  for (const [key, attr, value] of KEYS) {
    test(`${key} — 고른 값이 첫 페인트에 다시 칠해진다`, async ({ page }) => {
      await page.goto(POINT)
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value])
      await page.reload()
      await page.waitForSelector('.read-block')

      const got = await page.evaluate((a) => document.documentElement.dataset[a], attr)
      expect(got, `${key} 를 골랐는데 새로고침하면 ${got} 가 된다`).toBe(value)
    })
  }

  test('**글자 크기는 CSS 변수까지 칠한다** — 속성만으로는 글자가 안 커진다', async ({ page }) => {
    await page.goto(POINT)
    await page.evaluate(() => localStorage.setItem('read-size', '1.42'))
    await page.reload()
    await page.waitForSelector('.doc')

    const size = await page.evaluate(() => getComputedStyle(document.querySelector('.doc')!).fontSize)
    expect(parseFloat(size), '본문이 안 커졌다').toBeGreaterThan(20)
  })

  test('저장이 막혀도 화면이 안 죽는다 — 사생활 모드', async ({ page, context }) => {
    // 어두운 기기를 쓰는 사람이 밝은 화면을 받았던 사고가 여기서 났다(2026-08-17 검수)
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('blocked')
        },
      })
    })
    await page.goto(POINT)
    await expect(page.locator('.read-block').first()).toBeVisible()
    // 속성이 하나도 안 붙어도 기본값으로 다 보여야 한다
    const cards = await page.evaluate(
      () =>
        [...document.querySelectorAll('.read-grid > .read-card')].filter(
          (c) => getComputedStyle(c).display !== 'none',
        ).length,
    )
    expect(cards, '저장이 막히니 카드가 사라졌다').toBeGreaterThan(0)
  })
})

test.describe('설정을 만져서 화면이 바뀐다', () => {
  test('글꼴을 바꾸면 본문 글꼴이 바뀌고 카드는 안 바뀐다', async ({ page }) => {
    await page.goto(POINT)
    const bodyFont = () =>
      page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector('.read-block .astryx-markdown-paragraph')!,
          ).fontFamily.split(',')[0],
      )
    const cardFont = () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector('.read-card-name')!).fontFamily.split(',')[0],
      )

    expect(await bodyFont()).toBe('Pretendard')
    await page.evaluate(() => {
      document.documentElement.dataset.font = 'maruburi'
    })
    await page.evaluate(() => document.fonts.ready)

    expect(await bodyFont(), '본문 글꼴이 안 바뀌었다').toBe('MaruBuri')
    // 읽는 글과 조작하는 물건을 글꼴로도 가른다
    expect(await cardFont(), '카드까지 명조가 됐다').toBe('Pretendard')
  })

  test('지도 레이어를 끄면 그 종류가 사라진다', async ({ page }) => {
    await page.goto(POINT)
    const visible = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll('.point-map a[data-kind]')].filter(
            (a) => getComputedStyle(a).display !== 'none',
          ).length,
      )

    await page.evaluate(() => {
      document.documentElement.dataset.layers = 'city building battlefield island mountain cape'
    })
    const withDefaults = await visible()

    await page.evaluate(() => {
      document.documentElement.dataset.layers = 'city'
    })
    const cityOnly = await visible()

    expect(cityOnly, '레이어를 좁혔는데 점 수가 그대로다').toBeLessThan(withDefaults)
  })

  test('**집중해서 읽기에 눈에 보이는 탈출구가 있다** — River가 못 나갔던 자리', async ({
    page,
  }) => {
    /*
     * 집중 모드가 상단 바·좌패널·오른쪽 패널을 통째로 숨기므로 **그 설정을 연
     * 톱니까지 같이 사라진다.** Esc만 있으면 그걸 아는 사람만 나갈 수 있고, 「Esc로
     * 돌아옵니다」라는 안내문마저 숨겨진 설정 패널 안에 있었다.
     */
    await page.goto(POINT)
    await page.evaluate(() => localStorage.setItem('read-focus', 'on'))
    await page.reload()
    await page.waitForSelector('.read-block')

    const exit = page.locator('.focus-exit button')
    await expect(exit, '나갈 단추가 없다').toBeVisible()
    await exit.click()

    await expect(page.locator('.read-rail')).toBeVisible()
    // 나간 것이 기억돼야 한다. 새로고침에 다시 갇히면 나간 게 아니다
    await page.reload()
    await page.waitForSelector('.read-block')
    await expect(page.locator('.read-rail')).toBeVisible()
  })

  test('집중해서 읽기가 좌우를 접고 Esc로 돌아온다', async ({ page }) => {
    await page.goto(POINT)
    await page.evaluate(() => {
      document.documentElement.dataset.focus = 'on'
    })
    // 접히는 것은 CSS라 하이드레이션과 무관하게 바로 된다
    await expect(page.locator('.read-rail')).toBeHidden()

    /*
     * **Esc는 하이드레이션이 끝나야 듣는다.** `ReadCards`의 keydown 리스너가 받는데,
     * 그 전에 누르면 아무 일도 안 일어난다. 한 번만 누르고 기다리면 **바쁜 기기에서만
     * 빨개지는 테스트**가 된다 — 실제로 혼자 돌리면 통과하고 전체를 돌리면 실패했다
     * (2026-08-18).
     *
     * 될 때까지 누른다. Esc는 여러 번 눌러도 해로운 것이 없다.
     */
    await expect
      .poll(
        async () => {
          await page.keyboard.press('Escape')
          return page.locator('.read-rail').isVisible()
        },
        { timeout: 5000, message: '하이드레이션이 끝나도 Esc가 안 듣는다' },
      )
      .toBe(true)
  })
})
