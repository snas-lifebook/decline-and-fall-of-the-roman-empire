'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BookIcon, SearchIcon, DownloadIcon, SparkIcon } from './icons'

/**
 * 화면을 따라가는 안내 (2026-08-24 재작성).
 *
 * 앞 판은 중앙 모달이 5뷰를 나열하고 「읽기 열기」 링크로 보냈는데, 누르면 그 화면에
 * 도착하는 순간 안내가 사라졌다(상태가 페이지 전환에서 리셋). River: "각 화면에
 * 도착하면 사용법을 알려주고 다음 뷰로 이동해야 한다."
 *
 * 그래서 **localStorage에 진행 단계를 두는 상태 기계**로 바꾼다. 페이지가 바뀌어도
 * `tour-step`이 남아, 도착한 화면의 Tour가 그 단계를 이어 그 화면의 사용법을 띄운다.
 * 모달이 아니라 **화면을 가리지 않는 하단 카드**다: 실제 화면을 보면서 읽고, 「다음」이
 * 곧 다음 뷰로 데려간다(별도 링크가 없어 안 사라진다). 마지막에서 마치면 `tour-seen`에
 * 버전을 적어 다음 접속부터 안 뜬다(업데이트되면 다시).
 *
 * 요소 지목(2026-08-25). 뷰마다 그 화면에서 진짜 만지는 컨트롤에 `anchor` 셀렉터를
 * 걸어, 도착하면 그 요소에 펄스 링을 두르고 가운데로 스크롤한다. 절대좌표 화살표를
 * 그리는 대신 **실제 요소에 클래스 하나**를 붙이는 방식이라 레이아웃이 바뀌어도 안 깨지고,
 * 요소를 못 찾으면(모바일에서 숨었거나 아직 안 그려졌으면) 조용히 텍스트 안내만 남는다.
 * 소개(0)와 마무리(활용하기)는 특정 컨트롤이 없어 링을 안 건다.
 */
type Step = { route: string; Icon: typeof BookIcon | null; title: string; body: string; anchor?: string }

const STEPS: Step[] = [
  {
    route: '/',
    Icon: null,
    title: '이 자료실은',
    body: '『로마제국쇠망사』를 편데에서 발표하고 토론하려고 모은 자료실이에요. 다섯 화면을 한 바퀴 같이 돌아볼게요.',
  },
  {
    route: '/read',
    Icon: BookIcon,
    title: '읽기',
    body: '여기 책장에서 한 편을 고르면 본문이 나와요. 본문에서 파란 이름을 누르면 그 인물이 옆에 열려요.',
    anchor: '.shelf',
  },
  {
    route: '/objects',
    Icon: SearchIcon,
    title: '찾아보기',
    body: '인물·지명·사건을 이름으로 찾고, 누가 누구와 어떤 사이였는지 봐요. 여기 상단 검색창에 이름을 치면 바로 그 자리로 가요.',
    anchor: '.search-box',
  },
  {
    route: '/download',
    Icon: DownloadIcon,
    title: '가져가기',
    body: '포인트를 고르면 그 포인트의 인물 표를 시트에 붙여넣게 받아 가요. 발표에 필요한 만큼만 골라 받으시면 돼요.',
    anchor: '#points',
  },
  {
    route: '/use',
    Icon: SparkIcon,
    title: '활용하기',
    body: '쓰시던 ChatGPT나 Claude에 이 자료를 붙여 써요. 여기까지가 한 바퀴예요.',
  },
]

const STEP_KEY = 'tour-step'
const SEEN_KEY = 'tour-seen'

