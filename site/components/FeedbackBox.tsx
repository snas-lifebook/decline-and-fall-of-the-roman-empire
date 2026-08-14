'use client'

import { useState } from 'react'
import { Stack, Text, Button, TextArea } from '@astryxdesign/core'
import { feedbackDraft, telegramShareUrl, type FeedbackContext } from '../lib/feedback'

/**
 * 한 줄 남기기. 폼도 계정도 없다.
 *
 * 어느 화면에서 남기는지가 초안에 이미 적혀 있어서 사람은 하고 싶은 말만 쓴다.
 * 「텔레그램으로 보내기」가 기본이고 「복사」는 딥링크가 안 먹는 환경의 안전망이다.
 */
export function FeedbackBox(ctx: FeedbackContext) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const message = feedbackDraft(ctx) + text
  const empty = !text.trim()

  if (!open) {
    return <Button label="한 줄 남기기" variant="ghost" size="sm" onClick={() => setOpen(true)} />
  }

  return (
    <Stack direction="vertical" gap={1} maxWidth={520}>
      <Text size="sm" color="secondary">
        {ctx.subject ? `${ctx.where} · ${ctx.subject}` : ctx.where}
      </Text>
      <TextArea
        label="한 줄 남기기"
        placeholder="여기에 쓰세요. 틀린 것도, 있으면 좋겠는 것도."
        value={text}
        onChange={(v) => setText(v)}
        rows={3}
      />
      <Stack direction="horizontal" gap={1}>
        <Button
          label="텔레그램으로 보내기"
          variant="primary"
          size="sm"
          href={empty ? undefined : telegramShareUrl(message)}
          target="_blank"
          isDisabled={empty}
        />
        <Button
          label={copied ? '복사됨' : '복사'}
          variant="secondary"
          size="sm"
          isDisabled={empty}
          onClick={() => {
            navigator.clipboard.writeText(message)
            setCopied(true)
          }}
        />
        <Button label="닫기" variant="ghost" size="sm" onClick={() => setOpen(false)} />
      </Stack>
    </Stack>
  )
}
