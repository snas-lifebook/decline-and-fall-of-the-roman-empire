import { Stack, Grid, Heading, Text, Divider, ClickableCard } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { ENTITY_TYPES, loadEntities, type Entity } from '../../lib/ontology'
import { TYPE_KO } from '../../lib/export/table'
import { pageMeta } from '../../lib/meta'

/**
 * 찾아보기 랜딩 — 목록이지 설명 페이지가 아니다(`/start`와 같은 규율).
 *
 * 카드 설명은 타입의 정의가 아니라 **무엇이 거기 들어 있나**로 쓴다. "person 타입"은
 * 아무에게도 아무것도 알려주지 않는다.
 */

const TYPE_DESC: Record<Entity['type'], string> = {
  person: '황제·장군·황후처럼 책에 이름이 나오는 사람',
  place: '도시·강·속주처럼 일이 벌어진 곳',
  group: '부족·군단·교파처럼 무리로 움직인 쪽',
  event: '전투·즉위·박해처럼 일어난 일',
  institution: '원로원·친위대처럼 오래 굴러간 장치',
  work: '책·법전·기념물처럼 남은 것',
  period: '오현제 시대처럼 시간을 묶어 부르는 이름',
}

// 644개를 장마다 다시 읽지 않는다. 모듈 한 번이면 된다
const COUNTS = (() => {
  const all = loadEntities()
  return ENTITY_TYPES.map((type) => ({
    type,
    count: all.filter((e) => e.type === type).length,
  })).sort((a, b) => b.count - a.count)
})()

export const metadata = pageMeta('찾아보기')

export default function Objects() {
  return (
    <Shell path="/objects" where="찾아보기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>찾아보기</Heading>
        <Text size="lg" color="secondary">
          이 사람이 누구 편이었는지, 그 도시가 어느 포인트에 나왔는지 헷갈리실 때 보는 곳입니다.
        </Text>
      </Stack>

      <Divider />

      <Grid columns={{ minWidth: 240 }} gap={3}>
        {COUNTS.map(({ type, count }) => (
          <ClickableCard
            key={type}
            href={`/objects/${type}`}
            label={`${TYPE_KO[type]} ${count}개`}
            padding={4}
          >
            <Stack direction="vertical" gap={0.5}>
              <Heading level={2}>{TYPE_KO[type]}</Heading>
              <Text size="sm" color="secondary">
                {count}개
              </Text>
              <Text size="sm" color="secondary">
                {TYPE_DESC[type]}
              </Text>
            </Stack>
          </ClickableCard>
        ))}
      </Grid>

      {/* 집중해서 읽기에서 나가는 길. 사연은 `app/objects/[type]/[slug]/page.tsx`에 적었다 */}
    </Shell>
  )
}
