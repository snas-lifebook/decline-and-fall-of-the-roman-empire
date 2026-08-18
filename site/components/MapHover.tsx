'use client'

import { useEffect } from 'react'

/**
 * 본문에서 지명에 마우스를 올리면 지도가 뜨고, 그 자리가 켜진다.
 *
 * ## 왜 호버인가
 *
 * 지도를 맨 아래 두면 다 읽고 나서야 보이고(River 지적), 맨 위에 두면 읽는 동안
 * 화면 밖으로 나간다. 호버는 **물어볼 때만 답한다** — 안 물으면 아무 일도 안 일어난다.
 * 그래서 이것이 **기본값**이다.
 *
 * 여기 원래 「스크롤을 따라 지도를 바꾸면 시야 한쪽이 움직여 어지럽다」고 적어 뒀는데,
 * River가 2026-08-19에 정확히 그것을 요청했다. 기본값은 그대로 두고 **「옆에」 모드가
 * 그 일을 한다**(`MapFollow`) — 고르는 사람만 치르게 하는 것이 답이었다.
 *
 * ## 배선이 공짜인 이유
 *
 * 본문의 지명 링크와 지도 마커가 **같은 주소**를 가리킨다
 * (`/objects/place/%EB%A1%9C%EB%A7%88`). `linkifyWikilinks`와 `renderPointMap`이
 * 둘 다 `entitySlug`를 쓰기 때문이다. 그래서 `data-*`를 새로 심을 것이 없다 —
 * **href로 짝을 찾는다.**
 *
 * ## 어지럽지 않게 하려고 정한 것들
 *
 *   - 패널이 **커서를 안 따라간다.** 오른쪽 아래 고정이다. 따라다니면 글자를 가리고
 *     눈이 계속 쫓아가야 한다
 *   - **늦게 뜨고 늦게 사라진다**(120ms / 260ms). 글을 훑다 커서가 스쳐 지나갈 때마다
 *     깜빡이면 그게 제일 거슬린다. 사라질 때 여유를 두는 것은 가까운 지명 두 개를
 *     번갈아 볼 때 패널이 껌뻑이지 않게 하려는 것이다
 *   - **「움직임 줄이기」를 존중한다.** 그 설정을 켠 기기에서는 페이드가 없다
 *   - 키보드로 탭해서 지명에 닿아도 똑같이 뜬다
 */
export function MapHover() {
  useEffect(() => {
    const pop = document.querySelector<HTMLElement>('.point-map')
    if (!pop) return

    let lit: Element | null = null
    let showTimer: number | undefined
    let hideTimer: number | undefined

    const clear = () => {
      lit?.classList.remove('lit')
      lit = null
    }

    const show = (href: string) => {
      window.clearTimeout(hideTimer)
      // 이미 그 자리가 켜져 있으면 아무것도 안 한다 — 같은 링크 위에서 마우스가
      // 조금 움직일 때마다 다시 그리면 깜빡인다
      /*
       * `data-also`도 같이 본다. 붙어 있는 지명은 한 점으로 묶이므로(`clusterPlaces`),
       * `아프리카`처럼 대표에 흡수된 것은 자기 `href`를 가진 점이 지도에 없다. 묶을 때
       * 그 주소를 대표 점에 적어 뒀으니 여기서 그걸로도 찾는다 — **안 그러면 본문에서
       * 마우스를 올려도 아무 일이 안 일어난다.**
       */
      const esc = CSS.escape(href)
      const pin = pop.querySelector(`a[href="${esc}"], a[data-also~="${esc}"]`)
      if (!pin || pin === lit) return
      clear()
      pin.classList.add('lit')
      lit = pin
      pop.dataset.on = 'yes'
    }

    const hide = () => {
      window.clearTimeout(showTimer)
      hideTimer = window.setTimeout(() => {
        delete pop.dataset.on
        clear()
      }, 260)
    }

    const onOver = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="/objects/place/"]')
      // 지도 안의 마커에 올린 것은 무시한다. 이미 보고 있는 화면이다
      if (!a || pop.contains(a)) return
      const href = a.getAttribute('href')!
      window.clearTimeout(showTimer)
      showTimer = window.setTimeout(() => show(href), 120)
    }

    const onOut = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="/objects/place/"]')
      if (a && !pop.contains(a)) hide()
    }

    const body = document.querySelector('.read-grid') ?? document.body
    body.addEventListener('mouseover', onOver)
    body.addEventListener('mouseout', onOut)
    body.addEventListener('focusin', onOver)
    body.addEventListener('focusout', onOut)
    // 패널 위에 마우스를 올리면 안 사라진다 — 지도에서 다른 지명을 눌러 갈 수 있게
    pop.addEventListener('mouseenter', () => window.clearTimeout(hideTimer))
    pop.addEventListener('mouseleave', hide)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
      body.removeEventListener('mouseover', onOver)
      body.removeEventListener('mouseout', onOut)
      body.removeEventListener('focusin', onOver)
      body.removeEventListener('focusout', onOut)
    }
  }, [])

  return null
}
