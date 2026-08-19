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

  /**
   * **재는 자리를 틀리면 안 된다.**
   *
   * 앞 판은 `.doc`을 쟀고 그건 잘 커졌다. 그런데 정작 **본문 문단은 16px에 고정**되어
   * 있어서 슬라이더를 142%로 올려도 글자가 안 커졌다(실측 2026-08-19: `.doc`
   * 22.72px / 문단 16px). 테스트가 결함을 초록으로 통과시킨 것이다 — 글꼴 때와
   * 같은 사고다. 이제 **사람이 실제로 읽는 글자**를 잰다.
   */
  test('**글자 크기가 본문 문단까지 닿는다** — `.doc`만 커지는 것은 안 커진 것이다', async ({
    page,
  }) => {
    await page.goto(POINT)
    await page.waitForSelector('.read-block')
    const para = () =>
      page.evaluate(
        () =>
          parseFloat(
            getComputedStyle(document.querySelector('.read-block .astryx-markdown-paragraph')!)
              .fontSize,
          ),
      )

    const before = await para()
    await page.evaluate(() => localStorage.setItem('read-size', '1.42'))
    await page.reload()
    await page.waitForSelector('.read-block')
    const after = await para()

    expect(after, `문단이 ${before}px에서 그대로다`).toBeGreaterThan(before + 3)
  })

  test('기본 크기가 16px보다 크다 — River가 「1~2포인트 크게」라고 했다', async ({ page }) => {
    await page.goto(POINT)
    await page.waitForSelector('.read-block')
    const px = await page.evaluate(() =>
      parseFloat(
        getComputedStyle(document.querySelector('.read-block .astryx-markdown-paragraph')!).fontSize,
      ),
    )
    expect(px).toBeGreaterThan(16.5)
    expect(px, '너무 키우면 한 줄에 들어가는 글자가 줄어 오히려 읽기 나쁘다').toBeLessThan(19)
  })

  /** River: 「`-` `=` 로 오른쪽 상단에서 설정할 수 있도록」 */
  test('상단 바에서 크기를 바꾸고, `-` `=` 키로도 바뀐다', async ({ page }) => {
    await page.goto(POINT)
    await page.waitForSelector('.read-size')
    const scale = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--read-scale').trim(),
      )

    const start = await scale()
    await page.locator('.read-size button').last().click()
    const bigger = await scale()
    expect(Number(bigger), '단추로 안 커졌다').toBeGreaterThan(Number(start))

    await page.keyboard.press('-')
    expect(Number(await scale()), '`-` 키로 안 작아졌다').toBe(Number(start))

    await page.keyboard.press('=')
    expect(Number(await scale()), '`=` 키로 안 커졌다').toBeGreaterThan(Number(start))
  })

  test('글을 쓰는 중에는 `-`가 안 듣는다 — 하이픈을 치는 사람 화면이 커지면 안 된다', async ({
    page,
  }) => {
    await page.goto(POINT)
    await page.waitForSelector('.leave-line-form input')
    const scale = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--read-scale').trim(),
      )

    const before = await scale()
    const input = page.locator('.leave-line-form input:not([aria-hidden])').first()
    await input.click()
    await input.type('가-나=다')

    expect(await scale(), '입력 중에 화면이 커졌다').toBe(before)
    await expect(input).toHaveValue('가-나=다')
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

/**
 * River 2026-08-19: 「각 폰트 미리보기가 가능해야 하고, 개체들이 속성을 벗어나면 안 된다」.
 *
 * 둘은 한 병의 두 증상이었다 — 글꼴 넷도, 카드 여섯도, 지명 아홉도 300px 패널에
 * 가로 한 줄로 밀어 넣으려 했다.
 */
test.describe('설정 패널이 제 그릇 안에 있다', () => {
  test('글꼴 넷이 각자의 글꼴로 그려진다 — 이름만 보고 고르지 않는다', async ({ page }) => {
    await page.goto(POINT)
    await page.click('.read-rail-gear')
    await page.waitForSelector('.font-pick')
    await page.evaluate(() => document.fonts.ready)

    const fonts = await page.evaluate(() =>
      [...document.querySelectorAll('.font-pick')].map((el) => ({
        // 이름표·예문까지 그 글꼴이어야 미리보기다. 컨테이너만 칠하면 상속이 안 닿는다
        deep: [...el.querySelectorAll('*')].map(
          (c) => getComputedStyle(c).fontFamily.split(',')[0],
        ),
      })),
    )
    expect(fonts).toHaveLength(4)
    const heads = fonts.map((f) => f.deep[0])
    expect(heads, '견본이 다 같은 글꼴로 나온다').toEqual([
      'Pretendard',
      'MaruBuri',
      'RIDIBatang',
      'NotoSansKR',
    ])
    for (const f of fonts) {
      expect(new Set(f.deep).size, '한 줄 안에서 글꼴이 갈렸다').toBe(1)
    }
  })

  test('노트북 화면에서도 패널이 화면 밖으로 안 나간다', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 800 })
    await page.goto(POINT)
    await page.click('.read-rail-gear')
    await page.waitForSelector('.read-settings')

    const fit = await page.evaluate(() => {
      const s = document.querySelector('.read-settings')!
      const panel = s.parentElement!
      const b = panel.getBoundingClientRect()
      const out = [...panel.querySelectorAll('*')].filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && (r.right > b.right + 1 || r.left < b.left - 1)
      })
      return {
        bottom: Math.round(b.bottom),
        right: Math.round(b.right),
        h: window.innerHeight,
        w: window.innerWidth,
        escaped: out.map((el) => (el.textContent ?? '').slice(0, 14)),
      }
    })
    expect(fit.escaped, '패널 밖으로 나간 것이 있다').toEqual([])
    expect(fit.bottom, '패널 아래가 화면 밖이다').toBeLessThanOrEqual(fit.h)
    expect(fit.right, '패널 오른쪽이 화면 밖이다').toBeLessThanOrEqual(fit.w)
  })
})

