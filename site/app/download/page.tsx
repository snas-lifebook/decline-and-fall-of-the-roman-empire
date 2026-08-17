import { Stack, Heading, Text, Divider, Markdown, List, ListItem } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { CopyPageButton } from '../../components/CopyPageButton'
import { DataShape } from '../../components/DataShape'
import { loadDoc, docSections } from '../../lib/doc'
import { loadEntities } from '../../lib/ontology'
import { pointList } from '../../lib/points'
import { pageMeta } from '../../lib/meta'

/**
 * 가져가기 — 「자료가 어떻게 생겼나」를 먼저 읽히고, 그다음 포인트를 고르게 한다.
 *
 * 예전에는 포인트 카드 30장만 깔려 있었다. 처음 오신 분은 무엇을 고르는 화면인지
 * 모른 채 카드부터 만났다. 본문(`content/download.md`)이 앞에 서서 자료의 생김새와
 * 통째로 받는 법을 먼저 말한다.
 *
 * `DocPage`를 쓰지 않는다 — 본문 뒤에 포인트 목록이 더 붙어야 한다. 조립 순서만
 * `DocPage`에서 그대로 본떴다.
 *
 * **표는 포인트마다 따로 굽는다.** 30포인트를 한 화면에 담으면 브라우저로 가는
 * 데이터가 수백 KB가 된다. 여기는 제목과 객체 수만 놓고 고르게 한다.
 */

// 모듈 수준에서 한 번만. 빌드 때 한 번 읽고 끝난다
const doc = loadDoc('/download')
const { intro, sections } = docSections(doc.body)
const entities = loadEntities()

const points = pointList().map((p) => ({
  ...p,
  count: entities.filter((e) => e.points.includes(p.n)).length,
}))

const two = (n: number) => String(n).padStart(2, '0')

export const metadata = pageMeta('가져가기')

export default function DownloadIndex() {
  // 붙여넣는 사람은 이게 무슨 문서인지부터 알아야 한다. 제목과 부제를 같이 싣는다
  const markdown = `# ${doc.title}\n\n${doc.summary}\n\n${doc.body}\n`

  return (
    <Shell where="가져가기" path="/download">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>{doc.title}</Heading>
        {doc.summary ? (
          <Text size="lg" color="secondary">
            {doc.summary}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1}>
          <CopyPageButton markdown={markdown} />
        </Stack>
      </Stack>

      <Divider />

      {intro ? <Markdown>{intro}</Markdown> : null}

      {/*
        「자료가 어떻게 생겼나」는 마크다운에서 뺐다. 손으로 적은 표 셋이었는데
        숫자(644·667)가 두 화면에 두 벌로 있었고, 데이터가 바뀌면 조용히 거짓말이
        됐다. 이제 `lib/datashape.ts`가 **파일을 세고 첫 줄을 읽어서** 만든다.
      */}
      <DataShape />

      <Stack direction="vertical" gap={0}>
        {sections.map((s) => (
          <Stack key={s.id} direction="vertical" gap={0} id={s.id} as="section">
            <Heading level={2}>{s.title}</Heading>
            <Markdown>{s.md}</Markdown>
          </Stack>
        ))}
      </Stack>

      <Stack direction="vertical" gap={2}>
        <Heading level={2}>포인트별 표</Heading>
        {/* 카드 격자였을 때 스크롤이 세 배 길었다. 고르기만 하는 목록에 카드는 과하다 */}
        <List density="spacious" hasDividers>
          {points.map((p) => (
            <ListItem
              key={p.n}
              label={`${two(p.n)} ${p.title}`}
              description={`객체 ${p.count}개`}
              href={`/download/${p.n}`}
            />
          ))}
        </List>
      </Stack>
    </Shell>
  )
}
