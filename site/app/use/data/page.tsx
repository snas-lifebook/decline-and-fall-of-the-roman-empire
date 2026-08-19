import Link from 'next/link'
import { Stack, Text, Banner } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { MaterialCards } from '../../../components/MaterialCards'
import { dataShapeSections } from '../../../components/DataShape'
import { RECIPES } from '../../../lib/recipes'
import { pageMeta } from '../../../lib/meta'

/** 손으로 「대부분」이라고 적지 않는다. 사례가 늘면 이 숫자도 같이 는다 */
const WEB_ONLY = RECIPES.filter((r) => r.needs === 'web').length

/**
 * 무엇을 AI에 주나 — 활용하기의 1번이고, 나머지 셋이 전부 여기에 기댄다.
 *
 * 앞 판은 마크다운이었고 **네 칸짜리 표가 무너졌다.** 「무엇이 담기나」에 긴
 * 문장이 들어가는데 표 칸은 그걸 못 받는다. 게다가 고르는 기준인 「언제 쓰나」가
 * 표 아래 따로 있어서 둘을 번갈아 봐야 했다.
 *
 * 재료 카드는 `components/MaterialCards`가 그린다 — 「우수 사례」와 같은 것을
 * 쓰므로 한쪽만 고쳐 어긋나는 일이 없다. 「자료가 어떻게 생겼나」 두 절도 마찬가지로
 * `dataShapeSections()`에서 오고 `/download`가 같은 것을 쓴다.
 *
 * 2026-08-19에 `DocShell`로 옮겼다. 이 화면은 절이 다섯인데 우측 목차가 없었다.
 */
export const metadata = pageMeta('무엇을 AI에 주나')

function sections(): DocSection[] {
  return [
    {
      id: 'materials',
      title: '이 사이트가 주는 재료 셋',
      body: (
        <Stack direction="vertical" gap={3}>
          <Text size="sm" color="secondary">
            셋 다 버튼 하나입니다. 설치도 로그인도 필요 없습니다.
          </Text>
          <MaterialCards />
          <Text color="secondary">
            포인트 한 장이 5천 토큰쯤 됩니다. 어느 AI 창에나 한 번에 들어가니 잘라 붙이실 일은
            없습니다.
          </Text>
        </Stack>
      ),
    },

    /*
      「자료가 어떻게 생겼나」를 손으로 적은 목록에서 **파일을 세어 만드는 것**으로
      바꿨다. 같은 설명이 가져가기 화면에도 있었고 숫자가 두 벌이었다.

      도식을 그리는 대신 개수가 붙은 파일트리와 **진짜 레코드 한 줄**을 놓는다.
      문서 사이트 여섯 곳을 조사했더니 Stripe와 OpenAI는 도식이 아예 0개인데도
      자기 데이터가 무엇인지 완전히 전달했다.
    */
    ...dataShapeSections(),

    {
      id: 'orphans',
      title: '관계가 없는 객체가 3분의 1입니다',
      body: (
        <Banner
          status="info"
          title="관계가 하나도 없는 객체가 217개, 전체의 3분의 1입니다"
          description="대부분 지명입니다. 자료가 부실해서가 아니라 책이 그 지명에 대해 관계를 말하지 않았기 때문입니다. 그런 화면에는 대신 「같은 포인트에 함께 나온」 목록이 뜨는데, 그건 관계가 아니라 같은 포인트에 함께 등장했다는 사실입니다. AI에게 줄 때도 둘을 섞지 마세요."
        />
      ),
    },
    {
      id: 'whole',
      title: '자료를 통째로 쓰고 싶으시면',
      body: (
        <Stack direction="vertical" gap={1.5}>
          <Text>
            매번 복사하는 대신 컴퓨터에 받아두고 AI에 물려둘 수 있습니다.{' '}
            <Link href="/start/ai">AI에 자료 연결하기</Link>에 방법이 있고, 그러면{' '}
            <Link href="/use/skills">스킬 여덟</Link> 중 웹에서 안 되던 것들이 열립니다.
          </Text>
          <Text size="sm" color="secondary">
            급하지 않으시면 안 하셔도 됩니다. 위 재료 셋만으로{' '}
            <Link href="/use/recipes">우수 사례</Link> {RECIPES.length}건 중 {WEB_ONLY}건이 됩니다.
          </Text>
        </Stack>
      ),
    },
  ]
}

export default function Data() {
  return (
    <DocShell
      href="/use/data"
      title="무엇을 AI에 주나"
      summary="재료를 먼저 줘야 합니다. 안 주면 AI는 아는 척하고 지어냅니다."
      sections={sections()}
      intro={
        <Banner
          status="warning"
          title="「포인트 3 정리해줘」라고만 하면 우리 책 내용이 안 나옵니다"
          description="그럴듯한 글은 나옵니다. 다만 AI가 원래 알던 것으로 채운 글입니다. 재료를 먼저 주고 그다음에 시키세요."
        />
      }
    />
  )
}
