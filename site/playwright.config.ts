import { defineConfig, devices } from '@playwright/test'

/**
 * E2E와 시각회귀.
 *
 * `output: 'export'` 사이트라 `next start`가 안 된다. `out/`을 정적 서버로 띄운다
 * (Next.js 16 static export — `next start`는 서버 모드 전용).
 *
 * ## `serve -s`를 걷어냈다 — 이게 있으면 모든 테스트가 무의미하다
 *
 * 앞 판은 `npx serve out -l 3000 -s`였다. **`-s`는 SPA 모드라 모든 경로에
 * `index.html`을 준다.** 2026-08-18에 이걸로 카드를 세다가 0장이 나왔는데, 브라우저가
 * 내내 허브를 보고 있었기 때문이다. e2e를 붙이면 첫 테스트부터 허브를 찍는다.
 *
 * 레포에 이미 올바른 서버가 있다 — `serve.mjs` 12줄이 `out/u` → `out/u.html` →
 * `out/u/index.html` 순으로 찾는다. `npx` 내려받기도 없앤다.
 *
 * ## 결정론을 설정이 만든다
 *
 * 시각회귀는 화면이 매번 같아야 쓸모가 있다. 흔들리는 것 셋을 **전부 이미 있는
 * 수단으로** 잡았다 — 프로덕션 코드에 `data-testid`도 `window.__ready`도 안 심었다.
 *
 *   - `reducedMotion: 'reduce'` — `EgoGraph`가 그 분기에서 `s.tick(220)`을 동기로
 *     돌리고 **가라앉은 좌표로 한 번에** 그린다. 「움직임 줄이기」를 위해 넣어둔
 *     경로가 그대로 테스트 훅이 된다. 카드 페이드도 이 분기에서 전부 선명해진다
 *   - `colorScheme` — 저장값이 없으면 첫 페인트 스크립트가 `matchMedia`를 따른다.
 *     프로젝트 둘로 라이트·다크 두 벌을 찍는다
 *   - 글꼴 — 자체 호스팅이라 CDN을 안 탄다(2026-08-18). 이 설정이 만든 것이 아니라
 *     그 작업이 덤으로 준 안정성이다
 *
 * ## 이 기준선은 이 맥에서만 유효하다
 *
 * `toHaveScreenshot`은 OS 폰트 렌더링을 탄다. 다른 기기에서 돌리면 전부 빨개진다.
 * CI를 붙이는 날 도커로 고정하는 것이 정석이고, 그날까지는 **1인 로컬 도구**다.
 */
export default defineConfig({
  testDir: './e2e',
  // 시각회귀는 서로 밀면 스크린샷이 흔들린다. 한 번에 하나씩
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  webServer: {
    command: 'node serve.mjs',
    url: 'http://localhost:4400',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4400',
    /*
     * 이 한 줄이 `EgoGraph`의 220프레임 시뮬레이션을 결정론으로 만든다.
     *
     * **`use.reducedMotion`이 아니라 `contextOptions` 안이다.** 1.62.1의
     * `PlaywrightTestOptions`에는 `reducedMotion`이 타입으로 안 올라와 있어(문서
     * 예제에는 있는데 선언이 없다) 위에 쓰면 `tsc`가 막는다. `contextOptions`는
     * `BrowserContextOptions`를 그대로 받으므로 여기 두면 타입도 동작도 맞는다.
     */
    contextOptions: { reducedMotion: 'reduce' },
  },
  expect: {
    // 글꼴 안티에일리어싱이 몇 픽셀씩 흔들린다. 0으로 두면 매번 빨개진다
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    {
      name: 'light',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', colorScheme: 'light' },
    },
    {
      name: 'dark',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', colorScheme: 'dark' },
    },
  ],
})
