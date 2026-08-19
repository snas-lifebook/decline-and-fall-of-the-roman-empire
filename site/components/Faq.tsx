import { Fragment } from 'react'
import Link from 'next/link'
import { Stack, Text, Heading, Collapsible } from '@astryxdesign/core'
import type { FaqItem } from '../lib/faq'

/**
 * 자주 묻는 것 — 화면 맨 아래.
 *
 * **접어 둔다.** 답을 다 펴 두면 본문보다 길어져서 정작 읽어야 할 것을 밀어낸다.
 * 물음만 훑다가 걸리는 것만 펴는 것이 이 자리의 쓰임이다.
 *
 * `Collapsible`은 `defaultIsOpen`으로 비제어라 서버 컴포넌트에서 그대로 돈다.
 */
export function Faq({
  items,
  title = '자주 묻는 것',
}: {
  items: FaqItem[]
  /** `null`이면 제목을 안 그린다 — 분류별로 이미 제목이 있는 `/faq`가 그렇게 쓴다 */
  title?: string | null
}) {
  if (!items.length) return null
  return (
    <Stack direction="vertical" gap={2} as="section">
      {title ? <Heading level={2}>{title}</Heading> : null}
      {/*
        `faq` 클래스가 간격을 받는다 — 스타일은 `app/globals.css`에 있다.
        앞 판은 항목이 4px 간격에 구분선도 패딩도 없어서 **접히는 줄인지 그냥
        문장인지 안 보였다**("대충 만든 것 같다").

        Mintlify(=docs.claude.com이 쓰는 엔진)의 아코디언 그룹을 실측해 옮겼다 —
        **항목을 붙이고(gap 0) 구분선을 공유**하며, 질문은 굵게 하지 않는다(500).
        낱개 카드로 띄우는 건 항목이 하나일 때 쓰는 형태다.
      */}
      <Stack className="faq" direction="vertical" gap={1}>
        {items.map((f) => (
          <Collapsible key={f.id} defaultIsOpen={false} trigger={f.q}>
            <div className="faq-answer">
              <Text color="secondary">{f.a}</Text>
              {/*
                답을 읽고 나서 갈 자리. **답이 화면 이름을 부르면 여기 링크가 있어야
                한다** — 실측에서 답변 열 개가 「갱신 받는 법에 세 경로가 있는데」처럼
                이름만 부르고 길을 안 열어 주고 있었다.
              */}
              {f.see?.length ? (
                <Text size="sm" color="secondary">
                  이어서{' '}
                  {f.see.map((s, i) => (
                    <Fragment key={s.href}>
                      {i > 0 ? ' · ' : ''}
                      <Link href={s.href}>{s.label}</Link>
                    </Fragment>
                  ))}
                </Text>
              ) : null}
            </div>
          </Collapsible>
        ))}
      </Stack>
    </Stack>
  )
}
