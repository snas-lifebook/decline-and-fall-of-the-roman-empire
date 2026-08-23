import { Stack, Grid, Heading, Text, ClickableCard, Link, Divider } from '@astryxdesign/core'
import { Shell } from '../components/Shell'
import { Manifesto } from '../components/Manifesto'
import { FlipNumber } from '../components/FlipNumber'
import { BookIcon, SearchIcon, DownloadIcon, SparkIcon, FlagIcon } from '../components/icons'
import { dataCounts } from '../lib/datashape'
import { book } from '../lib/book'

/**
 * 목적 허브. `/`는 콘텐츠 페이지가 아니라 **갈림길**이다.
 *
 * 2026-08-20 재설계(v2, 롤모델 리서치 기반 — 볼트 [[롤모델_리서치_findings_20260820]]).
 * 앞 판의 진단은 「구조가 뒤집혔다」였다 — 답은 전부 아래층에 있는데 첫 화면이 그
 * 존재를 안 알린다. 실측: 첫 화면 사이드바 0개 vs 나머지 130개, 3질문(무엇을 다루나·
 * 어떻게 쓰나·유용한가) 셋 다 첫 화면 미답. 그래서 이 화면이 바뀐다.
 *
 *   1. **증상으로 연다** — 물건 이름("산스 인생책…")이 아니라 사람들이 실제로 겪는
 *      헷갈림으로. Obsidian·Notion·Anthropic이 전부 증상 먼저다(findings P4).
 *   2. **숫자를 stat row가 아니라 문장 안 링크로** — 「644」를 던지지 않고 "인물·지명·
 *      사건 644개"에 링크를 걸어 자랑이 아니라 이정표로 만든다(Datasette·OWID·Vercel,
 *      findings P2).
 *   3. **선언 블록** — About의 앞 4문단을 끌어올린다. About 링크가 푸터에만 있어
 *      묻혔던 문제도 같이 푼다(findings P8·§3.5).
 *
 * 카드는 독자층이 아니라 **동사/상황**으로 가른다(사람은 자기가 몇 층 독자인지보다
 * 지금 뭘 하려는지를 잘 안다, SPEC 「진입 구조」). 5장 유지는 River 결정 대기 —
 * findings는 3문(읽는다/찾아본다/가져가서 쓴다)으로 접기를 권하지만 그건 라우팅
 * 재편이라 River가 실물을 보고 정한다(PLAN v2 「열어둔 것」).
 *
 * 사이드바는 안 단다. 갈림길에 갈림길을 또 놓으면 그게 헷갈림이다.
 */

const CARDS = [
  {
    href: '/read',
    title: '읽기',
    desc: '맡은 포인트를 지금 바로 읽으실 수 있습니다.',
    Icon: BookIcon,
  },
  {
    href: '/objects',
    title: '찾아보기',
    desc: '이 인물이 누구 편이었는지 헷갈릴 때 찾아보세요.',
    Icon: SearchIcon,
  },
  {
    href: '/download',
    title: '가져가기',
    desc: '발표용 표를 시트에 붙여넣을 수 있게 받아 가세요.',
    Icon: DownloadIcon,
  },
  {
    href: '/use',
    title: '활용하기',
    desc: '쓰시던 AI에 이 자료를 붙여넣어 쓰는 방법을 안내합니다.',
    Icon: SparkIcon,
  },
  {
    href: '/start',
    title: '시작하기',
    desc: '자료를 처음 받으시거나 갱신이 밀렸을 때 보세요.',
    Icon: FlagIcon,
  },
] as const

/**
 * 히어로 숫자 줄. **손으로 안 적는다** — 데이터를 세어 만들므로 자료가 늘면 따라 는다.
 *
 * 앞 판은 「객체 644 · 관계 667 · …」 가운뎃점 나열(stat row)이었다. 그건 "우리가
 * 이만큼 만들었다"는 자랑이지 "어디로 가면 되는지"가 아니라, 헌장0 판정질문("헷갈림을
 * 더는가, 만든 걸 보여주는가")에 걸린다. Datasette이 `44 tools`·`154 plugins`를 문장
 * 한복판에 링크로 박은 것처럼, 같은 숫자를 **이정표**로 바꾼다.
 */
