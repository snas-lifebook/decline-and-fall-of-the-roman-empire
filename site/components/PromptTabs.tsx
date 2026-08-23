'use client'

import { useId, useState } from 'react'

/**
 * 프롬프트 예시를 입력창처럼 보여주고 탭으로 넘긴다 (#16).
 *
 * learn.chatgpt「Send your first message」를 옮겼다 — 알약 탭 한 줄 + 그 아래
 * 컴포저 꼴 상자. 탭을 누르면 상자 안 프롬프트가 바뀐다. 상자·링·원형 단추는
 * 피드백 컴포저(`FeedbackBox`·globals.css `.feedback-*`)와 같은 토큰이라 한 식구로
 * 읽힌다 — 다른 것은 오른쪽 원형 단추가 보내기가 아니라 **복사**라는 것뿐. 실제로
 * 보내는 창이 아니라 「이렇게 씁니다」를 보여주는 자리라, 사람이 하는 일은 복사해서
 * 자기 AI 창에 붙여넣는 것뿐이다.
 *
 * 복사는 `CopyPageButton`과 같은 수법 — `navigator.clipboard.writeText`, 막히면
 * 복사된 척하지 않고 막혔다고 알린다.
 *
 * 접근성: 알약은 `role="tab"`, 상자는 `role="tabpanel"`로 묶는다. 탭은 진짜
 * `<button>`이라 Tab 키로 옮겨 다닌다(화살표 로빙까지는 안 넣었다 — 세 개짜리
 * 한 줄이라 과하다. 넣으려면 tabIndex 로빙 + onKeyDown이 한 벌로 와야 한다).
 */
export function PromptTabs({
  tabs,
  label = '프롬프트 예시',
}: {
  tabs: { label: string; prompt: string }[]
  label?: string
}) {
  const [active, setActive] = useState(0)
  const [note, setNote] = useState('')
  const base = useId()

  if (!tabs.length) return null
  const current = tabs[active]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.prompt)
    } catch {
      // 브라우저가 막았을 때 복사된 척하지 않는다 (CopyPageButton과 같은 원칙)
      setNote('복사가 막혔습니다')
      return
    }
    setNote('복사했습니다 — AI 창에 붙여넣으세요')
  }

  return (
    <div className="prompt-tabs">
      <div className="prompt-tablist" role="tablist" aria-label={label}>
        {tabs.map((t, i) => {
          const selected = i === active
          return (
            <button
              key={t.label}
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              className="prompt-tab"
              onClick={() => {
                setActive(i)
                setNote('')
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div
        className="prompt-composer"
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
      >
        <p className="prompt-text">{current.prompt}</p>
        <button type="button" className="prompt-copy" onClick={copy} aria-label="이 프롬프트 복사">
          <CopyIcon />
        </button>
      </div>

      {/* 복사 결과. 성공·실패 모두 낭독기에 전해지되 레이아웃은 안 민다 */}
      <span className="prompt-copy-note" role="status" aria-live="polite">
        {note}
      </span>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
