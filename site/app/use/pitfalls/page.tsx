import Link from 'next/link'
import { Stack, Heading, Text, Divider, Banner, List, ListItem } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { PitfallCard } from '../../../components/PitfallCard'
import { Faq } from '../../../components/Faq'
import { pitfallsByCategory } from '../../../lib/pitfalls'
import { faqFor } from '../../../lib/faq'

/**
 * 그냥 시키면 틀리는 것 — 마크다운이 아니라 카드다.
 *
 * `recipes`·`skills`에 이어 셋째다. 여덟 절이 「무엇이 위험한가」와 「그래서
 * 어떻게 하나」 두 문단을 그대로 반복하는데, 그건 산문이 아니라 표의 성질이다.
 *
 * **읽는 순서를 사람에게 돌려준 것이 이번 판의 요지다.** 앞 판은 위에서부터 다
 * 읽어야 자기에게 걸리는 항목을 찾을 수 있었다.
 */
const CLOSING = [
  ['연도는 반드시 원문과 대조하세요', '기원전인지 서기인지부터 확인하시면 절반은 걸러집니다.'],
  ['인명이 같아도 같은 사람이라고 단정하지 마세요', '12쌍 중 4쌍이 다른 사람이었습니다.'],
  ['답을 받으면 근거가 몇 번 포인트인지 물으세요', '못 대면 지어낸 것입니다.'],
  ['자료에 없으면 없는 것으로 두세요', '「아마 이랬을 것」으로 채운 답은 받아 적지 않습니다.'],
] as const

export default function Pitfalls() {
  return (
    <Shell path="/use/pitfalls" where="그냥 시키면 틀리는 것">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>그냥 시키면 틀리는 것</Heading>
        <Text size="lg" color="secondary">
          이 자료에서 AI가 실제로 틀린 자리를 숫자로 적었습니다. 여덟 군데입니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="info"
        title="일반론이 아닙니다"
        description="아래는 전부 이 자료를 다루다 실제로 밟은 것이고, 몇 건이었는지까지 세어 두었습니다. 어디가 미끄러운지 알고 시키시는 것과 모르고 시키시는 것은 결과가 다릅니다."
      />

      {pitfallsByCategory().map(({ category, items }) => (
        <Stack key={category} direction="vertical" gap={3} as="section">
          <Heading level={2}>{category}</Heading>
          <Stack direction="vertical" gap={3}>
            {items.map((p) => (
              <PitfallCard key={p.id} p={p} />
            ))}
          </Stack>
        </Stack>
      ))}

      <Divider />

      <Stack direction="vertical" gap={1.5} as="section">
        <Heading level={2}>그래서 AI에게 시킬 때</Heading>
        <List density="spacious" hasDividers>
          {CLOSING.map(([label, description]) => (
            <ListItem key={label} label={label} description={description} />
          ))}
        </List>
        <Text size="sm" color="secondary">
          무엇을 시킬 수 있는지는 <Link href="/use/skills">스킬 여덟</Link>에 정리해 두었습니다.
        </Text>
      </Stack>

      <Faq items={faqFor('/use/pitfalls')} />
    </Shell>
  )
}
