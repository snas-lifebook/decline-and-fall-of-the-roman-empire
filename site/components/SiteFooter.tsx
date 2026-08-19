import Link from 'next/link'
import { Stack, Text, Divider, Grid } from '@astryxdesign/core'
import { FeedbackBox } from './FeedbackBox'
import { dataDate } from '../lib/datadate'
import { siteUpdated, changelog } from '../lib/changelog'
import { navTree, navLabel } from '../lib/nav'
import { linkById } from '../lib/links'

/**
 * 화면 맨 아래.
 *
 * **앞 판은 여섯 종류의 정보가 같은 크기·같은 색으로 한 줄에 흘렀다.**
 * 조직 이름 · 자료 날짜 · 화면 날짜 · 바깥 링크 · 소개 링크 · 문의 · 안내가
 * 구분 없이 이어져서, 눈이 묶을 단위가 없었다. River의 지적이 그것이다.
 *
 * 고친 원리는 하나다 — **묶고 이름을 붙인다.**
 * 사람은 한 번에 대여섯 덩어리까지만 붙든다. 열두 개가 평평하게 놓이면 하나도
 * 안 남고, 묶어 각 묶음에 이름을 달면 그 이름이 나중에 찾을 때의
 * 손잡이가 된다. 근접성(Gestalt)이 경계를 만들고, 제목이 그 경계에 뜻을 준다.
 *
 * **2026-08-19 재설계.** 앞 판은 「자료실」 한 칸에 다섯 장(읽기·찾아보기·
 * 가져가기·활용하기·시작하기) 제목만 나열했다 — San 지적: "맨 아래 뭐부터
 * 붙어 이건가." 그 밑에 뭐가 있는지 안 보이니 처음 온 사람은 다섯 장 이름만
 * 보고 어디로 갈지 정해야 했다. docs.claude.com·Stripe 문서를 실측하니 공통
 * 패턴이 하나다 — **큰 갈래마다 자기 칸을 갖고, 그 아래 한 겹만 펼친다**
 * (docs.claude.com은 Company·Learn 등 네 칸에 27개 링크, Stripe 문서 홈은
 * 여섯 갈래에 상품별 링크). 그래서 다섯 장을 각자 칸으로 펴고, 「작업 공간」
 * (바깥 자료로 가는 길)과 「이 사이트」를 그 옆에 둔다. 일곱 칸이지만 실측
 * 사례와 같은 자릿수다 — 칸이 늘어난 게 아니라 이미 있던 다섯 장의 속을
 * 보여준 것뿐이다.
 *
 *   읽기·찾아보기·가져가기·활용하기·시작하기 — 각 장 + 그 아래 한 겹
 *   작업 공간 — 사이트 밖 자료로 곧장 가는 길 (구 「바로가기」, San이 부르는
 *              이름 그대로 — `/start/links` 화면과 같은 이름이라야 그 화면
 *              「작업 공간」과 이 칸이 같은 것임을 안다)
 *   이 사이트  — 사이트 자신에 대한 것
 *   바닥      — 누가 만들었고 언제 것인가. **날짜 둘을 나란히 둔다** — 서로
 *              다른 날짜라 떨어뜨려 놓으면 어느 게 어느 것인지 안 보인다
 *
 * 칸 제목은 `Heading`이 아니라 `Text`다. `.doc h2`의 48px 여백을 안 받아야 하고,
 * 푸터 제목이 화면 목차(`Outline`)에 끼면 안 되기 때문이다.
 */

/** 작업 공간. 회차에 딸린 것부터 — 지금 쓰는 것이 위에 온다 */
const OUTSIDE = ['drive-01', 'sheet', 'repo']

/**
 * 묶음 여럿을 칸 `n`개에 **높이가 고르게** 나눠 담는다.
 *
 * 앞 판은 묶음 하나가 격자 칸 하나였다. 그러면 격자 줄 높이가 그 줄에서 가장 긴
 * 묶음을 따라가서, 「찾아보기」(8개) 옆의 「읽기」(2개) 아래에 여섯 줄짜리 구멍이
 * 뚫린다. 그리고 일곱 묶음이 네 칸에 안 떨어져 둘째 줄에 하나가 혼자 남는다
 * (River 스크린샷, 2026-08-19).
 *
 * `code.claude.com` 푸터는 **넷이 한 줄**이고 칸마다 높이가 비슷하다. 그렇게
 * 하려면 칸 하나가 묶음을 둘까지 쌓을 수 있어야 한다. 큰 것부터 꺼내 그때그때
 * 가장 짧은 칸에 얹는다 — 짐 싣기에서 쓰는 그 방법이고, 일곱 개쯤이면 이걸로
 * 충분히 고르게 떨어진다.
 */
