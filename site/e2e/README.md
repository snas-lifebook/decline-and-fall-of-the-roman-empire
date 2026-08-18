# E2E · 시각회귀 · 접근성

```bash
npx playwright test                    # 전부 (라이트·다크 두 벌)
npx playwright test e2e/read.spec.ts   # 한 파일
npx playwright test --update-snapshots # 화면을 일부러 바꿨을 때만
```

| 파일 | 무엇을 지키나 |
|---|---|
| `read.spec.ts` | 읽는 사람이 실제로 하는 일 — 본문·카드·목차·호버 지도·폰 바텀시트 |
| `settings.spec.ts` | 고른 설정이 **새로고침을 넘어 남는가**. 여덟 키를 하나씩 |
| `a11y.spec.ts` | axe. **새 위반이 늘지 않는 것**이 목표(헌장 5절을 옮김) |
| `visual.spec.ts` | 화면 골격 스크린샷. 기준선 32장 · 4.3MB |

## 이 기준선은 이 맥에서만 유효하다

`toHaveScreenshot`은 **OS 폰트 렌더링을 탄다.** 다른 기기에서 돌리면 전부 빨개진다.
CI를 붙이는 날 도커로 고정하는 것이 정석이고, 그날까지는 **1인 로컬 도구**다.
빨개졌을 때 「내가 뭘 바꿨나」와 「기기가 다른가」를 먼저 가른다.

## 결정론을 설정이 만든다

`playwright.config.ts`가 세 가지를 잡는다. **프로덕션 코드에 테스트용 훅을 하나도
안 심었다.**

- `contextOptions.reducedMotion` — `EgoGraph`가 그 분기에서 `s.tick(220)`을 동기로
  돌려 **가라앉은 좌표로 한 번에** 그린다. 카드 페이드도 이 분기에서 전부 선명해진다
- `colorScheme` 프로젝트 둘 — 저장값이 없으면 첫 페인트 스크립트가 `matchMedia`를 따른다
- 글꼴 — 자체 호스팅이라 CDN을 안 탄다. 찍기 전 `document.fonts.ready`만 기다린다

## 안 찍는 것

**`/changelog`.** `git log -- site`에서 만들어지므로 커밋할 때마다 화면이 바뀐다.
기준선을 걸면 매번 썩는다. 접근성 검사는 그 화면도 본다.

**전장(全長).** 읽기 화면 한 장이 5,000px이라 `fullPage`로 찍으면 파일이 수 MB고
문단 하나만 고쳐도 빨개진다. 화면 한 장 크기로 위쪽만 본다.

## 함정 둘 (실제로 밟았다)

**`serve -s`를 다시 넣지 말 것.** SPA 모드라 모든 경로에 `index.html`을 준다.
그러면 여기 있는 테스트가 전부 허브를 보고 초록이 된다. `read.spec.ts`의 첫 테스트가
그것만 막으려고 있다.

**`locator.evaluateAll`은 기다리지 않는다.** 그걸로 폰 카드 수를 셌더니 파일 전체를
돌릴 때만 13이 나오고 혼자 돌리면 0이 나왔다. `page.evaluate` 안에서 재면 안 흔들린다.
