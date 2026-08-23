'use client'

import { useState, type ReactNode } from 'react'

/**
 * AI 연결 안내 — 두 앱(ChatGPT·Claude) 절차를 알약 토글로 하나씩 보여준다.
 *
 * 앞 판은 `content/start/ai.md`가 두 절차를 세로로 쌓았다. ChatGPT만 쓰는 사람은
 * Claude 절차를 지나쳐 스크롤해야 했다. learn.chatgpt·애플 퀵스타트처럼 **쓰는
 * 앱만 골라 보게** 하고, 마크다운 번호 목록 대신 동그라미 번호 스텝으로 세운다(River #15).
 *
 * 토글이 어느 절차를 보일지 정하므로 상태가 필요하다 — 그래서 이 조각만 클라이언트다.
 * 페이지 산문·링크는 서버(`app/start/ai/page.tsx`)에 남는다.
 */
export type Step = { text: ReactNode; img?: string; alt?: string }
export type Platform = { id: string; label: string; steps: Step[] }

export function PlatformSteps({ platforms }: { platforms: Platform[] }) {
  const [active, setActive] = useState(platforms[0]?.id)
  const cur = platforms.find((p) => p.id === active) ?? platforms[0]

  return (
    <div className="platform">
      <div className="platform-toggle" role="tablist" aria-label="연결할 앱">
        {platforms.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === cur.id}
            className="platform-pill"
            data-active={p.id === cur.id}
            onClick={() => setActive(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <ol className="steps">
        {cur.steps.map((s, i) => (
          <li key={i} className="step">
            <span className="step-num" aria-hidden>
              {i + 1}
            </span>
            <div className="step-body">
              <div className="step-text">{s.text}</div>
              {s.img ? (
                // eslint-disable-next-line @next/next/no-img-element -- 정적 export라 next/image 최적화가 안 돌고, 안내 스크린샷은 리사이즈할 게 없다 (LinkCards와 동일)
                <img className="step-shot" src={s.img} alt={s.alt ?? ''} loading="lazy" />
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
