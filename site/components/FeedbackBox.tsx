'use client'

import { useState } from 'react'
import { Stack, Text, Button, TextInput } from '@astryxdesign/core'
import { MAX_BODY, type FeedbackContext } from '../lib/feedback'
import { ro } from '../lib/korean'

/**
 * 한 줄 남기기. 폼도 계정도 이동도 없다.
 *
 * **읽던 자리에서 쓰고 남기면 끝난다.** 앞 판은 텔레그램을 열어 방을 고르게
 * 했는데, 그러면 의견이 대화에 섞여 사라지고 어느 화면 이야기였는지가 먼저
 * 묻힌다. 이제 사이트 자신에게 쌓인다.
 *
 * **주소는 사람한테 안 묻는다** — `window.location.pathname`을 붙여 보낸다.
 * 사람이 쓸 것은 하고 싶은 말 하나뿐이다.
 *
 * ## 왜 늘 열려 있나 (2026-08-19)
 *
 * River: 「한줄 남기기 인터렉션이랄까 디자인이 뭔가 너무 쌩뚱맞다」. 앞 판은
 * **글자 링크 목록 사이에 고스트 단추가 하나 끼어** 있었고, 누르면 그 자리에서
 * 세 줄짜리 상자가 펼쳐지며 푸터 높이가 튀었다. 두 가지가 어긋나 있었다.
 *
 *   - **정체가 애매했다.** 옆의 것들은 「눌러서 가는 곳」인데 이것만 「눌러서
 *     여는 것」이라, 같은 모양으로 나란히 서 있으면 안 되는 물건이었다
 *   - **여는 값을 받고 얻는 게 없었다.** 상자 하나 보여주려고 클릭 한 번과
 *     화면이 밀리는 것을 치렀다
 *
 * 그래서 접는 것을 없앴다. 푸터 맨 위의 **제 줄**을 차지하고 늘 열려 있다.
 * 한 줄 쓰는 칸이니 한 줄짜리 입력이고(`TextInput`), 다 쓰면 옆의 단추를 누른다.
 * 보내고 나서도 **자리 크기가 그대로**라 화면이 안 튄다.
 */
type State = 'idle' | 'sending' | 'done' | 'error'


export function FeedbackBox({ where, subject }: FeedbackContext) {
  const [text, setText] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<State>('idle')

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
      setState('done')
      setText('')
    } catch {
      // 글은 상자에 그대로 둔다. 안 보내진 마당에 쓴 것까지 날리지 않는다
      setState('error')
    }
  }

  return (
    <div className="leave-line">
      <Stack direction="vertical" gap={0.5} hAlign="start">
        <Text size="sm" weight="semibold">
          한 줄 남기기
        </Text>
        <Text size="sm" color="secondary">
          {state === 'done'
            ? '남겼습니다. 고맙습니다.'
            : (() => {
                const here = subject ? `${where} · ${subject}` : where
                return `틀린 것도, 있으면 좋겠는 것도. 어느 화면인지는 ${here}${ro(here)} 같이 갑니다.`
              })()}
        </Text>
      </Stack>

      {/*
        입력과 단추가 한 줄이다. 좁아지면 CSS가 세로로 접는다 — 여기서 `wrap`을
        쓰지 않는 이유는 입력 칸이 늘 남은 폭을 다 먹어야 하기 때문이다
      */}
      <div className="leave-line-form">
        <TextInput
          label="한 줄 남기기"
          isLabelHidden
          size="sm"
          placeholder="여기에 쓰세요"
          value={text}
          onChange={(v: string) => setText(v.slice(0, MAX_BODY))}
          width="100%"
        />
        {/*
          벌통. 사람 눈에도 낭독기에도 안 걸리고 탭으로도 안 닿는다.
          기계만 채우는 칸이라 채워져 오면 서버가 버린다.
        */}
        <input
          type="text"
          name="email"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />
        <Button
          label={state === 'sending' ? '남기는 중' : '남기기'}
          variant="secondary"
          size="sm"
          isDisabled={empty || state === 'sending'}
          onClick={send}
        />
      </div>

      {state === 'error' ? (
        <Text size="sm" color="secondary">
          안 보내졌습니다. 쓴 글은 그대로 있으니 다시 눌러 주세요.
        </Text>
      ) : null}
    </div>
  )
}
