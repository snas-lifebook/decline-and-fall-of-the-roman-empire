'use client'

import { useState } from 'react'
import { Dialog, Stack, Heading, Text, Button, Link } from '@astryxdesign/core'
import { DECLARATIONS, NOT, STAGE_NOTE } from '../lib/manifesto'

/**
 * 「이 자료실은」 팝업 (#5, River Round2 「팝업으로 뜨게」).
 *
 * 앞 판은 이 선언이 허브 본문에 **펼쳐진 채** 카드 밑에 붙어 있었다. 첫 화면에서
 * 제일 먼저 할 일은 갈림길을 고르는 것이지 선언을 읽는 것이 아니라, 갈림길 아래
 * 한 줄로 접고 눌러야 뜨게 한다. 내용은 `lib/manifesto.ts` 단일 소스 — `/about`도
 * 같은 것을 먹는다.
 *
 * 트리거·`Dialog`는 상태가 필요해 여기만 클라이언트다. 선언 데이터는 서버에서
 * 읽어도 되지만 한 파일에 두는 편이 읽기 쉽다.
 */
export function Manifesto() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* 갈림길 아래 한 줄. 눌러서 여는 것이라 「가는 곳」 링크와 안 섞이게 단추다 */}
      <button type="button" className="manifesto-trigger" onClick={() => setOpen(true)}>
        이 자료실은 어떤 곳인가요{' '}
        <span aria-hidden="true">→</span>
      </button>

      <Dialog isOpen={open} onOpenChange={setOpen} width={560} purpose="info" padding={5}>
        <Stack direction="vertical" gap={5}>
          <Stack direction="horizontal" justify="between" vAlign="center">
            <Heading level={2}>이 자료실은</Heading>
            <Button variant="ghost" size="sm" label="닫기" onClick={() => setOpen(false)} />
          </Stack>

          <Stack direction="vertical" gap={4}>
            {DECLARATIONS.map((d) => (
              <Stack key={d.n} direction="horizontal" gap={4}>
                <Text size="sm" color="secondary">
                  {d.n}
                </Text>
                <Stack direction="vertical" gap={0.5}>
                  <Text>{d.claim}</Text>
                  <Text size="sm" color="secondary">
                    {d.why}
                  </Text>
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Stack direction="vertical" gap={0.5}>
            {NOT.map((line) => (
              <Text key={line}>{line}</Text>
            ))}
          </Stack>

          <Text size="sm" color="secondary">
            {STAGE_NOTE} <Link href="/about">이 자료실에 대하여</Link>에서 못 한 것까지 그대로 적어 뒀습니다.
          </Text>
        </Stack>
      </Dialog>
    </>
  )
}
