import Link from 'next/link'
import { Stack, Heading, Text, Divider, Banner } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { SkillCard } from '../../../components/SkillCard'
import { SKILLS, SKILL_TIERS } from '../../../lib/skills'
import { linkById } from '../../../lib/links'

/**
 * 스킬 여덟 — 마크다운이 아니라 카드다.
 *
 * 여덟이 「무엇을 하나·무엇을 주나·무엇이 나오나·이렇게 말한다」라는 같은 뼈대를
 * 반복한다. 그건 산문이 아니라 표의 성질이고, 마크다운으로 쓰면 라벨이 본문에
 * 섞여 흐른다(앞 판이 그래서 반려됐다).
 *
 * 갈래를 먼저 가르는 것이 이 화면의 전부다 — **여덟 중 일곱은 자료를 받아두어야
 * 돌아간다.** 그걸 모르고 웹 창에 문장만 붙이면 AI가 지어낸다.
 */
export default function Skills() {
  return (
    <Shell path="/use/skills" where="스킬 여덟">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>스킬 여덟</Heading>
        <Text size="lg" color="secondary">
          AI에게 시킬 일이 절차서로 적혀 있습니다. 어느 것이 지금 바로 되는지부터 가릅니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="warning"
        title="여덟 중 일곱은 자료를 받아두어야 돌아갑니다"
        description="인물·관계 파일을 AI가 직접 열어 읽어야 하는 절차라, 파일 없이 문장만 붙여넣으면 AI가 읽을 것이 없는 채로 그럴듯한 답을 지어냅니다."
      />

      {SKILL_TIERS.map((t) => {
        const items = SKILLS.filter((s) => s.tier === t.tier)
        if (!items.length) return null
        return (
          <Stack key={t.tier} direction="vertical" gap={3} as="section">
            <Stack direction="vertical" gap={0.5}>
              <Heading level={2}>{t.title}</Heading>
              <Text size="sm" color="secondary">
                {t.who} · {t.note}
              </Text>
            </Stack>
            {t.tier === 'local' ? (
              <Text size="sm" color="secondary">
                <Link href="/start/ai">AI에 자료 연결하기</Link>를 먼저 하시면 아래가 열립니다.
              </Text>
            ) : null}
            <Stack direction="vertical" gap={3}>
              {items.map((s) => (
                <SkillCard key={s.id} s={s} />
              ))}
            </Stack>
          </Stack>
        )
      })}

      <Divider />

      <Stack direction="vertical" gap={1}>
        <Heading level={2}>원문을 보시려면</Heading>
        <Text color="secondary">
          각 절차가 무엇을 하지 말라고 적어두었는지까지 보시려면{' '}
          <a href={linkById('repo-skills').href} target="_blank" rel="noreferrer">
            스킬 원문 여덟 벌
          </a>
          이 깃허브에 있습니다. 「하지 말 것」이 이 절차서들의 존재 이유입니다.
        </Text>
      </Stack>
    </Shell>
  )
}