export function Tour({ version }: { version: string }) {
  const path = usePathname()
  const router = useRouter()
  const [step, setStep] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  // 마운트 때 한 번: 진행 중이면 그 단계를, 아니면 안 본 사람에게 0단계를 연다.
  // 페이지 전환은 usePathname 재렌더로 처리한다(상태는 아래 go/finish가 즉시 갱신).
  useEffect(() => {
    let s: number | null = null
    try {
      const raw = localStorage.getItem(STEP_KEY)
      if (raw !== null && raw !== '') {
        const n = Number(raw)
        s = Number.isFinite(n) ? n : null
      } else {
        const seen = localStorage.getItem(SEEN_KEY) ?? ''
        const focused = document.documentElement.dataset.focus === 'on'
        if (seen !== version && !focused) {
          s = 0
          localStorage.setItem(STEP_KEY, '0')
        }
      }
    } catch {
      // 저장이 막힌 브라우저: 집중 모드가 아니면 이번 세션에서만 처음부터
      const focused = document.documentElement.dataset.focus === 'on'
      if (!focused) s = 0
    }
    setStep(s)
    setReady(true)
  }, [version])

  // 도착한 화면의 컨트롤에 펄스 링을 두르고 가운데로 스크롤한다. 요소를 못 찾으면
  // 다음 프레임에 다시 본다(클라 전환 직후 아직 안 그려졌을 수 있다). ponytail: 30프레임(~0.5초)
  // 안에 안 뜨면 포기하고 텍스트 안내만 남긴다.
  useEffect(() => {
    if (step === null) return
    const s = STEPS[step]
    const onView = step === 0 || s.route === path
    if (!onView || !s.anchor) return
    const sel = s.anchor
    let el: Element | null = null
    let raf = 0
    let tries = 0
    const mark = () => {
      el = document.querySelector(sel)
      if (!el) {
        if (tries++ < 30) raf = requestAnimationFrame(mark)
        return
      }
      el.classList.add('tour-target')
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    mark()
    return () => {
      if (raf) cancelAnimationFrame(raf)
      el?.classList.remove('tour-target')
    }
  }, [step, path])

  const persist = (s: number | null) => {
    try {
      if (s === null) {
        localStorage.removeItem(STEP_KEY)
        localStorage.setItem(SEEN_KEY, version)
      } else {
        localStorage.setItem(STEP_KEY, String(s))
      }
    } catch {
      // 저장 못 해도 이번 세션 진행은 상태로 계속된다
    }
  }

  const go = (s: number) => {
    setStep(s)
    persist(s)
    router.push(STEPS[s].route)
  }
  const finish = () => {
    setStep(null)
    persist(null)
  }

  if (!ready || step === null) return null

  const cur = STEPS[step]
  const last = step === STEPS.length - 1
  // 0단계(소개)는 어느 화면에서 시작하든 뜬다. 1~4단계는 그 뷰에 도착했을 때만 떠서
  // 안내가 화면과 붙는다. 사용자가 도중에 딴 데로 가면 그 뷰에 닿을 때 이어진다.
  const onRoute = step === 0 || cur.route === path
  if (!onRoute) return null

  return (
    <div className="tour-tip" role="dialog" aria-label="화면 안내">
      <div className="tour-tip-top">
        <span className="tour-tip-count">
          {step + 1} / {STEPS.length}
        </span>
        <button type="button" className="tour-tip-skip" onClick={finish}>
          건너뛰기
        </button>
      </div>

      <div className="tour-tip-headrow">
        {cur.Icon ? (
          <span className="collection-mark collection-mark--plain">
            <cur.Icon />
          </span>
        ) : null}
        <span className="tour-tip-title">{cur.title}</span>
      </div>

      <p className="tour-tip-body">{cur.body}</p>

      <div className="tour-tip-nav">
        <button
          type="button"
          className="tour-btn"
          onClick={() => go(step - 1)}
          disabled={step === 0}
        >
          이전
        </button>
        <button
          type="button"
          className="tour-btn tour-btn--primary"
          onClick={() => (last ? finish() : go(step + 1))}
        >
          {last ? '마치기' : '다음'}
        </button>
      </div>
    </div>
  )
}
