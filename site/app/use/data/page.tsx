import Link from 'next/link'
import { Stack, Text, Banner } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { MaterialCards } from '../../../components/MaterialCards'
import { dataShapeSections } from '../../../components/DataShape'
import { ChatMockup } from '../../../components/ChatMockup'
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
export const metadata = pageMeta('AI에 줄 자료')

function sections(): DocSection[] {
  return [
    /*
     * 태봉호(베타 첫 사용자, 2026-08-19)가 짚은 자리다 — "일반인은 아예 그 창이
     * 어떤식으로 굴러가는지 모를거에요." 아래 재료 카드와 다음 장의 프롬프트
     * 상자는 이미 있지만, 그게 실제 AI 창의 어느 자리에서 일어나는 일인지는
     * 아무 데도 없었다. 그 자리 하나만 `ChatMockup`이 채운다.
     */
    {
      id: 'window',
      title: 'AI 창은 이렇게 움직입니다',
      body: (
        <Stack direction="vertical" gap={2}>
          <Text color="secondary">
            ChatGPT나 Claude 화면은 모두 이 구조입니다. 아래 입력칸에 자료와 질문을
            붙여넣고 보내기를 누르면 답이 그 위에 새 말풍선으로 뜹니다.
          </Text>
          <ChatMockup />
          <Text size="sm" color="secondary">
            서비스마다 색과 배치는 조금씩 다르지만 구조는 같습니다.
          </Text>
        </Stack>
      ),
    },
    {
      id: 'materials',
      title: '붙여넣을 수 있는 자료',
      body: (
        <Stack direction="vertical" gap={3}>
          <Text size="sm" color="secondary">
            셋 다 버튼 한 번으로 복사됩니다.
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
      title: '관계가 없는 객체도 있습니다',
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
            <Link href="/use/skills">스킬</Link> 중 웹에서는 안 되던 작업이 열립니다.
          </Text>
          <Text size="sm" color="secondary">
            급하지 않으시면 안 하셔도 됩니다. 위 자료 세 가지만으로{' '}
            <Link href="/use/recipes">활용 사례</Link> {RECIPES.length}건 중 {WEB_ONLY}건이 됩니다.
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
      title="AI에 줄 자료"
      summary="AI에게 먼저 붙여넣을 자료 세 가지입니다. 상황에 맞는 것을 골라 쓰시면 됩니다."
      sections={sections()}
      intro={
        <Banner
          status="warning"
          title="「포인트 3 정리해줘」라고만 물으면 이 책 내용이 나오지 않습니다"
          description="답은 그럴듯하게 나오지만 AI가 원래 알고 있던 내용으로 채운 것입니다. 자료를 먼저 붙여넣은 다음에 물어보세요."
        />
      }
    />
  )
}
