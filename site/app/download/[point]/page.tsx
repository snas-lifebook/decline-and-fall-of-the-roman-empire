import Link from 'next/link'
import { Stack, Heading, Text, Table } from '@astryxdesign/core'
import type { TableColumn } from '@astryxdesign/core'
import { Page } from '../../../components/SiteChrome'
import { TableActions } from '../../../components/TableActions'
import { loadEntities, loadLinks } from '../../../lib/ontology'
import { EXPORT_HEADER, pointTable } from '../../../lib/export/table'
import { pointTitles, POINT_COUNT } from '../../../lib/points'

/**
 * 포인트 하나의 표.
 *
 * **표를 진짜 `<table>`로 굽는다.** 미리보기를 코드블록에 넣으면 브라우저
 * Ctrl+F에 한글이 안 잡힌다. 이름이 정적 HTML에 남아야 사람이 찾는다.
 */

export function generateStaticParams() {
  return Array.from({ length: POINT_COUNT }, (_, i) => ({ point: String(i + 1) }))
}

/** astryx Table은 객체 배열을 받는다. 열 순서가 곧 키다 */
type Row = Record<string, string>

/**
 * **화면에는 읽을 것만, 시트에는 전부.**
 *
 * 여섯 열을 다 그리면 설명 칸이 좁아져 글자가 세로로 늘어진다(실측: 5,200px).
 * 별칭과 등장 포인트는 시트에 붙여놓고 쓰는 값이지 화면에서 읽는 값이 아니다.
 * 복사·CSV는 그대로 여섯 열을 다 내보낸다.
 *
 * 열 너비를 손으로 주지 않는 이유: astryx의 `proportional()`은 `dist/index.js`가
 * 통째로 `'use client'`라 서버에서 못 부르고, 그 함수가 만드는 객체 모양을
 * 베끼면 문서화 안 된 내부 구조에 매인다 — astryx는 7주에 0.1에서 0.4로 갔다.
 */
// 이름 · 이 포인트에서 · 관계. 「종류」는 뺐다 — 두 글자인데 열 하나를 통째로
// 먹고, 「메시나 전투」가 사건인 것은 이름만 봐도 안다. 시트에는 그대로 간다.
const SCREEN_COLUMNS = [0, 2, 4]

const COLUMNS: TableColumn<Row>[] = SCREEN_COLUMNS.map((i) => ({
  key: String(i),
  header: EXPORT_HEADER[i],
}))

export default async function PointPage({ params }: { params: Promise<{ point: string }> }) {
  const n = Number((await params).point)
  const rows = pointTable(n, loadEntities(), loadLinks())
  const title = pointTitles().get(n) ?? ''

  const data: Row[] = rows.map((r) => Object.fromEntries(r.map((v, i) => [String(i), v])))

  return (
    <Page where="가져가기" path="/download">
      <Stack direction="vertical" gap={1}>
        <Link href="/download" style={{ textDecoration: 'none' }}>
          <Text size="sm" color="secondary">
            포인트 목록으로
          </Text>
        </Link>
        <Text size="sm" color="secondary">
          포인트 {n}
        </Text>
        <Heading level={1}>{title}</Heading>
        <Text color="secondary">
          이 포인트에 나오는 인물·지명 {rows.length}개입니다. 복사해서 구글시트나 엑셀에
          붙여넣으면 그대로 표가 됩니다.
        </Text>
      </Stack>

      <TableActions point={n} header={[...EXPORT_HEADER]} rows={rows} />

      <Text size="sm" color="secondary">
        화면에는 세 칸만 보입니다. 복사하거나 내려받으면 종류·별칭·등장 포인트까지 여섯 칸이 다
        들어갑니다.
      </Text>

      <Table
        data={data}
        columns={COLUMNS}
        density="compact"
        dividers="grid"
        hasHover
        // 빈 표는 고장으로 보인다. 지금 데이터엔 없지만 말은 해둔다
        emptyState={<Text color="secondary">이 포인트에는 아직 등록된 객체가 없습니다.</Text>}
      />
    </Page>
  )
}
