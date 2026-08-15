'use client'

import { useState } from 'react'
import { Button } from '@astryxdesign/core'

/**
 * 「페이지 복사」 (F25).
 *
 * 이 페이지를 **마크다운 원문 그대로** 클립보드에 담는다. 붙여넣을 곳은 사람이
 * 이미 쓰고 있는 ChatGPT·Claude 창이다 — 자료를 연결하지 않은 사람도 한 페이지
 * 분량은 이 버튼 하나로 AI에게 줄 수 있다.
 *
 * 서버가 문자열을 만들어 넘긴다. 문자열이라 서버-클라이언트 경계를 그냥 넘는다.
 */
export function CopyPageButton({ markdown }: { markdown: string }) {
  const [note, setNote] = useState('')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
    } catch {
      // 브라우저가 막았을 때 복사된 척하지 않는다
      setNote('복사가 막혔습니다')
      return
    }
    setNote('복사했습니다 — AI 창에 붙여넣으세요')
  }

  return <Button label={note || '이 페이지 복사'} variant="ghost" clickAction={copy} />
}
