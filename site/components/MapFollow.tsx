'use client'

import { useEffect } from 'react'

/**
 * 「옆에」 모드의 지도 — **읽는 자리를 따라간다.**
 *
 * River: 「패널이 뜨는 지도 화면은 스크롤 시에 '이 대목의 절'과 함께 움직이며 …
 * 얼추 스크롤이 되었을 때 해당 지도 위치를 함께 띄워주시오」.
 *
 * ## 앞 판이 왜 아니었나
 *
 * 「옆에」는 호버 패널을 그냥 띄워 둔 것이었다 — 오른쪽 **아래 구석에 고정**이라
 * 스크롤과 아무 관계가 없었고, 서른 개 지명이 처음부터 끝까지 똑같이 켜져 있어서
 * 지금 읽는 대목이 어디인지 말하지 않았다. River가 짚은 것이 정확히 그 둘이다.
 *
 * 지금은 오른쪽 패널(`ReadRail`) 안으로 들어간다. 그 패널이 이미 `sticky`라
 * **「이 대목의 절」과 한 몸으로 움직인다** — 붙이는 장치를 새로 만들지 않았다.
 *
 * ## 지도를 두 벌 만들지 않는다
 *
 * CSS로는 DOM을 옮길 수 없고, 두 자리에 각각 그리면 한쪽을 고칠 때 다른 쪽이 조용히
 * 어긋난다(이 레포가 반복해서 피해 온 일이다). 그래서 **있는 노드 하나를 옮긴다.**
 * 「옆에」가 아니면 원래 자리로 돌려놓는다.
 *
 * 설정이 바뀐 것은 `<html>`의 `data-map`을 보고 안다 — `MutationObserver` 하나면
 * 되고, `ReadSettings`의 내부(구독자 집합)를 몰라도 된다.
 *
 * ## 「해당 지도 위치」를 어떻게 아는가 — 데이터를 새로 굽지 않는다
 *
 * 절마다 지명 목록을 빌드 때 따로 만들 필요가 없다. **그 절의 본문에 이미 지명
 * 링크가 들어 있고**, 지도의 점과 **같은 주소**를 가리킨다(`MapHover`가 쓰는 그
 * 사실이다). 그래서 지금 절에 해당하는 블록만 훑어 `href`를 모으면 끝난다 —
 * 페이지에 한 글자도 안 는다.
 *
 * 켜진 절의 지명에 `.at`이 붙는다. 호버가 쓰는 `.lit`과 **일부러 다른 이름**이다 —
 * 같이 쓰면 마우스를 뗐을 때 호버 쪽이 절이 켜 둔 것까지 꺼 버린다.
 */
export function MapFollow() {
  useEffect(() => {
    const slot = document.querySelector<HTMLElement>('.map-slot')
    const rail = document.querySelector<HTMLElement>('.rail-map-slot')
    const map = document.querySelector<HTMLElement>('.point-map')
    if (!slot || !map) return

    // 돌아갈 자리를 기억해 둔다. 부모만 기억하면 딸린 자료 뒤로 밀린다
    const home = { parent: slot.parentElement!, before: slot.nextSibling }

    const place = () => {
      const side = document.documentElement.dataset.map === 'side'
      if (side && rail && slot.parentElement !== rail) rail.appendChild(slot)
      if (!side && slot.parentElement === rail) home.parent.insertBefore(slot, home.before)
      return side
    }

    /*
     * 지금 읽는 절 = **읽는 선(화면 위에서 35%)을 마지막으로 지나간 절 제목.**
     * 카드가 쓰는 띠(38~54%)보다 조금 위다 — 제목은 문단보다 먼저 지나가므로,
     * 제목이 선을 넘는 순간 그 절을 읽기 시작한 것으로 본다.
     */
    const LINE = 0.35
    let at: string | null = null
    let raf = 0

    const measure = () => {
      raf = 0
      if (!place()) return

      const heads = [...document.querySelectorAll<HTMLElement>('.read-block[id]')]
      if (!heads.length) return

      const line = window.innerHeight * LINE
      let now = heads[0]
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) now = h
      }
      if (now.id === at) return
      at = now.id

      /*
       * 그 절에 딸린 블록 = 이 제목부터 **다음 제목 전까지.** 제목 블록 자체에도
       * 지명이 있을 수 있어서 자기부터 센다.
       */
      const hrefs = new Set<string>()
      for (let el = now as Element | null; el; el = el.nextElementSibling) {
        if (el !== now && el.matches('.read-block[id]')) break
        if (!el.matches('.read-block')) continue
        for (const a of el.querySelectorAll('a[href^="/objects/place/"]')) {
          hrefs.add(a.getAttribute('href')!)
        }
      }

      map.querySelectorAll('.at').forEach((el) => el.classList.remove('at'))
      for (const href of hrefs) {
        const esc = CSS.escape(href)
        // 묶인 지명은 자기 점이 없다 — 흡수한 대표가 `data-also`에 주소를 갖고 있다
        map.querySelector(`a[href="${esc}"], a[data-also~="${esc}"]`)?.classList.add('at')
      }
      // 이 절에 지명이 하나도 없으면 아무것도 안 흐린다. 빈 지도를 내는 것보다 낫다
      map.dataset.follow = hrefs.size ? 'yes' : 'none'
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    // 구르는 것은 `window`가 아니다 — `AppShell height="fill"`이라 안쪽 칸이 구른다
    let scroller: HTMLElement | Window = window
    for (let el = slot.parentElement; el; el = el.parentElement) {
      if (
        el.scrollHeight > el.clientHeight + 40 &&
        /(auto|scroll)/.test(getComputedStyle(el).overflowY)
      ) {
        scroller = el
        break
      }
    }

    // 설정이 바뀌면 자리부터 다시 잡는다. 절 계산은 그다음이다
    const watch = new MutationObserver(() => {
      at = null
      onScroll()
    })
    watch.observe(document.documentElement, { attributeFilter: ['data-map'] })

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      watch.disconnect()
      scroller.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      // 자리를 되돌려 놓고 나간다 — 안 그러면 다른 화면으로 갔다가 돌아왔을 때 꼬인다
      if (slot.parentElement === rail) home.parent.insertBefore(slot, home.before)
    }
  }, [])

  return null
}
