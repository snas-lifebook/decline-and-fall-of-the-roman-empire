'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 숫자가 올라오며 자리를 잡는다 — 플립클락 느낌(River #25).
 *
 * **SSR·무자바 안전**: 최종 값을 그대로 낸다(Ctrl+F·SEO). 하이드레이션 뒤 **한 번만**
 * 0→n으로 짧게 count-up(easeOutCubic). `tabular-nums`라 세는 동안 자리폭이 안 흔들린다.
 * 「줄여서 읽는 사람」을 위해 `prefers-reduced-motion`이면 애니메이션을 건너뛴다.
 */
export function FlipNumber({ n }: { n: number }) {
  const [v, setV] = useState(n)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const dur = 900
    const start = performance.now()
    setV(0)
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setV(Math.round(n * e))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setV(n)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [n])

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toLocaleString()}</span>
}
