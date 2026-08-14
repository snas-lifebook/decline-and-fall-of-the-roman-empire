'use client'

import { useState } from 'react'
import { Stack, Text, Button } from '@astryxdesign/core'
import { BOM, toCsv, toTsv } from '../lib/export/serialize'
import { ZIP_URL } from '../lib/links'

/**
 * 표를 가져가는 세 갈래. **복사가 기본이다** — 팀은 시트에 붙여넣는 게 목적이지
 * 파일을 모으는 게 목적이 아니다.
 *
 * 서버가 계산해 넘긴 표를 받아 직렬화·클립보드·내려받기만 한다.
 */
export function TableActions({
  point,
  header,
  rows,
}: {
  point: number
  header: string[]
  rows: string[][]
}) {
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')

  const copy = async () => {
    const { text, replaced } = toTsv(header, rows)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 브라우저가 클립보드를 막았을 때 복사된 척하지 않는다
      setCopied(false)
      setNote('복사가 막혔습니다. 아래 표를 직접 끌어서 선택해 복사해 주세요.')
      return
    }
    setCopied(true)
    // 「복사됨」만으로는 다음에 뭘 할지 모른다. 붙여넣기까지 말한다.
    // 탭·줄바꿈을 지웠으면 그것도 말한다 — 조용히 바꾸면 사람이 표를 믿을 수 없다
    setNote(
      '복사했습니다. 시트에 붙여넣기(Ctrl+V / Cmd+V) 하세요.' +
        (replaced > 0 ? ` 표에 넣기 위해 줄바꿈·탭 ${replaced}곳을 공백으로 바꿨습니다.` : ''),
    )
  }

  const csv = () => {
    // 바이트를 바꾸는 건 BOM 프리픽스 하나다. Blob의 MIME charset은 아무것도 안 한다
    const url = URL.createObjectURL(new Blob([BOM + toCsv(header, rows)], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `로마쇠망사_포인트${String(point).padStart(2, '0')}.csv`
    a.click()
    // 클릭 직후 취소하면 브라우저에 따라 받다 만다
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <Stack direction="vertical" gap={1}>
      <Stack direction="horizontal" gap={1} wrap="wrap">
        <Button
          label={copied ? '복사됨' : '시트에 붙여넣기용 복사'}
          variant="primary"
          clickAction={copy}
        />
        <Button label="CSV 내려받기 (엑셀용)" variant="secondary" onClick={csv} />
        <Button label="전체 자료 받기" variant="ghost" href={ZIP_URL} />
      </Stack>
      {/* 왜 버튼이 둘인지 초보자는 모른다 */}
      <Text size="sm" color="secondary">
        구글시트·엑셀에 바로 붙이려면 복사를, 파일로 보관하려면 내려받기를 쓰세요.
      </Text>
      {note ? (
        <Text size="sm" color="secondary">
          {note}
        </Text>
      ) : null}
    </Stack>
  )
}
