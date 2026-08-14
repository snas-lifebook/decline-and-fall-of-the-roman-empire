import { Stack, Heading, Text, ClickableCard, Button } from '@astryxdesign/core'
import { Page } from '../../components/SiteChrome'
import { loadEntities } from '../../lib/ontology'
import { ZIP_URL } from '../../lib/links'
import { pointList } from '../../lib/points'

/**
 * 가져가기 — 포인트를 고르는 목록.
 *
 * **표는 포인트마다 따로 굽는다.** 30포인트를 한 화면에 담으면 브라우저로 가는
 * 데이터가 수백 KB가 된다. 여기는 제목과 객체 수만 놓고 고르게 한다.
 */
export default function DownloadIndex() {
  const entities = loadEntities()

  const points = pointList().map((p) => ({
    ...p,
    count: entities.filter((e) => e.points.includes(p.n)).length,
  }))

  return (
    <Page where="가져가기" path="/download">
      <Stack direction="vertical" gap={1}>
        <Heading level={1}>가져가기</Heading>
        <Text color="secondary">
          발표 준비하시나요? 맡은 포인트를 고르면 그 포인트에 나오는 인물·지명 목록이 나옵니다.
        </Text>
      </Stack>

      <Stack direction="horizontal" gap={3} wrap="wrap">
        {points.map((p) => (
          <ClickableCard
            key={p.n}
            href={`/download/${p.n}`}
            label={`${p.title} (포인트 ${p.n})`}
            width={296}
            padding={4}
          >
            {/* 내 포인트가 몇 번인지 모르는 사람이 온다. 제목이 먼저 읽히고 번호는 보조다 */}
            <Stack direction="vertical" gap={0.5}>
              <Text size="sm" color="secondary">
                포인트 {p.n}
              </Text>
              <Heading level={2}>{p.title}</Heading>
              <Text size="sm" color="secondary">
                객체 {p.count}개
              </Text>
            </Stack>
          </ClickableCard>
        ))}
      </Stack>

      <Stack direction="vertical" gap={1}>
        <Text size="sm" color="secondary">
          포인트를 가리지 않고 자료 전체를 파일로 받으려면 이쪽입니다.
        </Text>
        <Button label="전체 자료 받기" variant="secondary" href={ZIP_URL} />
      </Stack>
    </Page>
  )
}
