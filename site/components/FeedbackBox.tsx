'use client'

import { useState } from 'react'
import { Stack, Text, Button, TextArea } from '@astryxdesign/core'
import { MAX_BODY, type FeedbackContext } from '../lib/feedback'

/**
 * 한 줄 남기기. 폼도 계정도 이동도 없다.
 *
 * **읽던 자리에서 쓰고 남기면 끝난다.** 앞 판은 텔레그램을 열어 방을 고르게
 * 했는데, 그러면 의견이 대화에 섞여 사라지고 어느 화면 이야기였는지가 먼저
 * 묻힌다. 이제 사이트 자신에게 쌓인다.
 *
 * **주소는 사람한테 안 묻는다** — `window.location.pathname`을 붙여 보낸다.
 * 사람이 쓸 것은 하고 싶은 말 하나뿐이다.
 */
type State = 'idle' | 'sending' | 'done' | 'error'

export function FeedbackBox({ where, subject }: FeedbackContext) {
  const [open, setOpen] = useState(false)
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

  if (!open) {
    return (
      <Button
        label="한 줄 남기기"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(true)
          setState('idle')
        }}
      />
    )
  }

  if (state === 'done') {
    return (
      <Stack direction="vertical" gap={1} hAlign="start">
        <Text size="sm">남겼습니다. 고맙습니다.</Text>
        <Stack direction="horizontal" gap={1}>
          <Button label="하나 더" variant="secondary" size="sm" onClick={() => setState('idle')} />
          <Button label="닫기" variant="ghost" size="sm" onClick={() => setOpen(false)} />
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" gap={1} maxWidth={520}>
      <Text size="sm" color="secondary">
        {subject ? `${where} · ${subject}` : where}
      </Text>
      <TextArea
        label="한 줄 남기기"
        placeholder="여기에 쓰세요. 틀린 것도, 있으면 좋겠는 것도."
        value={text}
        onChange={(v) => setText(v.slice(0, MAX_BODY))}
        rows={3}
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
      <Stack direction="horizontal" gap={1} vAlign="center">
        <Button
          label={state === 'sending' ? '남기는 중' : '남기기'}
          variant="primary"
          size="sm"
          isDisabled={empty || state === 'sending'}
          onClick={send}
        />
        <Button label="닫기" variant="ghost" size="sm" onClick={() => setOpen(false)} />
        {state === 'error' ? (
          <Text size="sm" color="secondary">
            안 보내졌습니다. 쓴 글은 그대로 있으니 다시 눌러 주세요.
          </Text>
        ) : null}
      </Stack>
    </Stack>
  )
}
