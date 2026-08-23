import Link from 'next/link'
import { Stack, Text, Heading, Banner } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { pageMeta } from '../../../lib/meta'

/**
 * 읽기 화면 보는 법 — 활용하기의 빠진 절반.
 *
 * 2026-08-20(PLAN v2 Stage B). 활용하기(/use)가 지금까지 **AI에 붙여넣어 쓰는 법**만
 * 다뤘다 — 그 전에 화면에서 **자료를 읽고 보는 법**이 통째로 없었다(River 지적:
 * 「읽기에서 텍스트나 정보 카드나 지도를 어떻게 보면 되는지, 설정은 어떻게 하는지도
 * 알려줘야 한다」). 봉호님 베타 피드백도 같은 자리였다 — 「스크롤하면 지도가
 * 달라지네요, 안내만 잘되면」(2026-08-19).
 *
 * 롤모델 리서치(볼트 [[롤모델_리서치_findings_20260820]] §3.3)에서 가져온 것:
 *   - **목표-우선 불렛**(Apple 도서 도움말) — 「글자 크게 하기:」처럼 목표를 앞에
 *     둔다. 읽는 사람은 자기 목표만 스캔한다
 *   - **되돌리기 문장 필수** — 되돌릴 수 있다는 걸 알면 눌러본다
 *   - **막힐 때 = 독자가 속으로 하는 질문을 소제목으로**(Toss `variantKey는 뭔가요?`)
 *   - **정직한 데모 = 실제 화면**(우리는 앱이 아니라 텍스트를 파는 곳이라 원문 자체가
 *     목업보다 낫다). 그래서 각 절 끝에 「직접 열어보기」로 진짜 화면을 연다
 *
 * ponytail: 주석 얹은 화면 이미지(정보카드·지도)는 아직 없다 — 만들려면 Figma
 * 파이프라인(public/guide/SOURCE.md)이 필요하다. v1은 글 + 실제 화면 링크로 가고,
 * 주석 이미지는 v2에서 기존 31장과 같은 무드로 얹는다.
 */
export const metadata = pageMeta('화면 보는 법')

const SUMMARY =
  'AI에 붙여넣기 전에, 화면에서 자료를 읽고 보는 법부터 짚습니다. 본문·인물 카드·지도·글자 설정 네 가지입니다.'

/** 목표-우선 한 줄. 「글자 크게 하기: + 를 누르세요」 — 목표가 앞, 동작이 뒤(Apple) */
function Goal({ goal, children }: { goal: string; children: React.ReactNode }) {
  return (
    <Text>
      <strong>{goal}:</strong> {children}
    </Text>
  )
}

/** 막힐 때 한 쌍. 질문을 그대로 소제목으로 둔다(Toss 방식) */
function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <Stack direction="vertical" gap={0.5}>
      <Text>{q}</Text>
      <Text size="sm" color="secondary">
        {children}
      </Text>
    </Stack>
  )
}