function counts() {
  const c = dataCounts()
  return {
    // 번호가 붙은 편만 센다 — 목차·일러두기·옮기고 나서는 포인트가 아니다
    points: book().parts.filter((p) => p.n).length,
    source: c.source,
    entities: c.entities,
    links: c.links,
  }
}

export default function Home() {
  const n = counts()
  return (
    <Shell path="/" where="첫 화면" sidebar={false} maxWidth={960}>
      <Stack direction="vertical" gap={8}>
        {/* 첫 화면이 상단에 딱 붙으면 급해 보인다. 위를 비워 숨을 준다 */}
        <Stack direction="vertical" gap={2} hAlign="center" paddingBlock={10}>
          {/*
            **증상 먼저.** h1이 물건 이름이면 헷갈림을 못 짚는다. 이 문장은 지어낸
            카피가 아니라 「찾아보기」 카드에 이미 있던 우리 문장을 끌어올린 것이다.
            (문구 최종안은 River 결정 — PLAN v2 「열어둔 것」)
          */}
          <Heading level={1} type="display-1" justify="center">
            『로마제국쇠망사』, 발표와 토론을 위한 자료실
          </Heading>
          <Text size="lg" color="secondary" justify="center">
            인물이 헷갈릴 때 찾아보고, 발표 표는 받아 가고, 쓰시던 AI에는 붙여 씁니다.
          </Text>
          {/* 숫자 줄 — 문장 안 링크(이정표). 굵은 숫자마다 그 목록으로 간다 */}
          <Text size="sm" color="secondary" justify="center">
            편역본 <Link href="/read"><FlipNumber n={n.points} />포인트</Link>와 기번 원전{' '}
            <Link href="/read"><FlipNumber n={n.source} />장</Link>을 담았고, 거기 나오는 인물·지명·사건{' '}
            <Link href="/objects"><FlipNumber n={n.entities} />개</Link>와 그 사이 관계{' '}
            <Link href="/objects"><FlipNumber n={n.links} />개</Link>를 정리했습니다.
          </Text>
          {/*
            **주 CTA 하나 + 조용한 보조 하나**(findings P6, Von Restorff). 다섯 카드가
            시각으로 다 똑같아 아무것도 안 도드라지던 것을 여기서 하나 세운다.
          */}
          {/* 퀵스타트가 주 CTA다(River #4) — 처음 오는 사람을 시작하기로 먼저 보낸다.
              알약 채움은 그쪽에, 「맡은 포인트 읽기」는 조용한 ghost로. */}
          <div className="hero-cta">
            <a className="hero-btn hero-btn-primary" href="/start">
              처음 오셨다면{' '}
              <span className="hero-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a className="hero-btn hero-btn-ghost" href="/read">
              맡은 포인트 읽기
            </a>
          </div>
        </Stack>

        <Grid columns={{ minWidth: 280 }} gap={3}>
          {CARDS.map((c) => (
            <ClickableCard key={c.title} href={c.href} label={c.title} padding={4}>
              <Stack direction="vertical" gap={0.5}>
                <Stack direction="horizontal" gap={2} vAlign="center">
                  <c.Icon />
                  <Heading level={2}>{c.title}</Heading>
                </Stack>
                <Text size="sm" color="secondary">
                  {c.desc}
                </Text>
              </Stack>
            </ClickableCard>
          ))}
        </Grid>

        {/*
          **선언 블록은 이제 팝업이다**(River #5, Round2 「팝업으로 뜨게」). 앞 판은
          「이 자료실은 01·02·03 + 무엇이 아닌가」를 카드 밑에 펼쳐 뒀는데, 첫 화면에서
          제일 먼저 할 일은 갈림길을 고르는 것이지 선언을 읽는 것이 아니다. 갈림길
          아래 한 줄로 접고, 누르면 `Dialog`로 뜬다. 내용은 `lib/manifesto.ts` 단일
          소스 — `/about`도 같은 것을 먹는다.
        */}
        <Divider />
        <Stack direction="vertical" hAlign="center" paddingBlock={2}>
          <Manifesto />
        </Stack>
      </Stack>
    </Shell>
  )
}
