'use client'

import { useEffect, useState } from 'react'
import { Dialog, Stack, Heading, Text, Button, Link } from '@astryxdesign/core'
import { BookIcon, SearchIcon, DownloadIcon, SparkIcon } from './icons'

/**
 * 첫 접속 워크스루 (#2 후속, River 「업데이트 후 첫 접속자에게 화면 따라가는 튜토리얼」).
 *
 * **정적 사이트라 IP별 추적은 못 한다.** 서버가 없으니 「브라우저별 1회 + 주요 업데이트
 * 시 재노출」로 옮긴다 — `localStorage['tour-seen']`에 **버전**(UPDATES 최신 날짜)을
 * 저장하고, 저장값이 지금 버전과 다르면(첫 방문이거나 업데이트됨) 다시 띄운다.
 *
 * Home과 서비스뷰(읽기·찾아보기·가져가기·활용하기)를 한 바퀴 소개한다(River 지시).
 * 중앙 모달(astryx `Dialog`, Manifesto와 같은 것) v1 — 실제 요소를 가리키는 코치마크는
 * 스포트라이트·앵커링을 새로 만들어야 해 v2로 미룬다.
 *
 * **마운트 이펙트로 연다.** 서버·첫 페인트는 `null`(open=false)이라 하이드레이션
 * 어긋남이 없고, 마운트 후 안 본 사람에게만 뜬다. `Shell`이 모든 페이지에 한 번 심는다.
 */
const STEPS = [
  {
    Icon: null,
    title: '이 자료실은',
    body: '『로마제국쇠망사』를 편데에서 발표하고 토론하려고 모은 자료실이에요. 여기서 뭘 할 수 있는지 잠깐 훑어볼게요.',
    href: null,
  },
  {
    Icon: BookIcon,
    title: '읽기',
    body: '편역본 30포인트와 기번 원전을 화면에서 바로 읽어요. 본문의 파란 이름을 누르면 그 인물이 옆에 열려요.',
    href: '/read',
  },
  {
    Icon: SearchIcon,
    title: '찾아보기',
    body: '인물·지명·사건을 이름으로 찾고, 누가 누구와 어떤 사이였는지 봐요.',
    href: '/objects',
  },
  {
    Icon: DownloadIcon,
    title: '가져가기',
    body: '포인트별 인물 표를 시트에 붙여넣을 수 있게 받아 가요.',
    href: '/download',
  },
  {
    Icon: SparkIcon,
    title: '활용하기',
    body: '쓰시던 ChatGPT나 Claude에 이 자료를 붙여 써요.',
    href: '/use',
  },
] as const

const KEY = 'tour-seen'

export function Tour({ version }: { version: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let seen = ''
    try {
      seen = localStorage.getItem(KEY) ?? ''
    } catch {
      // 저장이 막힌 브라우저(사생활 모드 등)에서는 그냥 한 번 보여준다
    }
    // 집중해서 읽기 중이면 끼어들지 않는다
    const focused = document.documentElement.dataset.focus === 'on'
    if (seen !== version && !focused) setOpen(true)
  }, [version])

  const done = () => {
    setOpen(false)
    try {
      localStorage.setItem(KEY, version)
    } catch {
      // 저장이 막혀도 이번 화면에서는 닫는다
    }
  }

  if (!open) return null

  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <Dialog isOpen={open} onOpenChange={(v) => (v ? setOpen(true) : done())} width={520} purpose="info" padding={5}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="horizontal" justify="between" vAlign="center">
          <Text size="sm" color="secondary">
            {step + 1} / {STEPS.length}
          </Text>
          <Button variant="ghost" size="sm" label="건너뛰기" onClick={done} />
        </Stack>

        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={2} vAlign="center">
            {s.Icon ? (
              <span className="collection-mark collection-mark--plain">
                <s.Icon />
              </span>
            ) : null}
            <Heading level={2}>{s.title}</Heading>
          </Stack>
          <Text color="secondary">{s.body}</Text>
          {s.href ? (
            <Text size="sm">
              <Link href={s.href} onClick={done}>
                {s.title} 열기 →
              </Link>
            </Text>
          ) : null}
        </Stack>

        <Stack direction="horizontal" gap={2} justify="between">
          <Button
            variant="ghost"
            size="sm"
            label="이전"
            isDisabled={step === 0}
            onClick={() => setStep((n) => Math.max(0, n - 1))}
          />
          {last ? (
            <Button
              variant="primary"
              size="sm"
              label="처음이면 시작하기 →"
              onClick={() => {
                done()
                window.location.href = '/start'
              }}
            />
          ) : (
            <Button variant="primary" size="sm" label="다음" onClick={() => setStep((n) => n + 1)} />
          )}
        </Stack>
      </Stack>
    </Dialog>
  )
}
