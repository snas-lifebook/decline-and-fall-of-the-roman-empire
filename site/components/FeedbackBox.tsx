'use client'

import { useState } from 'react'
import { Stack, Text, useToast } from '@astryxdesign/core'
import { MAX_BODY, type FeedbackContext } from '../lib/feedback'

/**
 * 한 줄 남기기. 폼도 계정도 이동도 없다.
 *
 * **읽던 자리에서 쓰고 남기면 끝난다.** `window.location.pathname`을 붙여 보내므로
 * 어느 화면 이야기였는지는 사람이 안 적어도 된다. 사람이 쓸 것은 하고 싶은 말 하나뿐.
 *
 * ## 컴포저 꼴로 다듬었다 (#13, River 「섹시해야 한다」)
 *
 * 앞 판은 라벨 입력칸(astryx `TextInput`) 옆에 「보내기」 네모 단추가 붙은 **평범한
 * 폼**이었다. learn.chatgpt·Claude·Apple의 입력은 하나같이 **둥근 컴포저 + 원형
 * 보내기 단추**다(River가 짚은 스크린샷). 그 꼴로 바꾼다 —
 *
 *   - 입력과 단추가 **한 상자** 안에 든다(테두리 하나, 포커스 시 링이 상자를 감싼다)
 *   - 보내기는 **원형 화살표**다. 비었으면 흐려지고, 글이 있으면 또렷해진다
 *   - `<form>`이라 **Enter로 보낸다** — 채팅 입력의 그 손맛
 *
 * 겉모습만 바꿨다. 벌통·`pathname` 첨부·`Toast` 안내는 그대로다.
 *
 * ## 보낸 결과는 `Toast`로 안내한다
 *
 * 화면 레이아웃을 안 밀어내는 astryx `Toast`로 알린다(`useToast()`만으로 뜬다).
 * 실패는 자동으로 안 닫히는 `error` 타입이라 — 성공만 알리고 실패는 조용한 폼이
 * 되는 것을 막는다.
 */
type State = 'idle' | 'sending'

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FeedbackBox({ where, subject }: FeedbackContext) {
  const [text, setText] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<State>('idle')
  const toast = useToast()

  const empty = !text.trim()

  async function send() {
    setState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          where,
          subject,
          path: window.location.pathname,
          body: text,
          trap,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast({ body: '남겼습니다. 고맙습니다.' })
      setText('')
    } catch {
      // 글은 상자에 그대로 둔다. 안 보내진 마당에 쓴 것까지 날리지 않는다
      toast({ body: '안 보내졌습니다. 쓴 글은 그대로 있으니 다시 눌러 주세요.', type: 'error' })
    } finally {
      setState('idle')
    }
  }

  return (
    <div className="feedback">
      <Stack direction="vertical" gap={0.5} hAlign="start">
        {/* 푸터에서 유일하게 사람이 뭔가 하는 자리라 한 단 큰 글자를 가져간다(Apple 피드백 줄) */}
        <Text type="large" weight="semibold">
          피드백
        </Text>
        <Text size="sm" color="secondary">
          잘못된 곳이나 있었으면 하는 기능을 알려 주세요.
        </Text>
        {/* 두 경로 다 열어 둔다. 깃허브 이슈는 팀원 다수가 못 쓰는 도구라 뺐고, 대신
            주용 개인 텔레그램 DM을 건다(#11). 그룹방 초대 링크는 여전히 안 넣는다 */}
        <Text size="sm" color="secondary">
          주용에게{' '}
          <a href="https://t.me/river181" target="_blank" rel="noreferrer">
            텔레그램으로 직접
          </a>{' '}
          보내셔도 됩니다.
        </Text>
      </Stack>

      {/*
        컴포저. `<form>`이라 Enter로 보낸다. 좁아지면 상자는 그대로 두고 안에서만
        줄어든다 — 단추가 오른쪽에 붙박여 있어야 「여기를 누르면 보낸다」가 안 흔들린다.
      */}
      <form
        className="feedback-composer"
        onSubmit={(e) => {
          e.preventDefault()
          if (!empty && state === 'idle') send()
        }}
      >
        <input
          className="feedback-input"
          aria-label="피드백"
          /*
            **시키지 않는다.** 「여기에 쓰세요」는 빈칸을 채우라는 지시라 안 쓴다.
            무엇을 적으면 되는지 예를 낮은 문턱으로 보여준다.
          */
          placeholder="고칠 점이나 바라는 것을 적어 주세요"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_BODY))}
        />
        {/*
          벌통. 사람 눈에도 낭독기에도 안 걸리고 탭으로도 안 닿는다.
          기계만 채우는 칸이라 채워져 오면 서버가 버린다.
        */}
        <input
          type="text"
          name="email"
          className="feedback-trap"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button
          type="submit"
          className="feedback-send"
          disabled={empty || state === 'sending'}
          aria-label={state === 'sending' ? '보내는 중' : '보내기'}
        >
          {state === 'sending' ? <span className="feedback-spin" aria-hidden="true" /> : <ArrowUpIcon />}
        </button>
      </form>
    </div>
  )
}
