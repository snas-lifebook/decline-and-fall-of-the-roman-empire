import { textWidth } from '../text/width'

/**
 * 관계망이 읽히게 만드는 두 가지 — **얼마나 떨어뜨릴 것인가**와 **몇 개를 그릴 것인가**.
 *
 * 앞 판이 무너진 자리가 정확히 여기다. 충돌 반경이 `24 + n * 0.7`이라 **라벨 폭과
 * 아무 상관이 없었다.** 「콘스탄티누스 2세」는 폭이 70을 넘는데 반경 45로는 절대
 * 안 갈린다. 힘을 네 번 다시 조여도 안 됐던 것은 튜닝이 모자라서가 아니라
 * **재는 대상이 틀렸기 때문**이다 — 점끼리는 안 겹쳤고 글자가 겹쳤다.
 *
 * 그래서 둘을 고친다.
 *   1. 반경을 **라벨 폭에서** 뽑는다. 라벨을 점 아래 가운데 놓으면 글자 상자가
 *      점을 중심으로 좌우 대칭이라 원 충돌로 정확히 모델링된다(점 오른쪽으로
 *      뻗던 앞 판은 원으로는 잡을 수가 없는 모양이었다)
 *   2. **개수를 자른다.** 포인트 13은 관계가 64건이다. 폭 760px 안에서 45개를
 *      읽히게 놓는 배치는 없다 — 어떤 알고리즘을 써도 글자가 17px이 된다
 *
 * 글씨 크기가 viewBox 단위로 고정이라(더 이상 `k`로 스케일하지 않는다) 반경도
 * 같은 단위에서 한 번에 정해진다. 앞 판은 글씨를 상자 크기에 비례해 키우고 있어서
 * 「반경이 글씨에 의존하고 글씨가 상자에 의존하고 상자가 반경에 의존」하는
 * 순환이 있었다.
 */

export type SizedNode = { id: string; label: string; kind: 'center' | 'rel' | 'co' }
export type SizedEdge = { source: string; target: string; kind: 'rel' | 'co' }

/** viewBox 단위 글씨 크기. 화면 픽셀이 아니라 그림 좌표계다 */
export const FONT = { center: 13, rel: 11, co: 10 } as const

/** 점 반지름 */
export const DOT = { center: 6, rel: 4.5, co: 3 } as const

/** 라벨 사이에 남길 숨통 */
const PAD = 5

export function collideRadius(n: SizedNode): number {
  const half = textWidth(n.label, FONT[n.kind]) / 2
  return Math.max(DOT[n.kind] + PAD, half + PAD)
}

/**
 * 그릴 것을 고른다. **연결이 많은 것부터** 남긴다 — 그림의 값은 「누가 여러
 * 갈래와 얽혀 있나」를 보여주는 데 있지 모두를 담는 데 있지 않다. 빠진 것은
 * 화면이 개수로 밝힌다(잘라놓고 말 안 하면 다 그린 것처럼 읽힌다).
 *
 * 가운데(`center`)는 연결 수와 무관하게 남는다. 객체 화면의 그림은 그 사람을
 * 앵커로 삼는 그림이라 앵커가 빠지면 그림이 아니다.
 */
export function pickNodes<N extends SizedNode, E extends SizedEdge>(
  nodes: N[],
  edges: E[],
  limit: number,
): { nodes: N[]; edges: E[]; dropped: number } {
  if (nodes.length <= limit) return { nodes, edges, dropped: 0 }

  const degree = new Map<string, number>()
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1)
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1)
  }

  const rank = [...nodes].sort((a, b) => {
    if (a.kind === 'center') return -1
    if (b.kind === 'center') return 1
    // 관계가 동석보다 앞선다. 동석은 관계가 아니라 서술상의 동석이다 (DESIGN P7)
    if (a.kind !== b.kind) return a.kind === 'rel' ? -1 : 1
    // 같으면 연결 많은 순, 그래도 같으면 이름순 — 빌드마다 그림이 흔들리면 안 된다
    return (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.label.localeCompare(b.label)
  })

  const kept = rank.slice(0, limit)
  const ids = new Set(kept.map((n) => n.id))
  // 입력 순서를 지켜 되돌린다. 정렬 순서로 주면 그리는 순서가 바뀌어 diff가 지저분해진다
  return {
    nodes: nodes.filter((n) => ids.has(n.id)),
    edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    dropped: nodes.length - kept.length,
  }
}
