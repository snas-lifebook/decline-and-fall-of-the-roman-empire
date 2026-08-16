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
      <Stack direction="vertical" gap={1}>
        {items.map((f) => (
          <Collapsible key={f.id} defaultIsOpen={false} trigger={f.q}>
            <Text color="secondary">{f.a}</Text>
          </Collapsible>
        ))}
      </Stack>
    </Stack>
  )
}
