import Link from 'next/link'
import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  Collapsible,
  Markdown,
} from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { docSections } from '../../../../lib/doc'
import { navCrumbs } from '../../../../lib/nav'
import { DocFooterNav } from '../../../../components/DocFooterNav'
import { POINT_COUNT } from '../../../../lib/points'
import { pointDoc } from '../../../../lib/text/point'
import { pageMeta } from '../../../../lib/meta'
import { PointGraph } from '../../../../components/PointGraph'
import { ReadGrid } from '../../../../components/ReadGrid'
import { ReadRail } from '../../../../components/ReadRail'
import { ReadCards } from '../../../../components/ReadCards'
import { MapHover } from '../../../../components/MapHover'
import { MapFollow } from '../../../../components/MapFollow'
import { Faq } from '../../../../components/Faq'
import { faqFor } from '../../../../lib/faq'
import { loadEntities, loadLinks } from '../../../../lib/ontology'
import { readLayout, rowCount, TAIL_TITLE } from '../../../../lib/read/cards'
import { coordsOfPoint } from '../../../../lib/place/coords'
import { renderPointMap } from '../../../../lib/place/svg'

/**
 * 포인트 한 장의 본문.
 *
 * `DocPage`를 그대로 못 쓴다 — 그쪽은 `content/`에서 읽고 여기는 레포 루트의
 * `points/`에서 읽는다. 그래서 **뼈대만 본떠서** 같은 순서로 조립한다.
 *
 * **2026-08-18에 오른쪽을 갈아엎었다.** 전에는 날개에 목차와 관계망이 붙어 있었는데,
 * 이제 그 자리를 **여백 카드**가 쓴다 — 본문에 인물 이름이 나오면 그게 누구인지가
 * 옆에 뜬다(NYT Snow Fall 방식, River 요청). 카드는 스크롤을 따라 바뀌지 않고 그
 * 사람이 **처음 나오는 문단 옆에 박혀** 있다.
 *
 * 그래서 셋이 자리를 옮겼다.
 *   - 목차  → 본문 맨 위 접힌 블록. 포인트 본문은 절이 3~6개라 접으면 한 줄이다
 *   - 관계망 → 본문 끝. 「이 포인트의 관계망」으로 이름을 달았다
 *   - 본문  → `Shell`의 날개를 안 쓰고 `ReadGrid`가 자기 그리드를 갖는다
 *
 * 관계망을 없애지 않은 것은 2026-08-16에 River가 직접 요청해 넣은 것이기 때문이다.
 */

const ENTITIES = loadEntities()
const LINKS = loadLinks()

/**
 * 앞 대목 · 다음 대목.
 *
 * **한 번만 나온다.** 처음엔 위아래 양쪽에 뒀는데, 딸린 자료 넷이 접혀 있으면
 * 둘 사이가 170px밖에 안 돼서 **같은 것이 두 번 찍힌 것으로 읽힌다**(River가 화면을
 * 보고 짚었다). River의 요구는 「딸린 자료보다 먼저」였으므로 앞의 것만 남긴다.
 */
export function generateStaticParams() {
  return Array.from({ length: POINT_COUNT }, (_, i) => ({ n: String(i + 1) }))
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n)
  const { title, lead } = pointDoc(n)
  return pageMeta(`포인트 ${String(n).padStart(2, '0')} ${title}`, lead || undefined)
}

