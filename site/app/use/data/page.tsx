import Link from 'next/link'
import { Stack, Heading, Text, Divider, Banner } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { MaterialCards } from '../../../components/MaterialCards'
import { DataShape } from '../../../components/DataShape'
import { Faq } from '../../../components/Faq'
import { faqFor } from '../../../lib/faq'

/**
 * 무엇을 AI에 주나 — 활용하기의 1번이고, 나머지 셋이 전부 여기에 기댄다.
 *
 * 앞 판은 마크다운이었고 **네 칸짜리 표가 무너졌다.** 「무엇이 담기나」에 긴
 * 문장이 들어가는데 표 칸은 그걸 못 받는다. 게다가 고르는 기준인 「언제 쓰나」가
 * 표 아래 따로 있어서 둘을 번갈아 봐야 했다.
 *
 * 재료 카드는 `components/MaterialCards`가 그린다 — 「우수 사례」와 같은 것을
 * 쓰므로 한쪽만 고쳐 어긋나는 일이 없다.
 */
export default function Data() {
  return (
    <Shell path="/use/data" where="무엇을 AI에 주나">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>무엇을 AI에 주나</Heading>
        <Text size="lg" color="secondary">
          재료를 먼저 줘야 합니다. 안 주면 AI는 아는 척하고 지어냅니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="warning"
        title="「포인트 3 정리해줘」라고만 하면 우리 책 내용이 안 나옵니다"
        description="그럴듯한 글은 나오지만 AI가 원래 알던 것으로 채운 것입니다. 재료를 먼저 주고, 그다음에 시킵니다."
      />

      <Stack direction="vertical" gap={3} as="section">
        <Stack direction="vertical" gap={0.5}>
          <Heading level={2}>이 사이트가 주는 재료 셋</Heading>
          <Text size="sm" color="secondary">
            셋 다 버튼 하나입니다. 설치도 로그인도 필요 없습니다.
          </Text>
        </Stack>
        <MaterialCards />
        <Text color="secondary">
          포인트 한 장이 약 5천 토큰입니다. 어느 AI 창에도 그냥 들어갑니다. 잘라 붙이실 필요가
          없습니다.
        </Text>
      </Stack>

      <Divider />

      {/*
        「자료가 어떻게 생겼나」를 손으로 적은 목록에서 **파일을 세어 만드는 것**으로
        바꿨다. 같은 설명이 가져가기 화면에도 있었고 숫자가 두 벌이었다 —
        이제 두 화면이 `components/DataShape`를 같이 쓴다.

        도식을 그리는 대신 개수가 붙은 파일트리와 **진짜 레코드 한 줄**을 놓는다.
        문서 사이트 여섯 곳을 조사했더니 Stripe와 OpenAI는 도식이 아예 0개인데도
        자기 데이터가 무엇인지 완전히 전달했다.
      */}
      <DataShape />

      <Banner
        status="info"
        title="관계가 하나도 없는 객체가 217개, 전체의 3분의 1입니다"
        description="대부분 지명입니다. 자료가 부실해서가 아니라 책이 그 지명에 대해 관계를 말하지 않았기 때문입니다. 그런 화면에는 대신 「같은 포인트에 함께 나온」 목록이 뜨는데, 그건 관계가 아니라 같은 대목에 함께 등장했다는 사실입니다. AI에게 줄 때도 그 차이를 지켜주세요."
      />

      <Divider />

      <Stack direction="vertical" gap={1.5} as="section">
        <Heading level={2}>자료를 통째로 쓰고 싶으시면</Heading>
        <Text>
          매번 복사하는 대신 컴퓨터에 받아두고 AI에 물려둘 수 있습니다.{' '}
          <Link href="/start/ai">AI에 자료 연결하기</Link>에 방법이 있고, 그러면{' '}
          <Link href="/use/skills">스킬 여덟</Link> 중 웹에서 안 되던 것들이 열립니다.
        </Text>
        <Text size="sm" color="secondary">
          급하지 않으시면 안 하셔도 됩니다. 위 재료 셋만으로도{' '}
          <Link href="/use/recipes">우수 사례</Link>의 대부분이 됩니다.
        </Text>
      </Stack>

      <Faq items={faqFor('/use/data')} />
    </Shell>
  )
}
