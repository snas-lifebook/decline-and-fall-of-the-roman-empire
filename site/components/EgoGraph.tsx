'use client'

import { useEffect, useRef, useState } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force'
import { collideRadius, FONT, DOT, type SizedNode } from '../lib/graph/size'

/**
 * 이 객체 하나에 앵커된 1단계 관계 그래프.
 *
 * **헌장 3절의 예외다.** 원래 「그래프 라이브러리를 클라이언트에 싣지 않는다」였고 그
 * 조항이 지키려던 것은 둘이었다 — 이름이 Ctrl+F에 잡힐 것, astryx와 CSS가 안 부딪힐 것.
 * 둘 다 살렸다. 관계 목록이 이 그림 옆에 **정적 HTML 텍스트로** 따로 있고(그림은
 * 보조 시각화지 유일한 표현이 아니다), 렌더는 우리 SVG라 외부 CSS가 안 들어온다.
 * 빌린 것은 `d3-force`의 힘 계산뿐이고(ISC, min 8.3KB) 확대·끌기는 포인터 이벤트로 한다.
 *
 * **2026-08-16 개정 — 라벨이 겹치던 것을 고쳤다.** 앞 판은 충돌 반경이
 * `24 + n * 0.7`이라 라벨 폭과 무관했고, 라벨이 점 **오른쪽으로** 뻗어서 원 충돌로는
 * 애초에 잡을 수 없는 모양이었다. 힘을 네 번 조여도 안 됐던 이유가 그것이다.
 * 이제 라벨을 점 아래 가운데 놓고 반경을 라벨 폭에서 뽑는다(`lib/graph/size.ts`).
 * 글씨 크기도 viewBox 단위로 고정했다 — 상자 크기에 비례해 키우던 앞 판은
 * 「반경 → 글씨 → 상자 → 반경」 순환이라 계산이 성립하지 않았다.
 *
 * **가계도(`lib/family/`)는 그대로 빌드타임 SVG다.** 세대를 행으로 고정하는 문법이라
 * 힘 시뮬레이션이 오히려 해롭다.
 */

export type GraphNode = SizedNode & { href?: string }
export type GraphEdge = { source: string; target: string; kind: 'rel' | 'co' }

type Sim = GraphNode & SimulationNodeDatum & { fx?: number | null; fy?: number | null }