function pack<T extends { weight: number }>(groups: T[], n: number): T[][] {
  const cols: { load: number; items: T[] }[] = Array.from({ length: n }, () => ({
    load: 0,
    items: [],
  }))
  for (const g of [...groups].sort((a, b) => b.weight - a.weight)) {
    const lightest = cols.reduce((a, b) => (b.load < a.load ? b : a))
    lightest.items.push(g)
    lightest.load += g.weight
  }
  return cols.map((c) => c.items)
}

function Column({
  title,
  href,
  children,
}: {
  title: string
  /** 있으면 칸 제목 자체가 그 장으로 가는 링크가 된다 (읽기·찾아보기 등) */
  href?: string
  children: React.ReactNode
}) {
  return (
    <Stack direction="vertical" gap={1.5}>
      <Text size="sm" weight="semibold">
        {href ? <a href={href}>{title}</a> : title}
      </Text>
      <Stack direction="vertical" gap={1} hAlign="start">
        {children}
      </Stack>
    </Stack>
  )
}

export function SiteFooter({
  where,
  /**
   * 다섯 장 칸을 접는다. **허브에서만 켠다.**
   *
   * 푸터를 편 뒤 실측했더니 갈래 비중이 화면마다 갈렸다. 안쪽 화면은 원래
   * 사이드바가 138개를 이고 있어서 푸터 30개가 더해져도 티가 안 나는데,
   * **허브만 본문 비중이 26%에서 13%로 반토막 났다.** 갈림길 다섯을 고르라는
   * 화면에서 푸터가 같은 다섯을 자식까지 달고 또 세우기 때문이다.
   *
   * 이 화면은 이미 같은 이유로 사이드바를 끈다 — 「갈림길에 갈림길을 또 놓으면
   * 그게 헷갈림이다」(`app/page.tsx`). 푸터도 같은 규율을 따른다.
   *
   * 접는 것은 다섯 장 칸뿐이다. 「작업 공간」과 「이 사이트」는 허브 본문에
   * 없으므로 그대로 둔다.
   */
  compact = false,
}: {
  where: string
  compact?: boolean
}) {
  const updated = siteUpdated()

  return (
    <Stack direction="vertical" gap={6} as="footer">
      {/*
        **「한 줄 남기기」가 제 줄을 갖는다.** 앞 판은 「이 사이트」 칸의 링크
        셋 밑에 고스트 단추로 끼어 있었는데, 옆의 것들은 「눌러서 가는 곳」이고
        이것만 「눌러서 여는 것」이라 같은 줄에 설 물건이 아니었다(River 지적).
        푸터에서 유일하게 **사람이 뭔가 하는 자리**이므로 맨 위에 혼자 둔다.
      */}
      <FeedbackBox where={where} />

      <Divider />

      {/*
        퀵스타트 진입점. 문서 사이트마다 있는 "처음 오셨으면 여기부터" 자리가
        우리에게 없었다(San 지적, 2026-08-19). 다섯 칸 중 어디부터 볼지 스스로
        정하지 않아도 되게, 칸을 펼치기 전에 갈 곳을 먼저 하나 준다.
      */}
      <Text size="sm" color="secondary">
        자료가 처음이면 <Link href="/start">{navLabel('/start')}</Link>부터 보세요.
      </Text>

      {/*
        **칸 수를 고정한다.** 앞 판은 `minWidth: 180` 자동 흐름이라 폭에 따라 칸 수가
        3~4로 바뀌었고, 그러면 항목 수가 제각각인 일곱 묶음이 들쭉날쭉하게 흘렀다 —
        「찾아보기」 여덟 개가 한 줄을 통째로 늘리고 자식이 없는 「가져가기」가 그
        옆에 빈 칸으로 남았다(River 스크린샷, 2026-08-19).

        `code.claude.com` 푸터를 보면 네 칸이 고정이고 칸마다 3~7개가 들어 있다.
        같은 모양으로 넷을 고정하고, **항목이 많은 묶음을 앞에 둬서** 각 줄이 위에서
        아래로 짧아지게 한다. 빈 칸이 줄 가운데 뚫리는 일이 없어진다.
      */}
      <FooterGrid compact={compact} updated={updated} />

      <Divider />

      <Stack direction="vertical" gap={1}>
        <Text size="sm" weight="semibold">
          산스 인생책 편데
        </Text>
        <Text size="sm" color="secondary">
          기번 『로마제국쇠망사』 편역본과 인물·관계 자료를 발표와 토론에 쓰려고 모아둔 곳입니다.
          암호 없이 열리지만 검색에는 안 걸립니다.
        </Text>
        {/* 날짜 둘은 서로 다른 것이라 반드시 붙여 놓는다 — 떨어지면 헷갈린다 */}
        <Text size="sm" color="secondary" className="footer-varies">
          자료 기준일 <strong>{dataDate()}</strong>
          {updated ? (
            <>
              {' · '}화면 갱신 <strong>{updated}</strong>
            </>
          ) : null}
        </Text>
      </Stack>
    </Stack>
  )
}

