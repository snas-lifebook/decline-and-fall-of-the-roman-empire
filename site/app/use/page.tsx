import { Stack, Grid, Heading, Text, Divider, Banner, ClickableCard } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { BookIcon, DocIcon, PresentIcon, SparkIcon, VerifyIcon } from '../../components/icons'
import { navFind } from '../../lib/nav'
import { pageMeta } from '../../lib/meta'

/**
 * 활용하기 랜딩 — 어디로 갈지 고르는 자리다.
 *
 * **세 번째 판이다(2026-08-23, River 「UXUI·텍스트가 구림」).** 앞 판은 내비게이션이
 * 둘로 겹쳤다 — 「무엇을 하시려는지」 상황 카드 넷은 전부 `/use/recipes` 앵커로만 가고,
 * 하위 다섯 장은 따로 번호 리스트로 늘어놨다. 상황 카드는 이미 `/use/recipes`의
 * `CategoryCards`가 하는 일이라 랜딩에서 두 번 하면 그게 헷갈림이다.
 *
 * 그래서 **하나로 통일한다** — 하위 다섯 장을 아이콘 카드 한 벌로. OpenAI·Claude 독스
 * 랜딩이 절을 카드 격자로 세우는 것과 같다. 상황(발표준비·인물확인…)은 `/use/recipes`
 * 안에서 고르게 두고, 랜딩은 「무엇이 있나」만 눈에 들어오게 한다.
 *
 * 제목은 `lib/nav.ts`의 `USE`가 정본이라 손으로 안 적는다 — 아이콘·설명만 여기 붙인다.
 */
export const metadata = pageMeta('활용하기')

/** 아이콘·설명은 표현이라 여기, 제목·순서는 nav가 쥔다. 설명은 「이 장을 열면 무엇을 하나」 */
const META: Record<string, { Icon: typeof BookIcon; desc: string }> = {
  '/use/reading': {
    Icon: BookIcon,
    desc: '깃도 옵시디언도 몰라도 됩니다. 본문·인물 카드·지도·글자 설정을 화면에서 보는 법입니다.',
  },
  '/use/data': {
    Icon: DocIcon,
    desc: 'AI에게 먼저 붙여넣을 자료 세 가지를 고르는 법입니다.',
  },
  '/use/recipes': {
    Icon: PresentIcon,
    desc: '실제로 해보고 결과가 나온 방법만 모았습니다. 프롬프트는 복사해서 쓰시면 됩니다.',
  },
  '/use/skills': {
    Icon: SparkIcon,
    desc: 'AI에게 시킬 수 있는 작업을 절차로 정리했습니다. 웹에서 바로 되는 것부터 나옵니다.',
  },
  '/use/pitfalls': {
    Icon: VerifyIcon,
    desc: '이 자료를 다루면서 AI가 실제로 틀렸던 곳과 그 대처법입니다.',
  },
}

export default function Use() {
  const cards = (navFind('/use')?.children ?? []).flatMap((c) => {
    const m = META[c.href]
    return m ? [{ href: c.href, title: c.title, ...m }] : []
  })

  return (
    <Shell path="/use" where="활용하기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>활용하기</Heading>
        <Text size="lg" color="secondary">
          이 자료를 화면에서 읽고 보는 법과, 쓰시던 ChatGPT나 Claude에 붙여넣어 쓰는 법입니다.
        </Text>
      </Stack>

      <Divider />

      {/* 경고는 유지 — 여덟 중 일곱이 자료를 요구한다는 사실이 이 화면 전체의 전제다 */}
      <Banner
        status="warning"
        title="자료를 붙여넣지 않으면 AI가 없는 내용을 만들어 냅니다"
        description="「로마제국쇠망사 3번 포인트 정리해줘」라고만 물으면 그럴듯한 답이 나오지만 이 책 내용이 아닙니다. 먼저 자료를 붙여넣고 물어보세요."
      />

      {/* 하위 다섯 장 = 이 화면의 전부. 아이콘 카드 한 벌로 세운다(중립 타일) */}
      <Grid columns={{ minWidth: 260 }} gap={3}>
        {cards.map((c) => (
          <ClickableCard key={c.href} href={c.href} label={c.title} padding={4}>
            <Stack direction="vertical" gap={1}>
              <Stack direction="horizontal" gap={2} vAlign="center">
                <span className="collection-mark collection-mark--plain">
                  <c.Icon />
                </span>
                <Heading level={3}>{c.title}</Heading>
              </Stack>
              <Text size="sm" color="secondary">
                {c.desc}
              </Text>
            </Stack>
          </ClickableCard>
        ))}
      </Grid>
    </Shell>
  )
}