export default async function Point({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n)
  const href = `/read/point/${n}`
  const { title, lead, md } = pointDoc(n)

  const crumbs = navCrumbs(href)
  const layout = readLayout(n, md, ENTITIES, LINKS)
  // 목차만 여기서 쓴다. 본문 자르기는 `ReadGrid`가 블록 단위로 다시 한다
  const { sections } = docSections(md)
  const places = coordsOfPoint(n)

  // 제목·꼬리는 본문 폭에 맞추고, 본문만 카드 폭까지 넓게 쓴다
  const NARROW = { maxWidth: 760, width: '100%' } as const

  return (
    <Shell path={href} where={`읽기 ${title}`} maxWidth={760 + 24 + 340}>
      <Breadcrumbs variant="supporting" style={NARROW}>
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.href} href={c.href} isCurrent={i === crumbs.length - 1}>
            {c.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5} style={NARROW}>
        <Text size="sm" color="secondary">
          포인트 {n}
        </Text>
        <Heading level={1}>{title}</Heading>
        {lead ? (
          <Text size="lg" color="secondary">
            {lead}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label="30포인트 편역본" />
          {/* 붙여넣는 사람은 이게 무슨 글인지부터 알아야 한다. 제목과 소개를 같이 싣는다 */}
          <CopyPageButton markdown={`# ${title}\n\n${lead}\n\n${md}\n`} />
        </Stack>
      </Stack>

      <Divider />

      {/*
        본문 + 여백 카드 + 오른쪽 붙박이(목차·설정).

        **목차와 설정이 그리드 안으로 들어왔다.** 앞 판은 목차를 본문 위 접힌 블록에,
        설정을 본문 위에 띄워 뒀는데 River가 「목차가 사이드에서 없어졌는데 스크롤 할
        때 절도 뜨고 카드 뉴스도 떠야 좋을 것 같은데」·「설정 토글이 디자인적으로 맞는
        자리도 아닌 것 같고 일관성이 없어서」라고 짚었다. 오른쪽 340px 한 칸이
        **맥락을 담는 자리**로 정해졌고, 목차·카드·설정이 다 거기 산다.
      */}
      <ReadGrid
        layout={layout}
        rail={
          <ReadRail
            // 레일이 열 전체를 차지해야 첫 문단 아래가 안 벌어지고 sticky도 산다
            rows={rowCount(layout)}
            /*
              **목차에서도 「등장 객체」를 뺀다.** 그건 절이 아니라 딸린 목록이고,
              이제 본문 밖 토글로 나간다. 안 빼면 목차를 눌렀을 때 아무 데도 안 간다 —
              그 id가 본문에 더는 없기 때문이다.
            */
            items={sections
              .filter((s) => s.title !== TAIL_TITLE)
              .map((s) => ({ id: s.id, label: s.title, level: 2 }))}
          />
        }
      />
      <ReadCards />

      {/*
        **말없이 자르지 않는다.** 포인트 13은 27명이 나와서 다 세우면 네 문단 중
        셋에 카드가 붙는다. 관계가 얽힌 순으로 잘랐고, 몇 중 몇인지 여기 적는다.
        관계 연표가 쓰는 방식과 같다.
      */}
      {layout.total > layout.cards.length ? (
        <div style={NARROW}>
          <Text size="sm" color="secondary">
            이 포인트에 서술이 딸린 인물·집단이 {layout.total}이라, 관계가 많이 얽힌{' '}
            {layout.cards.length}만 옆에 세웠습니다. 나머지는 본문 링크로 있습니다.
          </Text>
        </div>
      ) : null}


      {/*
        **앞뒤로 넘어가는 길이 딸림 자료보다 먼저다.** 본문을 다 읽은 사람이 제일 자주
        하는 일은 다음 대목으로 가는 것이지 관계망을 보는 것이 아니다. 앞 판은 지도·
        관계망·표·FAQ 넷을 다 지나야 나왔다(River 지적).
      */}
      <div style={NARROW}>
        {/* 앞뒤 링크는 딸린 자료보다 위다. 앞뒤 카드 한 줄이 그 「먼저 넘어가는 길」이다 */}
        <DocFooterNav href={href} />
      </div>

      <Divider />

      {/*
        딸린 자료 넷은 **접어 둔다.** 넷 다 펴 두면 본문보다 길어져서, 다 읽고 내려온
        사람이 「끝」을 못 찾는다. 제목만 남기면 무엇이 있는지는 알면서 자리는 안 먹는다.

        지도만 예외로, 「본문 아래」로 고른 사람에게는 펴진 채 뜬다 — 그 설정을 고른
        뜻이 곧 「다 읽고 한 번에 훑겠다」이기 때문이다.
      */}
      <div style={NARROW}>
        {/*
          **지도는 한 벌만 그린다.** 「본문 아래」와 「지명에 올릴 때」가 같은 SVG를 쓰고
          자리만 CSS가 바꾼다 — 두 벌을 그리면 한쪽을 고칠 때 다른 쪽이 조용히 어긋난다.

          이 자리에 둬야 **지도가 안 뜨는 설정에서도 본문이 먼저 읽힌다** — 낭독기와
          검색엔진이 보는 순서가 이것이다.
        */}
        {/*
          **지도만 토글이 아니다.** River가 「이 포인트의 지도(마지막에는 그냥 뜨게)」라고
          괄호로 따로 적었다. 접으면 안 되는 실질적 이유도 있다 — 「지명에 올릴 때」
          모드에서 이 자리가 **호버 패널의 몸통**이라, 접혀 있으면 마우스를 올려도
          띄울 것이 없다. 한 벌만 그리기로 한 값이다.
        */}
        <div className="map-slot">
          <Stack direction="vertical" gap={1.5} as="section">
            <Heading level={2}>이 포인트의 지도</Heading>
            {/* 「옆에」로 옮겨졌을 때만 보인다. globals.css .map-follow-hint가 켠다 (#2) */}
            <Text size="sm" color="secondary" className="map-follow-hint">
              스크롤을 따라 지도가 움직여요
            </Text>
            {/* 가계도·연표와 같은 방식으로 빌드 때 굽는다. 클라이언트 JS 0줄 */}
            <div className="point-map" dangerouslySetInnerHTML={{ __html: renderPointMap(places) }} />
            <Text size="sm" color="secondary">
              지명 {places.length}곳. 이름을 누르면 그 화면으로 갑니다. 테두리만 있는 점은 위치가
              추정입니다.
            </Text>
          </Stack>
        </div>
      </div>
      <MapHover />
      <MapFollow />

      {/*
        관계망이 날개에서 본문 끝으로 내려왔다 — 그 자리를 여백 카드가 쓴다.
        카드가 「이 사람이 누구인가」에 답하므로, 그림은 다 읽고 나서 「그래서
        누가 누구 편이었나」를 되짚는 자리가 더 맞는다.
      */}
      {/*
        **「등장 객체」도 접는다.** 본문 md의 마지막 절인데 인물·지명·사건을 종류별로
        늘어놓은 **목록**이라, 그대로 두면 다 읽고 내려온 사람이 링크 예순 개짜리
        벽을 만난다(River가 화면을 보고 짚었다). 읽는 글이 아니라 딸린 자료이므로
        아래 셋과 한 줄로 선다.
      */}
      {layout.tail.length ? (
        <div style={NARROW}>
          <Collapsible defaultIsOpen={false} trigger="이 포인트의 등장 객체">
            <Stack direction="vertical" gap={2}>
              {layout.tail.map((block, i) => (
                // 제목 줄은 토글 이름이 이미 말하므로 빼고 목록만 낸다.
                // pointDoc이 `###`을 `##`로 한 단 올리므로 `#{2,4}`로 찾는다 —
                // `###`만 찾다가 30개 대목에서 하나도 안 걸렸다(감사 2026-08-20, cards.ts와 같은 함정)
                <Markdown key={i}>{i === 0 ? block.replace(/^#{2,4}[^\n]*\n?/, '') : block}</Markdown>
              ))}
            </Stack>
          </Collapsible>
        </div>
      ) : null}

      <div style={NARROW}>
        <Collapsible defaultIsOpen={false} trigger="이 포인트의 관계망">
          <PointGraph point={n} entities={ENTITIES} links={LINKS} />
        </Collapsible>
      </div>

      {/*
        **본문에서 표로 가는 길.** 감사(2026-08-17)가 잡은 동선 결함이다 — 30장
        어디에도 `/download/N` 단서가 없어서, 본문을 읽고 발표 표가 필요해진
        사람이 사이드바 「가져가기」로 나가 포인트를 다시 골라야 했다(+2클릭).
        읽던 자리에서 바로 넘어간다.
      */}
      <div style={NARROW}>
        <Collapsible defaultIsOpen={false} trigger="이 포인트를 표로 받기">
          <Text color="secondary">
            여기 나온 인물·지명을 <Link href={`/download/${n}`}>표 한 장</Link>으로 받아 시트에
            붙여넣을 수 있습니다.
          </Text>
        </Collapsible>
      </div>

      {/*
        FAQ도 통째로 접는다. **제목은 `Faq`에 안 맡기고 여기서 단다** — 안 그러면
        「자주 묻는 것」이 토글 이름으로 한 번, 그 안의 제목으로 또 한 번 나온다.
        `/faq` 화면은 분류마다 제목이 필요해서 그쪽 기본값은 그대로 둔다.
      */}
      <div style={NARROW}>
        <Collapsible defaultIsOpen={false} trigger="자주 묻는 것">
          <Faq items={faqFor(href)} title={null} />
        </Collapsible>
      </div>
    </Shell>
  )
}
