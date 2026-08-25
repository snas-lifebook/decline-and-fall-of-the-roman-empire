import Link from 'next/link'
import { Stack, Text, Banner, MetadataList, MetadataListItem } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { SkillCard } from '../../../components/SkillCard'
import { SKILLS, SKILL_TIERS, skillBodyById } from '../../../lib/skills'
import { linkById } from '../../../lib/links'
import { pageMeta } from '../../../lib/meta'

/**
 * 스킬 여덟 — 마크다운이 아니라 카드다.
 *
 * 여덟이 「무엇을 하나·무엇을 주나·무엇이 나오나·이렇게 말한다」라는 같은 뼈대를
 * 반복한다. 그건 산문이 아니라 표의 성질이고, 마크다운으로 쓰면 라벨이 본문에
 * 섞여 흐른다(앞 판이 그래서 반려됐다 — 헌장 17조).
 *
 * 갈래를 먼저 가르는 것이 이 화면의 전부다 — **여덟 중 일곱은 자료를 받아두어야
 * 돌아간다.** 그걸 모르고 웹 창에 문장만 붙이면 AI가 지어낸다.
 *
 * **2026-08-19에 `DocShell`로 옮겼다.** 헌장 17조로 이 화면이 마크다운에서 카드로
 * 바뀌던 날, 뼈대가 마크다운 로더에 용접돼 있어서 **빵부스러기·우측 목차·이전다음이
 * 통째로 사라졌다.** 실측하니 H2가 다섯인데 목차가 없었고 본문이 고른 링크가 1개였다
 * — 사이트에서 가장 헐벗은 화면이었다. 첫 외부 사용자가 이 페이지를 못 찾은 것이
 * 우연이 아니다.
 */
export const metadata = pageMeta('스킬')

/**
 * 앞 판은 「AI에게 시킬 일이 절차서로 적혀 있습니다. 어느 것이 지금 바로 되는지부터
 * 가릅니다.」였다. 「가릅니다」는 만드는 쪽 동작이지 읽는 쪽 동작이 아니다 —
 * 읽는 사람은 **자기가 지금 쓸 수 있는지**를 알고 싶다. 그 순서로 다시 썼다.
 */
const SUMMARY =
  'AI에게 시킬 수 있는 작업을 절차로 정리했습니다. 웹 화면만으로 되는 것부터 나옵니다.'

function sections(): DocSection[] {
  const bodies = skillBodyById()

  /*
    **스킬 하나가 어떻게 생겼는지 먼저 보여준다**(River #18, learn.chatgpt build-skills).
    앞 판은 요약 카드만 있고 「무엇으로 이뤄지나」가 없었다. 여덟 벌이 다 같은 뼈대라
    한 번만 설명하면 된다 — 그 뼈대를 알고 나면 아래 카드의 「전문 보기」가 읽힌다.
  */
  const anatomy: DocSection = {
    id: 'anatomy',
    title: '스킬 하나는 어떻게 생겼나',
    body: (
      <Stack direction="vertical" gap={3}>
        <Text color="secondary">
          스킬 하나는 SKILL.md 파일 한 장이에요. 맨 위 몇 줄에 이름표가 붙고 그 아래로
          절차가 이어집니다. 아래 여덟 벌이 모두 같은 뼈대를 씁니다.
        </Text>
        <Text size="sm" color="secondary">
          맨 위: 이름표
        </Text>
        <MetadataList columns="single" label={{ position: 'start', width: 120 }}>
          <MetadataListItem label="name">스킬의 코드 이름이에요.</MetadataListItem>
          <MetadataListItem label="description">
            무엇을 하는지 한 줄과, AI가 이 스킬을 언제 꺼낼지 알려주는 트리거 문구예요.
          </MetadataListItem>
          <MetadataListItem label="version">판 번호예요.</MetadataListItem>
        </MetadataList>
        <Text size="sm" color="secondary">
          본문: 다섯 마디
        </Text>
        <MetadataList columns="single" label={{ position: 'start', width: 120 }}>
          <MetadataListItem label="언제 쓰는가">어떤 상황에서 부르는지 적어요.</MetadataListItem>
          <MetadataListItem label="입력">무엇을 주어야 도는지예요.</MetadataListItem>
          <MetadataListItem label="절차">순서대로 밟는 단계예요.</MetadataListItem>
          <MetadataListItem label="하지 말 것">
            틀리기 쉬운 지점이에요. 이 절차서들이 있는 이유이기도 해요.
          </MetadataListItem>
          <MetadataListItem label="출력 형태">무엇이 어떤 모양으로 나오는지예요.</MetadataListItem>
        </MetadataList>
        <Text color="secondary">
          아래 카드마다 「이 절차서 전문 보기」를 열면 그 스킬의 SKILL.md 원문이 그대로 나옵니다.
        </Text>
      </Stack>
    ),
  }

  const tiers: DocSection[] = SKILL_TIERS.flatMap((t) => {
    const items = SKILLS.filter((s) => s.tier === t.tier)
    if (!items.length) return []
    return [
      {
        id: `tier-${t.tier}`,
        title: t.title,
        body: (
          <Stack direction="vertical" gap={3}>
            <Text size="sm" color="secondary">
              {t.who} · {t.note}
            </Text>
            {t.tier === 'local' ? (
              <Text size="sm" color="secondary">
                <Link href="/start/ai">AI에 자료 연결하기</Link>를 먼저 하시면 아래가 열립니다.
              </Text>
            ) : null}
            <Stack direction="vertical" gap={3}>
              {items.map((s) => (
                <SkillCard key={s.id} s={s} body={bodies.get(s.id)} />
              ))}
            </Stack>
          </Stack>
        ),
      },
    ]
  })

  return [
    anatomy,
    ...tiers,
    {
      id: 'source',
      title: '원문을 보시려면',
      body: (
        <Text color="secondary">
          여덟 벌 모두 위에서 「전문 보기」로 펼쳐 볼 수 있어요. 원본 파일은{' '}
          <a href={linkById('repo-skills').href} target="_blank" rel="noreferrer">
            깃허브 저장소
          </a>
          에 있습니다.
        </Text>
      ),
    },
  ]
}

export default function Skills() {
  return (
    <DocShell
      href="/use/skills"
      title="스킬"
      summary={SUMMARY}
      sections={sections()}
      intro={
        <Banner
          status="warning"
          title="대부분은 자료를 컴퓨터에 받아두어야 씁니다"
          description="AI가 인물·관계 파일을 직접 열어 읽어야 하는 작업이라, 파일 없이 문장만 붙여넣으면 읽을 것이 없어 없는 내용을 만들어 냅니다."
        />
      }
    />
  )
}
