import Link from 'next/link'
import { Stack, Text, Banner, List, ListItem } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { PitfallCard } from '../../../components/PitfallCard'
import { pitfallsByCategory } from '../../../lib/pitfalls'
import { pageMeta } from '../../../lib/meta'

/**
 * 그냥 시키면 틀리는 것 — 마크다운이 아니라 카드다.
 *
 * `recipes`·`skills`에 이어 셋째다. 여덟 절이 「무엇이 위험한가」와 「그래서
 * 어떻게 하나」 두 문단을 그대로 반복하는데, 그건 산문이 아니라 표의 성질이다.
 *
 * **읽는 순서를 사람에게 돌려준 것이 이번 판의 요지다.** 앞 판은 위에서부터 다
 * 읽어야 자기에게 걸리는 항목을 찾을 수 있었다.
 *
 * 2026-08-19에 `DocShell`로 옮겨 빵부스러기·우측 목차·이전다음을 되찾았다.
 */
const CLOSING = [
  ['연도는 반드시 원문과 대조하세요', '기원전인지 서기인지부터 확인하시면 절반은 걸러집니다.'],
  ['인명이 같아도 같은 사람이라고 단정하지 마세요', '12쌍 중 4쌍이 다른 사람이었습니다.'],
  ['답을 받으면 근거가 몇 번 포인트인지 물으세요', '못 대면 지어낸 것입니다.'],
  ['자료에 없으면 없는 것으로 두세요', '「아마 이랬을 것」으로 채운 답은 받아 적지 않습니다.'],
] as const

export const metadata = pageMeta('그냥 시키면 틀리는 것')

function sections(): DocSection[] {
  // 갈래는 데이터에서 나오므로 순번 id를 쓴다 — 한글 제목을 슬러그로 만들려는
  // 시도가 실패하는 자리라 사이트 전체가 이 규약이다(`lib/doc.ts` docSections)
  const cats: DocSection[] = pitfallsByCategory().map(({ category, items }, i) => ({
    id: `sec-${i + 1}`,
    title: category,
    body: (
      <Stack direction="vertical" gap={3}>
        {items.map((p) => (
          <PitfallCard key={p.id} p={p} />
        ))}
      </Stack>
    ),
  }))

  return [
    ...cats,
    {
      id: 'closing',
      title: '그래서 AI에게 시킬 때',
      body: (
        <Stack direction="vertical" gap={1.5}>
          <List density="spacious" hasDividers>
            {CLOSING.map(([label, description]) => (
              <ListItem key={label} label={label} description={description} />
            ))}
          </List>
          <Text size="sm" color="secondary">
            무엇을 시킬 수 있는지는 <Link href="/use/skills">스킬 여덟</Link>에 정리해 두었습니다.
          </Text>
        </Stack>
      ),
    },
  ]
}

export default function Pitfalls() {
  return (
    <DocShell
      href="/use/pitfalls"
      title="그냥 시키면 틀리는 것"
      summary="AI가 이 자료에서 실제로 틀린 자리 여덟 군데입니다."
      sections={sections()}
      intro={
        <Banner
          status="info"
          title="일반론이 아닙니다"
          description="아래는 전부 이 자료를 다루다 실제로 밟은 것입니다. 몇 건이었는지까지 세어 뒀습니다. 어디가 미끄러운지 알고 시키면 덜 틀립니다."
        />
      }
    />
  )
}
