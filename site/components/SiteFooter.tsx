import NextLink from 'next/link'
import { Stack, Text, Divider, Grid, Link } from '@astryxdesign/core'
import { FeedbackBox } from './FeedbackBox'
import { dataDate } from '../lib/datadate'
import { siteUpdated } from '../lib/changelog'
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

// 무게 기반 짐싣기 재배치(`pack`)를 버렸다 — 링크가 늘면 묶음이 다른 칸으로 튀어
// 불안정했고 둘째 줄 묶음(가져가기·읽기·이 사이트)이 안 맞았다(River #24, 2026-08-20).
// 이제 각 갈래가 자기 격자 칸에 고정된다 — 행이 저절로 맞고, 링크가 늘어도 그 칸만 자란다.

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
    // 헤더(14px/600/primary)와 링크(12px/secondary)를 크기·굵기·색 세 축으로 가른다
    // (Claude 실측). astryx Link를 써야 globals.css:634의 accent+밑줄이 안 걸린다(헌장15)
    <Stack direction="vertical" gap={3}>
      {href ? (
        <Link href={href} color="primary" weight="semibold">
          {title}
        </Link>
      ) : (
        <Text weight="semibold">{title}</Text>
      )}
      <Stack direction="vertical" gap={2} hAlign="start">
        {children}
      </Stack>
    </Stack>
  )
}

export function SiteFooter({ where }: { where: string }) {
  const updated = siteUpdated()

  // 허브도 다른 문서와 **같은 구성**의 푸터를 쓴다(River, 2026-08-20). 앞서 허브만
  // 접고 가운데 정렬하던 `compact`를 걷었다 — 전 화면 푸터가 한 모양이라야 한다.
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
        자료가 처음이면 <NextLink href="/start">{navLabel('/start')}</NextLink>부터 보세요.
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
      <FooterGrid updated={updated} />

      <Divider />

      {/*
        Apple 저작권 행 — 「Copyright © 2026 … All rights reserved. Terms · Privacy」
        형식(River, 2026-08-20). 우리에게 없는 약관·개인정보 페이지는 안 만들고, 실재하는
        것(자료 기준일·화면 갱신·출처와 저작권)만 12px muted 한 줄에 「·」로 잇는다.
        연도는 자료 기준일에서 뽑아 손으로 안 적는다. 날짜 둘은 서로 다른 것이라 붙인다.
      */}
      <Text size="sm" color="secondary" className="footer-varies">
        © {dataDate().slice(0, 4)} 산스 인생책 편데{' · '}자료 기준일 <strong>{dataDate()}</strong>
        {updated ? (
          <>
            {' · '}화면 갱신 <strong>{updated}</strong>
          </>
        ) : null}
        {' · '}
        <NextLink href="/about">출처와 저작권</NextLink>
      </Text>
    </Stack>
  )
}

/** 링크 묶음 격자. 넷을 한 줄에 세우고 높이를 고르게 맞춘다 */
function FooterGrid({ updated }: { updated?: string | null }) {
  const groups: { key: string; node: React.ReactNode }[] = []

  /*
    다섯 장을 편다. 깊이는 자식 한 겹까지만 — 「읽기」 밑에는 책이 둘(30포인트
    편역본·기번 원전)뿐이지만 그 책 밑에는 포인트가 서른셋 더 있다. `navTree()`가
    [장 → 자식] 두 겹 구조라 `.children`만 읽으면 손자는 저절로 안 걸린다.
    `ready: false`인 장·항목은 아직 없는 화면이라 뺀다.

    허브에서는 통째로 접는다(`compact`) — 이유는 `SiteFooter`의 prop 주석에.
  */
  // 다섯 장을 편다(허브도 다른 문서와 같은 구성). 깊이는 자식 한 겹까지만
  for (const n of navTree().filter((x) => x.ready)) {
    const kids = (n.children ?? []).filter((c) => c.ready)
    groups.push({
      key: n.href,
      node: (
        <Column title={n.title} href={n.href}>
          {kids.map((c) => (
            <Link key={c.href} href={c.href} size="sm" color="secondary">
              {c.title}
            </Link>
          ))}
        </Column>
      ),
    })
  }

  groups.push({
    key: 'outside',
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
                {/* isExternalLink가 target+rel+새창 아이콘+낭독기 안내를 한 번에 준다(헌장15) */}
                <Link href={l.href} isExternalLink size="sm" color="secondary">
                  {l.title}
                </Link>
              </Stack>
            )
          })}
        <Link href="/start/links" size="sm" color="secondary">
          작업 공간 전체
        </Link>
      </Column>
    ),
  })

  groups.push({
    key: 'site',
    node: (
      <Column title="이 사이트">
        {/*
          **`/faq`는 어디서도 안 걸려 있었다** — 739장 통틀어 수신 링크 0건에
          사이드바에도 검색 색인에도 없었다(감사 2026-08-17). 24문답이 팀원 질문
          대부분을 이미 답하는데 아무도 못 찾으니, 같은 질문이 단톡방에 다시 올라온다.
          푸터가 가장 싼 자리다 — 전 화면에 붙는다.
        */}
        <Link href="/faq" size="sm" color="secondary">
          FAQ
        </Link>
        <Link href="/about" size="sm" color="secondary">
          About
        </Link>
        {updated ? (
          <Link href="/changelog" size="sm" color="secondary">
            Update
          </Link>
        ) : null}
      </Column>
    ),
  })

  // 각 갈래가 자기 격자 칸이다 — 행 정렬이 저절로 맞고(같은 행 칸은 같은 높이),
  // 링크가 늘어도 그 칸만 자라지 다른 칸이 안 뒤섞인다 (River #24, pack() 폐기)
  return (
    <Grid columns={4} gap={8}>
      {groups.map((g) => (
        <div key={g.key}>{g.node}</div>
      ))}
    </Grid>
  )
}