/** 링크 묶음 격자. 넷을 한 줄에 세우고 높이를 고르게 맞춘다 */
function FooterGrid({ compact, updated }: { compact: boolean; updated?: string | null }) {
  const groups: { key: string; weight: number; node: React.ReactNode }[] = []

  /*
    다섯 장을 편다. 깊이는 자식 한 겹까지만 — 「읽기」 밑에는 책이 둘(30포인트
    편역본·기번 원전)뿐이지만 그 책 밑에는 포인트가 서른셋 더 있다. `navTree()`가
    [장 → 자식] 두 겹 구조라 `.children`만 읽으면 손자는 저절로 안 걸린다.
    `ready: false`인 장·항목은 아직 없는 화면이라 뺀다.

    허브에서는 통째로 접는다(`compact`) — 이유는 `SiteFooter`의 prop 주석에.
  */
  if (!compact) {
    for (const n of navTree().filter((x) => x.ready)) {
      const kids = (n.children ?? []).filter((c) => c.ready)
      groups.push({
        key: n.href,
        weight: kids.length + 1,
        node: (
          <Column title={n.title} href={n.href}>
            {kids.map((c) => (
              <Text key={c.href} size="sm" color="secondary">
                <a href={c.href}>{c.title}</a>
              </Text>
            ))}
          </Column>
        ),
      })
    }
  }

  groups.push({
    key: 'outside',
    weight: OUTSIDE.length + 2,
    node: (
      <Column title="작업 공간">
          {OUTSIDE.map((id) => {
            const l = linkById(id)
            return (
              <Stack key={id} direction="horizontal" gap={2} vAlign="center">
                {/* 아이콘이 있으면 목록에서 즉시 갈린다. 없는 것은 안 그린다 */}
                {l.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.icon} alt="" width={16} height={16} />
                ) : null}
                <Text size="sm" color="secondary">
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.title}
                  </a>
                </Text>
              </Stack>
            )
          })}
        <Text size="sm" color="secondary">
          <Link href="/start/links">작업 공간 전체</Link>
        </Text>
      </Column>
    ),
  })

  groups.push({
    key: 'site',
    weight: (updated ? 3 : 2) + 1,
    node: (
      <Column title="이 사이트">
        {/*
          **`/faq`는 어디서도 안 걸려 있었다** — 739장 통틀어 수신 링크 0건에
          사이드바에도 검색 색인에도 없었다(감사 2026-08-17). 24문답이 팀원 질문
          대부분을 이미 답하는데 아무도 못 찾으니, 같은 질문이 단톡방에 다시 올라온다.
          푸터가 가장 싼 자리다 — 전 화면에 붙는다.
        */}
        <Text size="sm" color="secondary">
          <a href="/faq">자주 묻는 것</a>
        </Text>
        <Text size="sm" color="secondary">
          <a href="/about">이 자료실은</a>
        </Text>
        {updated ? (
          <Text size="sm" color="secondary">
            <a href="/changelog" className="footer-varies">
              바뀐 것 {changelog().length}건
            </a>
          </Text>
        ) : null}
      </Column>
    ),
  })

  // 허브는 묶음이 둘뿐이라 넷으로 벌리면 절반이 빈다
  const cols = compact ? 2 : 4

  return (
    <Grid columns={cols} gap={6}>
      {pack(groups, cols).map((bucket, i) => (
        <Stack key={i} direction="vertical" gap={6}>
          {bucket.map((g) => (
            <div key={g.key}>{g.node}</div>
          ))}
        </Stack>
      ))}
    </Grid>
  )
}
