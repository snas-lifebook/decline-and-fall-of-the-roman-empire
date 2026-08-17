import Link from 'next/link'
import { Stack, Heading, Text, Table, Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core'
import type { TableColumn } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { TableActions } from '../../../components/TableActions'
import { loadEntities, loadLinks } from '../../../lib/ontology'
import { EXPORT_HEADER, pointTable } from '../../../lib/export/table'
import { pointTitles, POINT_COUNT } from '../../../lib/points'
import { pageMeta } from '../../../lib/meta'

/**
 * 포인트 하나의 표.
 *
 * **표를 진짜 `<table>`로 굽는다.** 미리보기를 코드블록에 넣으면 브라우저
 * Ctrl+F에 한글이 안 잡힌다. 이름이 정적 HTML에 남아야 사람이 찾는다.
 */

export function generateStaticParams() {
  return Array.from({ length: POINT_COUNT }, (_, i) => ({ point: String(i + 1) }))
}

export async function generateMetadata({ params }: { params: Promise<{ point: string }> }) {
  const n = Number((await params).point)
  const title = pointTitles().get(n) ?? ''
  return pageMeta(`포인트 ${String(n).padStart(2, '0')} ${title} 표`)
}

/** astryx Table은 객체 배열을 받는다. 열 순서가 곧 키다 */
type Row = Record<string, string>

/**
 * **여섯 열을 다 그린다.**
 *
 * 예전에는 셋만 그렸다 — 여섯을 그리면 설명 칸이 좁아져 글자가 세로로 늘어졌기
 * 때문이다(실측 5,200px). 원인은 열 수가 아니라 **너비를 안 준 것**이었다.
 *
 * `TableColumn.width`는 `{type:'proportional'}` 리터럴을 그대로 받는다
 * (`Table/types.d.ts`). `proportional()` 팩토리를 부를 필요가 없고, 그래서
 * `'use client'` 경계에 걸리지 않는다. 앞서 "서버에서는 못 준다"고 적어둔 것은
 * 틀렸다.
 *
 * 비율은 글자 길이를 따른다 — 설명이 제일 길고, 종류는 두 글자다.
 */
const COLUMNS: TableColumn<Row>[] = (
  [
    [0, 2], // 이름
    [1, 1], // 종류
    [2, 4], // 이 포인트에서
    [3, 2], // 별칭
    [4, 3], // 관계
    [5, 2], // 등장 포인트
  ] as const
).map(([i, w]) => ({
  key: String(i),
  header: EXPORT_HEADER[i],
  width: { type: 'proportional' as const, value: w, minWidth: 72 },
}))

export default async function PointPage({ params }: { params: Promise<{ point: string }> }) {
  const n = Number((await params).point)
  const rows = pointTable(n, loadEntities(), loadLinks())
  const title = pointTitles().get(n) ?? ''

  const data: Row[] = rows.map((r) => Object.fromEntries(r.map((v, i) => [String(i), v])))

  return (
    <Shell where="가져가기" path="/download" maxWidth={1180}>
      {/*
        빵부스러기가 없어서 30장이 전부 막다른 골목이었다(감사 2026-08-17).
        객체 649장·읽기 30장에는 있는데 여기만 빠져 있었다 — 규칙이 아니라 누락이다.
      */}
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        <BreadcrumbItem href="/download">가져가기</BreadcrumbItem>
        <BreadcrumbItem isCurrent>포인트 {String(n).padStart(2, '0')}</BreadcrumbItem>
      </Breadcrumbs>

      <Stack direction="vertical" gap={1}>
        <Text size="sm" color="secondary">
          포인트 {n}
        </Text>
        <Heading level={1}>{title}</Heading>
        <Text color="secondary">
          이 포인트에 나오는 인물·지명 {rows.length}개입니다. 복사해서 구글시트나 엑셀에
          붙여넣으면 그대로 표가 됩니다.
        </Text>
        {/* 표만 보고 온 사람이 「이게 무슨 대목이지」에서 막힌다. 본문으로 돌아가는 길 */}
        <Text size="sm" color="secondary">
          <Link href={`/read/point/${n}`}>이 대목 본문 읽기</Link>
        </Text>
      </Stack>

      <TableActions point={n} header={[...EXPORT_HEADER]} rows={rows} />


      <Table
        data={data}
        columns={COLUMNS}
        density="compact"
        dividers="grid"
        hasHover
        // 빈 표는 고장으로 보인다. 지금 데이터엔 없지만 말은 해둔다
        emptyState={<Text color="secondary">이 포인트에는 아직 등록된 객체가 없습니다.</Text>}
      />
    </Shell>
  )
}