/**
 * 푸터와 한 줄 남기기 (River, 2026-08-19).
 *
 *   「맨 아래 이게 뭔가 본문이랑 같이 붙어 있는 느낌을 받아서 구분이 잘 되지 않는다」
 *   「한줄 남기기 인터렉션이랄까 디자인이 뭔가 너무 쌩뚱맞다」
 */
test.describe('맨 아래', () => {
  test('푸터가 본문과 다른 바탕·다른 글꼴이다', async ({ page }) => {
    await page.goto(POINT)
    const seen = await page.evaluate(() => {
      const band = document.querySelector('.site-footer')!
      const cs = getComputedStyle(band)
      const doc = document.querySelector('.doc')!
      return {
        bg: cs.backgroundColor,
        border: cs.borderTopWidth,
        pad: parseFloat(cs.paddingTop),
        footFont: getComputedStyle(document.querySelector('footer')!).fontFamily.split(',')[0],
        docFont: getComputedStyle(doc).fontFamily.split(',')[0],
        // 띠는 본문 칸보다 넓다 — 그게 「다른 섹션」으로 읽히는 첫 신호다
        wider: band.getBoundingClientRect().width > doc.getBoundingClientRect().width,
      }
    })
    expect(seen.bg, '푸터에 바탕색이 없다').not.toBe('rgba(0, 0, 0, 0)')
    expect(parseFloat(seen.border), '푸터 위에 경계가 없다').toBeGreaterThan(0)
    expect(seen.pad, '푸터가 본문에 붙어 있다').toBeGreaterThanOrEqual(32)
    expect(seen.wider, '푸터가 본문과 같은 폭이다').toBe(true)
  })

  test('본문을 명조로 키워도 푸터는 안 따라간다 — 읽는 글이 아니라 안내판이다', async ({
    page,
  }) => {
    await page.goto(POINT)
    await page.evaluate(() => {
      localStorage.setItem('read-font', 'maruburi')
      localStorage.setItem('read-size', '1.42')
    })
    await page.reload()
    await page.waitForSelector('.read-block')
    await page.evaluate(() => document.fonts.ready)

    const f = await page.evaluate(() => ({
      doc: getComputedStyle(document.querySelector('.doc')!).fontFamily.split(',')[0],
      foot: getComputedStyle(document.querySelector('footer')!).fontFamily.split(',')[0],
    }))
    expect(f.doc).toBe('MaruBuri')
    expect(f.foot, '푸터까지 명조가 됐다').toBe('Pretendard')
  })

  test('한 줄 남기기가 늘 열려 있고 열고 닫느라 화면이 안 튄다', async ({ page }) => {
    await page.goto(POINT)
    const input = page.locator('.leave-line-form input:not([aria-hidden])').first()
    await expect(input).toBeVisible()

    // 앞 판은 단추를 누르면 상자가 펼쳐지며 푸터 높이가 튀었다
    const before = await page.evaluate(() => document.querySelector('footer')!.scrollHeight)
    await input.fill('테스트로 한 줄 씁니다')
    const after = await page.evaluate(() => document.querySelector('footer')!.scrollHeight)
    expect(after, '글을 쓰자 푸터 높이가 바뀌었다').toBe(before)
  })
})
