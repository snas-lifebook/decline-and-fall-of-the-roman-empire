import Link from 'next/link'
import { Stack, Text, Divider, Grid } from '@astryxdesign/core'
import { FeedbackBox } from './FeedbackBox'
import { dataDate } from '../lib/datadate'
import { siteUpdated, changelog } from '../lib/changelog'
import { navTree } from '../lib/nav'
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
 * 안 남고, 셋으로 묶어 각 묶음에 이름을 달면 그 이름이 나중에 찾을 때의
 * 손잡이가 된다. 근접성(Gestalt)이 경계를 만들고, 제목이 그 경계에 뜻을 준다.
 *
 * 그래서 세 칸 + 바닥 한 줄이다.
 *   자료실   — 이 사이트 안에서 갈 곳 (허브에는 사이드바가 없어 여기가 유일한 목록이다)
 *   바깥 자리 — 사이트 밖으로 나가는 곳
 *   이 사이트  — 사이트 자신에 대한 것
 *   바닥      — 누가 만들었고 언제 것인가. **날짜 둘을 나란히 둔다** — 서로
 *              다른 날짜라 떨어뜨려 놓으면 어느 게 어느 것인지 안 보인다
 *
 * 칸 제목은 `Heading`이 아니라 `Text`다. `.doc h2`의 48px 여백을 안 받아야 하고,
 * 푸터 제목이 화면 목차(`Outline`)에 끼면 안 되기 때문이다.
 */

/** 바깥 자리. 회차에 딸린 것부터 — 지금 쓰는 것이 위에 온다 */
const OUTSIDE = ['drive-01', 'sheet', 'repo']

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack direction="vertical" gap={1.5}>
      <Text size="sm" weight="semibold">
        {title}
      </Text>
      {/*
        `hAlign="start"`가 없으면 칸 안의 **버튼이 가운데로 늘어난다**(「한 줄
        남기기」). 글자 링크는 원래 왼쪽에 붙어 있어서 버튼 하나만 튀어 보였다.
      */}
      <Stack direction="vertical" gap={1} hAlign="start">
        {children}
      </Stack>
    </Stack>
  )
}

export function SiteFooter({ where }: { where: string }) {
  const updated = siteUpdated()

  return (
    <Stack direction="vertical" gap={6} as="footer">
      <Grid columns={{ minWidth: 180 }} gap={6}>
        <Column title="자료실">
          {navTree().map((n) => (
            <Text key={n.href} size="sm" color="secondary">
              <a href={n.href}>{n.title}</a>
            </Text>
          ))}
        </Column>

        <Column title="바깥 자리">
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
              <a href="/changelog">바뀐 것 {changelog().length}건</a>
            </Text>
          ) : null}
          <FeedbackBox where={where} />
        </Column>
      </Grid>

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
        <Text size="sm" color="secondary">
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
