import { Stack, Text } from '@astryxdesign/core'
import { renderTimelineSvg, MAX_ROWS } from '../lib/timeline/svg'
import type { Timeline } from '../lib/timeline/build'
import { entityHref } from '../lib/entity'

/**
 * 관계 연표 — **「누가 누구랑 언제부터 언제까지 어떤 사이였나」**.
 *
 * 봉호님이 이슈 #1의 두 번째로 요청한 화면이다. 관계망(`EgoGraph`)이 「무엇과
 * 이어져 있나」를 답한다면 이건 **「그게 언제였나」**를 답한다.
 *
 * **본문 칸에 놓는다.** 날개(300px)에 넣으면 2,200년을 300픽셀에 눌러 담게 돼
 * 막대가 전부 한 점으로 뭉친다 — 관계망을 날개로 옮길 때 배운 것과 같은 계산이다
 * (보이는 크기 = 값 ÷ viewBox폭 × 칸너비).
 *
 * **연도 없는 관계를 숨기지 않는다.** 관계 667건 중 날짜가 붙은 것은 305건(46%)뿐이라,
 * 안 그린 것을 말 안 하면 「이 사람 관계는 이게 다」로 읽힌다(헌장 0-4).
 */
export function RelationTimeline({ tl, name }: { tl: Timeline; name: string }) {
  /*
    **「오른쪽」이라고 안 쓴다.** 관계 목록은 폰(1100px 아래)에서 본문 밑으로 내려가고,
    관계가 없는 객체에서는 날개 자체가 없다. 자리를 말하는 대신 이름으로 가리킨다 —
    낭독기에 「오른쪽」은 처음부터 뜻이 없기도 하다.
  */
  const svg = renderTimelineSvg(tl, {
    label: `${name} 관계 연표, ${tl.spans.length}건. 같은 내용이 「연결」 목록에 글자로 있습니다`,
    hrefOf: (id) => {
      const s = tl.spans.find((x) => x.ref.id === id)
      return s ? entityHref(s.ref) : undefined
    },
  })
  const dropped = Math.max(tl.spans.length - MAX_ROWS, 0)

  return (
    <Stack direction="vertical" gap={2}>
      <div className="relation-timeline" dangerouslySetInnerHTML={{ __html: svg }} />

      {/* 뒤집힘은 이 화면의 값이 가장 큰 자리다. 그림에서 눈으로 찾게 하지 않고 글로 못 박는다 */}
      {tl.flips.map((f) => (
        <Text key={`${f.ref.id}-${f.to}`}>
          <a href={entityHref(f.ref)}>{f.name}</a>
          {wa(f.name)}는 {yearText(f.from)}{' '}
          {f.became === 'hostile'
            ? `편이었다가 ${yearText(f.to)} 적으로 돌아섭니다.`
            : `적이었다가 ${yearText(f.to)} 편이 됩니다.`}
        </Text>
      ))}

      {/* 범례는 그림 아래 항상 보인다 (DESIGN P7) */}
      <Text size="sm" color="secondary">
        붉은 막대 적대·정복 · 청록 막대 동맹·보호 · 회색 그 밖. 세로 눈금은 시작만 알고
        언제 끝났는지는 모르는 것입니다. 이름을 누르면 그 대상 화면으로 갑니다.
        {dropped ? ` 이른 것부터 ${MAX_ROWS}건만 그렸고 ${dropped}건은 「연결」 목록에 있습니다.` : ''}
        {tl.undated ? ` 연도를 모르는 관계 ${tl.undated}건은 여기 없습니다.` : ''}
      </Text>
    </Stack>
  )
}

/** 기원전은 음수로 들어 있다 (AGENTS 불변식 3) */
const yearText = (n: number) => (n < 0 ? `기원전 ${-n}년` : `${n}년`)

/**
 * 「와」냐 「과」냐. 받침이 있으면 과다 — 폼페이우스**와**, 로마제국**과**.
 * 이름 644개가 들어오는 자리라 한쪽으로 고정하면 절반이 틀린 한국어가 된다.
 */
function wa(name: string): '와' | '과' {
  const last = name.trim().charCodeAt(name.trim().length - 1) - 0xac00
  if (last < 0 || last > 11171) return '와' // 한글이 아니면 흔한 쪽으로 둔다
  return last % 28 === 0 ? '와' : '과'
}
