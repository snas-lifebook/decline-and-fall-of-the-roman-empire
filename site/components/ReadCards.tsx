'use client'

import { useEffect, useState } from 'react'

/**
 * 여백 카드의 두 가지 움직임 — **읽는 자리에서 또렷해지는 것**과 **좁은 화면에서
 * 아래에서 올라오는 것**.
 *
 * 한 파일에 둔 이유: 둘 다 `.read-card`가 무엇이고 본문 링크와 어떻게 짝지어지는지를
 * 알아야 한다. 나누면 그 지식이 두 벌이 된다.
 *
 * ## 무엇으로 「읽는 자리」를 아는가
 *
 * `IntersectionObserver`로 먼저 만들었다가 **틀려서 걷어냈다** — 카드가 띠를 건너뛰면
 * 상태가 안 바뀌어 콜백이 아예 안 온다(아래 주석에 실측). 지금은 굴릴 때마다 `rAF`로
 * 묶어 열세 장 위치를 다시 잰다. 재는 것만 하고 고치지 않아 레이아웃이 다시 돌지 않고,
 * 칠하는 것이 `opacity`·`transform`뿐이라 합성 스레드에서 끝난다.
 *
 * ## 왜 CSS 스크롤 애니메이션이 아닌가
 *
 * `animation-timeline: view()`가 이 일에 딱 맞고 JS가 0줄이지만 **파이어폭스가 아직
 * 지원하지 않는다**(2026-08 기준 Chrome 115+·Safari 26+, Firefox는 pref 뒤). 두 벌을
 * 만드는 것은 이 프로젝트가 반복해서 피해 온 일이라 한 벌로 간다.
 *
 * ## 좁은 화면 — 카드를 옮기지 않고 그 자리에서 띄운다
 *
 * 카드 HTML은 **이미 빌드 때 다 그려져 있다.** 복제해서 새 상자에 담으면 두 벌이
 * 되므로, 그 카드에 `data-open`을 달고 CSS가 아래에서 올라오게 한다. 카드가 원래
 * `<a>`라 눌러서 객체 화면으로 가는 것도 그대로 된다.
 */

export function ReadCards() {
  const [sheet, setSheet] = useState(false)

  // ── 읽는 자리에서 또렷하게 ────────────────────────────────
  useEffect(() => {
    const cards = [...document.querySelectorAll<HTMLElement>('.read-grid > .read-card')]
    if (!cards.length) return

    // 「움직임 줄이기」를 켠 사람에게는 아무것도 안 한다 — 전부 또렷한 채로 남는다.
    // `EgoGraph`·`MapHover`가 하는 것과 같은 예우다
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /*
     * **`IntersectionObserver`를 안 쓴다.** 먼저 그걸로 만들었는데 카드가 띠를
     * **건너뛰면 콜백이 아예 안 온다** — 안 걸침 → 안 걸침이라 상태가 안 바뀌기
     * 때문이다. 실측에서 깊이 굴려도 「지나감」이 13장 중 1장뿐이었고, 나머지는
     * 화면 위로 사라진 채 「아직 안 옴」으로 남아 있었다. 빠르게 튕겨 굴리면 실제
     * 사용자에게도 그대로 난다.
     *
     * 그래서 **굴릴 때 열세 장 위치를 다시 잰다.** `rAF`로 프레임당 한 번으로 묶으면
     * 열세 번의 `getBoundingClientRect`인데, 이건 재는 것만 하고 고치는 것이 없어서
     * 레이아웃을 다시 돌리지 않는다. 칠하는 것도 `opacity`·`transform`뿐이라 합성
     * 스레드에서 끝난다.
     */
    const band = { top: 0.38, bottom: 0.54 }
    let raf = 0

    const measure = () => {
      raf = 0
      const h = window.innerHeight
      const top = h * band.top
      const bottom = h * band.bottom
      for (const el of cards) {
        const r = el.getBoundingClientRect()
        // 카드가 띠에 걸쳐 있으면 읽는 중이다
        el.dataset.at = r.bottom < top ? 'past' : r.top > bottom ? 'ahead' : 'lit'
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    /*
     * **구르는 것은 `window`가 아니다.** `AppShell height="fill"`이라 문서 자체는 안
     * 구르고 `#astryx-app-shell-main`이 구른다(실측: `document.scrollHeight === innerHeight`).
     * 그래서 `window`에만 걸면 아무 일도 안 일어난다. 아이디를 박지 않고 조상 중
     * 실제로 구르는 것을 찾는다 — astryx가 이름을 바꿔도 안 깨진다.
     */
    let scroller: HTMLElement | Window = window
    for (let el = cards[0].parentElement; el; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
        scroller = el
        break
      }
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // ── 좁은 화면 — 이름을 누르면 아래에서 올라온다 ──────────
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 1100px)')

    const close = () => {
      document.querySelectorAll('.read-card[data-open]').forEach((c) => {
        delete (c as HTMLElement).dataset.open
      })
      delete document.documentElement.dataset.sheet
      setSheet(false)
    }

    const onClick = (ev: MouseEvent) => {
      if (!narrow.matches) return
      const a = (ev.target as Element | null)?.closest?.('a[href^="/objects/"]')
      if (!a || a.classList.contains('read-card')) return

      /*
       * 본문 링크와 카드가 **같은 주소**를 가리킨다 — 둘 다 `entityHref`를 쓰기
       * 때문이다. 그래서 `data-*`를 새로 심을 것이 없다. `MapHover`가 지도 마커를
       * 찾는 방식과 같다(그쪽은 이 짝이 어긋나서 한 번 크게 데었다).
       */
      const href = a.getAttribute('href')!
      const card = document.querySelector<HTMLElement>(
        `.read-grid > .read-card[href="${CSS.escape(href)}"]`,
      )
      // 카드가 없는 링크는 그냥 그 화면으로 간다. 47개 중 카드가 붙는 것은 14개다
      if (!card) return

      ev.preventDefault()
      close()
      card.dataset.open = 'yes'
      document.documentElement.dataset.sheet = 'yes'
      setSheet(true)
    }

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close()
    }

    const body = document.querySelector('.read-grid') ?? document.body
    body.addEventListener('click', onClick as EventListener)
    document.addEventListener('keydown', onKey)
    return () => {
      body.removeEventListener('click', onClick as EventListener)
      document.removeEventListener('keydown', onKey)
      close()
    }
  }, [])

  if (!sheet) return null

  /*
   * 덮개 겸 닫기. **카드 자체는 링크로 남겨 둔다** — 눌러서 객체 화면으로 가는 것이
   * 「자세히」에 해당한다. 그래서 시트 안에 단추를 더 넣지 않는다.
   */
  return (
    <button
      type="button"
      className="read-sheet-scrim"
      aria-label="닫기"
      onClick={() => {
        document.querySelectorAll('.read-card[data-open]').forEach((c) => {
          delete (c as HTMLElement).dataset.open
        })
        delete document.documentElement.dataset.sheet
        setSheet(false)
      }}
    />
  )
}