const SECTIONS: DocSection[] = [
  {
    id: 'text',
    title: '본문 — 파란 이름을 눌러 보세요',
    body: (
      <Stack direction="vertical" gap={2}>
        <Text color="secondary">
          읽기로 들어가면 맡으신 포인트의 본문이 나옵니다. 본문 안에서 <strong>파랗게 뜨는
          글씨</strong>는 인물이나 지명입니다. 누르면 그게 누구인지, 어디인지가 곧바로 옆에
          열립니다.
        </Text>
        <Text size="sm" color="secondary">
          <Link href="/read">읽기 화면 직접 열어보기 →</Link>
        </Text>
      </Stack>
    ),
  },
  {
    id: 'card',
    title: '인물 카드 — 이름 옆에 열립니다',
    body: (
      <Stack direction="vertical" gap={2}>
        <Text color="secondary">
          본문의 파란 이름을 누르면 그 인물·지명의 카드가 열립니다. 누구 편이었는지, 어느
          포인트에 나오는지, 누구와 어떤 사이인지가 거기 담겨 있습니다. 「이 사람이 누구
          편이었더라」가 헷갈릴 때 본문을 떠나지 않고 그 자리에서 확인하시는 자리입니다.
        </Text>
        <Text color="secondary">
          넓은 화면에서는 본문 <strong>오른쪽</strong>에, 폰처럼 좁은 화면에서는 본문{' '}
          <strong>아래</strong>에 붙습니다.
        </Text>
      </Stack>
    ),
  },
  {
    id: 'map',
    title: '지도 — 스크롤을 따라 움직입니다',
    body: (
      <Stack direction="vertical" gap={2}>
        <Text color="secondary">
          본문을 내려 읽으시면, 지도가 그 대목의 무대가 된 곳으로 <strong>저절로</strong>{' '}
          함께 움직입니다. 카르타고 이야기를 읽는 동안엔 지도가 카르타고를 비춥니다 — 지도를
          직접 끌어 옮기실 필요가 없습니다.
        </Text>
        <Text color="secondary">
          장소가 나오는 대목에서만 움직입니다. 인물만 나오고 지명이 없는 대목에서는 지도가
          그대로 있습니다.
        </Text>
      </Stack>
    ),
  },
  {
    id: 'settings',
    title: '글자 크기와 밝기 — 상단 바 오른쪽에서',
    body: (
      <Stack direction="vertical" gap={2}>
        <Text color="secondary">화면 오른쪽 위에서 다음 중 하나를 하시면 됩니다.</Text>
        <Stack direction="vertical" gap={1}>
          <Goal goal="글자 크게 하기">
            상단 바의 <strong>+</strong> 를 누르세요. 작게 하려면 <strong>−</strong> 를
            누르세요. 키보드 <strong>-</strong> 와 <strong>=</strong> 로도 됩니다.
          </Goal>
          <Goal goal="밤에 읽기 편하게">
            <strong>시스템</strong>을 눌러 어두운 화면으로 바꾸세요.
          </Goal>
          <Goal goal="처음 크기로 되돌리기">
            가운데 <strong>100%</strong>를 누르면 기본 크기로 돌아갑니다.
          </Goal>
        </Stack>
        <Text size="sm" color="secondary">
          바꾸신 크기와 밝기는 다음에 다시 오셔도 그대로 있습니다.
        </Text>
      </Stack>
    ),
  },
  {
    id: 'stuck',
    title: '막힐 때',
    body: (
      <Stack direction="vertical" gap={3}>
        <QA q="인물 카드는 왜 어떤 이름에만 뜨나요?">
          자료에 등록된 인물·지명에만 카드가 있습니다. 아직 채우지 못한 이름은 파랗지 않고,
          눌러도 열리지 않습니다.
        </QA>
        <QA q="지도가 안 움직여요.">
          지도가 붙은 대목에서만 움직입니다. 그 대목에 나오는 곳의 좌표가 아직 없으면
          가만히 있습니다. 좌표는 채우는 중입니다.
        </QA>
        <QA q="글자가 너무 작아요 / 커요.">
          위 「글자 크기」를 보세요. 상단 바의 <strong>+</strong> · <strong>−</strong>로
          바꾸시면 됩니다.
        </QA>
        <QA q="읽던 곳으로 돌아가려면?">
          브라우저의 뒤로 가기로 방금 보던 화면으로 돌아가실 수 있습니다.
        </QA>
      </Stack>
    ),
  },
]

export default function Reading() {
  return (
    <DocShell
      href="/use/reading"
      title="화면 보는 법"
      summary={SUMMARY}
      sections={SECTIONS}
      intro={
        <Banner
          status="info"
          title="AI로 쓰기 전에, 먼저 화면에서 읽고 보는 법입니다"
          description="깃도 옵시디언도 몰라도 됩니다. 웹에서 바로 열어 읽고, 헷갈리는 인물을 그 자리에서 확인하는 것까지가 여기입니다."
        />
      }
    />
  )
}
