import { Stack, Heading, Text, Divider } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { Faq } from '../../components/Faq'
import { faqByCategory, FAQ } from '../../lib/faq'

/**
 * 전부 모아 분류로 본다. 각 화면 하단에는 그 화면 것만 뜨므로 여기가 유일하게
 * 전체를 보는 자리다.
 */
export default function FaqPage() {
  return (
    <Shell path="/faq" where="자주 묻는 것">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>자주 묻는 것</Heading>
        <Text size="lg" color="secondary">
          실제로 나왔던 물음 {FAQ.length}개입니다. 여기 없는 것은 화면 아래 「한 줄 남기기」로
          물어봐 주세요.
        </Text>
      </Stack>

      <Divider />

      {faqByCategory().map(({ category, items }) => (
        <Stack key={category} direction="vertical" gap={2} as="section">
          <Heading level={2}>{category}</Heading>
          <Faq items={items} title={null} />
        </Stack>
      ))}
    </Shell>
  )
}
