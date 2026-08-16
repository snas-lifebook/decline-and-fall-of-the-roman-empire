import { Stack, Heading, Text, Banner } from '@astryxdesign/core'
import { layoutFamily } from '../lib/family/layout'
import { renderFamilySvg } from '../lib/family/svg'
import type { Family } from '../lib/family/build'

/**
 * 가계도 — **빌드 때 구워서 SVG로 내보낸다.** 클라이언트 JS 0줄이다.
 *
 * 관계망(`EgoGraph`)과 달리 힘 시뮬레이션을 안 쓴다. 세대가 행으로 고정돼야 하는
 * 문법이라(`family/족보_표기_설계.md`) 점이 떠다니면 오히려 못 읽는다.
 *
 * 이름이 HTML 텍스트로 남아 Ctrl+F에 잡힌다. 동명이인을 가르는 화면에서 이건
 * 부수효과가 아니라 기능이다.
 */
export function FamilyTree({ family, focus }: { family: Family; focus?: string }) {
  const layout = layoutFamily(family.people, family.links)
  const svg = renderFamilySvg(layout, { focus })

  return (
    <Stack direction="vertical" gap={2}>
      {/* 범례는 그림 안에 항상 보인다 (DESIGN P7). 색·선으로 뜻을 나르는 화면이다 */}
      <div
        style={{ overflowX: 'auto', maxWidth: '100%' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <Text size="sm" color="secondary">
        가는 선 혈연·혼인 · 굵은 점선 제위 계승. 계승은 혈연과 다른 축이라 따로 그립니다.
      </Text>
    </Stack>
  )
}

/** 데이터가 아직 못 그리는 것을 화면이 정직하게 말한다 (헌장 0-4) */
export function FamilyGap() {
  return (
    <Banner
      status="info"
      title="아직 못 그리는 가문이 있습니다"
      description="바르카스 가문(하밀카르·한니발·하스드루발)은 아직 가계 관계가 자료에 안 들어와 있어 그림이 안 나옵니다. 포에니 전쟁 세 편을 맡으신 분께는 이게 제일 아쉬운 자리인 것을 알고 있고, 채우는 중입니다."
    />
  )
}
