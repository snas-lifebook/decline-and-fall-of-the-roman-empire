import Link from 'next/link'
import {
  Stack,
  Heading,
  Text,
  Badge,
  Card,
  Divider,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import type { Pitfall } from '../lib/pitfalls'
import { SKILLS } from '../lib/skills'

/**
 * 밟으면 틀리는 자리 하나. `RecipeCard`·`SkillCard`의 형제다.
 *
 * 앞 판은 여덟 절이 통짜 문단이라 훑을 수가 없었다. 사람은 여덟을 다 읽고 싶은
 * 게 아니라 **자기에게 걸리는 하나에서 멈추고 싶어 한다.** 그러려면 셋이 필요하다 —
 * 제목으로 걸리고, **숫자로 믿고**, 「어떻게 하나」로 끝낸다.
 *
 * 숫자를 배지로 뺀 것이 이 카드의 전부다. 「AI는 가끔 틀립니다」는 아무도 안 읽고
 * 「68건 중 19건」은 읽는다. 그리고 겁만 주고 끝내지 않도록 **걸러주는 스킬로
 * 링크를 건다** — 함정만 늘어놓고 대책을 안 주면 읽은 사람이 갈 곳이 없다.
 */
export function PitfallCard({ p }: { p: Pitfall }) {
  const skill = p.skill ? SKILLS.find((s) => s.id === p.skill) : undefined

  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={2}>
        <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap" justify="between">
          <Heading level={3}>{p.title}</Heading>
          {/* 실측치다. 이 화면이 일반론이 아니라는 증거라서 제목 옆에 둔다 */}
          <Badge variant="warning" label={p.count} />
        </Stack>

        <Text color="secondary">{p.risk}</Text>

        <Divider />

        <MetadataList columns="single" label={{ position: 'start', width: 88 }}>
          <MetadataListItem label="어떻게 하나">{p.so}</MetadataListItem>
          {skill ? (
            <MetadataListItem label="걸러주는 것">
              <Link href="/use/skills">{skill.title}</Link>
            </MetadataListItem>
          ) : null}
        </MetadataList>
      </Stack>
    </Card>
  )
}