export function EgoGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  // 시뮬레이션이 노드 객체를 제자리에서 바꾸므로, 배열 참조만 새로 만들어 렌더를 부른다.
  // ref에 담고 더미 카운터로 흔들면 렌더 중 ref 접근이 되어 React가 경고한다
  const [sim, setSim] = useState<Sim[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef<{ id?: string; from: { x: number; y: number } } | null>(null)

  useEffect(() => {
    // 가운데를 원점에 박고 나머지를 둘레에 뿌려서 시작한다. 안 그러면 첫 프레임이 뭉친다
    const data: Sim[] = nodes.map((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(1, nodes.length - 1)
      return n.kind === 'center'
        ? { ...n, x: 0, y: 0, fx: 0, fy: 0 }
        : { ...n, x: Math.cos(a) * 160, y: Math.sin(a) * 160 }
    })

    // **떨어뜨리는 일은 collide가 혼자 한다.** 반경이 이미 라벨 폭이라, 척력까지
    // 노드 수에 비례해 키우면 그림이 헛되이 넓어지고 글씨만 작아진다(앞 판이 그랬다).
    // charge는 뭉치지 않을 만큼만, link는 이어진 것을 곁에 두는 정도만 건다.
    const s = forceSimulation(data)
      .force(
        'link',
        forceLink<Sim, GraphEdge & { source: string | Sim; target: string | Sim }>(
          edges.map((e) => ({ ...e })),
        )
          .id((d) => d.id)
          .distance(90)
          .strength(0.35),
      )
      .force('charge', forceManyBody().strength(-260))
      .force(
        'collide',
        forceCollide<Sim>()
          .radius((d) => collideRadius(d))
          .strength(0.9)
          .iterations(3),
      )
      // 원점으로 살짝 당긴다. **끊어진 덩어리가 있는 그래프에 이게 없으면**
      // 척력만 받아 서로 무한히 밀려나고, 상자는 그 빈 공간까지 감싸느라 커진다.
      // 포인트 13이 그랬다 — 헤로데 무리가 왼쪽 아래로 날아가 화면 절반이 비었다.
      .force('x', forceX(0).strength(0.06))
      .force('y', forceY(0).strength(0.08))
      .stop()

    /*
     * **움직임을 줄여달라고 한 사람에게는 안 움직인다.**
     * 그 설정을 켠 사람에게 220프레임짜리 물리 시뮬레이션은 어지럼증을 유발한다.
     * 결과를 뺏지는 않는다 — 계산을 한 번에 끝내고 **가라앉은 상태로 바로 그린다.**
     * 끌기와 확대는 그대로 된다.
     */
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) {
      s.tick(220)
      // 한 프레임 뒤에 칠한다. effect 안에서 곧바로 setState하면 렌더가 연쇄되고
      // eslint가 막는다. 이미 가라앉은 좌표라 한 프레임 차이는 안 보인다
      const once = requestAnimationFrame(() => setSim([...data]))
      return () => {
        cancelAnimationFrame(once)
        s.stop()
      }
    }

    // 눈에 보이게 가라앉힌다 — 옵시디언 그래프뷰의 그 느낌이 여기서 나온다
    let frames = 0
    let raf = 0
    const step = () => {
      s.tick()
      setSim([...data])
      if (++frames < 220) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      s.stop()
    }
  }, [nodes, edges])

  const pos = new Map(sim.map((n) => [n.id, n]))

  // 그려진 것에 맞춰 화면을 죈다. 고정 박스를 쓰면 노드가 적을 때 아래가 통째로 빈다.
  // 라벨이 점 아래 가운데로 뻗으므로 좌우는 반경만큼, 아래는 글줄 한 칸만 더 준다
  const bounds = sim.length
    ? sim.reduce(
        (b, n) => {
          const r = collideRadius(n)
          return {
            minX: Math.min(b.minX, (n.x ?? 0) - r),
            maxX: Math.max(b.maxX, (n.x ?? 0) + r),
            minY: Math.min(b.minY, (n.y ?? 0) - 16),
            maxY: Math.max(b.maxY, (n.y ?? 0) + 22),
          }
        },
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      )
    : { minX: -200, maxX: 200, minY: -140, maxY: 140 }

  // 박스 비율과 viewBox 비율이 어긋나면 SVG가 레터박스를 만들어 위아래가 통째로 뜬다.
  // 비율을 먼저 정하고(너무 납작하거나 길쭉하지 않게 죈다) viewBox를 거기 맞춘다
  const raw = Math.max(240, bounds.maxX - bounds.minX) / Math.max(180, bounds.maxY - bounds.minY)
  const ratio = Math.min(2.2, Math.max(1.1, raw))
  const h = Math.max(180, bounds.maxY - bounds.minY, (bounds.maxX - bounds.minX) / ratio) / zoom
  const w = h * ratio
  const cx = (bounds.minX + bounds.maxX) / 2 + pan.x
  const cy = (bounds.minY + bounds.maxY) / 2 + pan.y

  const onPointerDown = (e: React.PointerEvent, id?: string) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragging.current = { id, from: { x: e.clientX, y: e.clientY } }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragging.current
    if (!d) return
    const dx = (e.clientX - d.from.x) / zoom
    const dy = (e.clientY - d.from.y) / zoom
    d.from = { x: e.clientX, y: e.clientY }
    if (d.id) {
      const n = pos.get(d.id)
      if (n) {
        n.fx = (n.x ?? 0) + dx
        n.fy = (n.y ?? 0) + dy
        n.x = n.fx
        n.y = n.fy
      }
    } else {
      setPan((p) => ({ x: p.x - dx, y: p.y - dy }))
    }
    setSim((prev) => [...prev])
  }
  const onPointerUp = () => {
    dragging.current = null
  }

  return (
    <svg
      viewBox={`${cx - w / 2} ${cy - h / 2} ${w} ${h}`}
      width="100%"
      role="img"
      aria-label="이 객체와 이어진 것들의 관계 그림"
      // 끄는 중 커서는 CSS `:active`가 바꾼다. 여기서 ref를 읽으면 렌더 중 접근이 된다
      className="ego-graph"
      /*
        `touchAction: 'none'`이었다가 `pan-y`로 바꿨다(2026-08-17 검수).
        폰에서 이 그림이 화면 폭의 77%를 덮는데, 손가락이 여기 닿으면 **페이지가
        아예 안 굴러갔다**(실측: 그래프 위 스와이프 scrollTop 1688→1688, 본문
        위에서는 300→621). 세로로 미는 것은 브라우저에 돌려주고 그림 끌기는
        가로만 받는다 — 폰에서는 읽고 내려가는 것이 노드를 끄는 것보다 급하다.
      */
      style={{ aspectRatio: `${ratio}`, touchAction: 'pan-y' }}
      onWheel={(e) => setZoom((z) => Math.min(4, Math.max(0.4, z * (e.deltaY < 0 ? 1.12 : 0.89))))}
      onPointerDown={(e) => onPointerDown(e)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {edges.map((e, i) => {
        const a = pos.get(e.source)
        const b = pos.get(e.target)
        if (!a || !b) return null
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={e.kind === 'rel' ? 0.3 : 0.14}
            // 동석은 관계가 아니다. 선 종류로 갈라 놓고 범례에 적는다 (DESIGN P7)
            strokeDasharray={e.kind === 'co' ? '3 3' : undefined}
          />
        )
      })}
      {sim.map((n) => (
        <g
          key={n.id}
          transform={`translate(${n.x ?? 0} ${n.y ?? 0})`}
          onPointerDown={(e) => {
            e.stopPropagation()
            onPointerDown(e, n.id)
          }}
          style={{ cursor: n.href ? 'pointer' : 'default' }}
        >
          <circle
            r={DOT[n.kind]}
            fill="currentColor"
            fillOpacity={n.kind === 'center' ? 1 : n.kind === 'rel' ? 0.55 : 0.25}
          />
          {/*
            이름은 그림에도 글자로 남는다. 픽셀로 굽지 않는 이유다.
            **점 아래 가운데**에 놓는다 — 오른쪽으로 뻗으면 글자 상자가 점을 중심으로
            비대칭이라 원 충돌로 갈라낼 수가 없다(앞 판이 겹친 원인).
          */}
          <text
            textAnchor="middle"
            y={DOT[n.kind] + FONT[n.kind] + 1}
            fontSize={FONT[n.kind]}
            fill="currentColor"
            fillOpacity={n.kind === 'co' ? 0.55 : 0.85}
            onClick={() => n.href && (window.location.href = n.href)}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
