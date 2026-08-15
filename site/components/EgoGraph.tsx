'use client'

import { useEffect, useRef, useState } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  type SimulationNodeDatum,
} from 'd3-force'

/**
 * 이 객체 하나에 앵커된 1단계 관계 그래프.
 *
 * **헌장 3절의 예외다.** 원래 「그래프 라이브러리를 클라이언트에 싣지 않는다」였고 그
 * 조항이 지키려던 것은 둘이었다 — 이름이 Ctrl+F에 잡힐 것, astryx와 CSS가 안 부딪힐 것.
 * 둘 다 살렸다. 관계 목록이 이 그림 옆에 **정적 HTML 텍스트로** 따로 있고(그림은
 * 보조 시각화지 유일한 표현이 아니다), 렌더는 우리 SVG라 외부 CSS가 안 들어온다.
 * 빌린 것은 `d3-force`의 힘 계산뿐이고(ISC, min 8.3KB) 확대·끌기는 포인터 이벤트로 한다.
 *
 * **가계도(`lib/family/`)는 그대로 빌드타임 SVG다.** 세대를 행으로 고정하는 문법이라
 * 힘 시뮬레이션이 오히려 해롭다.
 */

export type GraphNode = { id: string; label: string; href?: string; kind: 'center' | 'rel' | 'co' }
export type GraphEdge = { source: string; target: string; kind: 'rel' | 'co' }

type Sim = GraphNode & SimulationNodeDatum & { fx?: number | null; fy?: number | null }

const R = { center: 7, rel: 5, co: 3.5 }

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
        : { ...n, x: Math.cos(a) * 140, y: Math.sin(a) * 140 }
    })
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
      .force('charge', forceManyBody().strength(-220))
      .force('collide', forceCollide(22))
      .stop()

    // 눈에 보이게 가라앉힌다 — 옵시디언 그래프뷰의 그 느낌이 여기서 나온다
    let frames = 0
    let raf = 0
    const step = () => {
      s.tick()
      setSim([...data])
      if (++frames < 140) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      s.stop()
    }
  }, [nodes, edges])

  const pos = new Map(sim.map((n) => [n.id, n]))

  // 그려진 것에 맞춰 화면을 죈다. 고정 박스를 쓰면 노드가 적을 때 아래가 통째로 빈다.
  // 라벨이 점 오른쪽으로 뻗으므로 그쪽에 여유를 더 준다
  const xs = sim.map((n) => n.x ?? 0)
  const ys = sim.map((n) => n.y ?? 0)
  const minX = Math.min(...xs, 0) - 40
  const maxX = Math.max(...xs, 0) + 110
  const minY = Math.min(...ys, 0) - 30
  const maxY = Math.max(...ys, 0) + 30
  // 박스 비율과 viewBox 비율이 어긋나면 SVG가 레터박스를 만들어 위아래가 통째로 뜬다.
  // 비율을 먼저 정하고(너무 납작하거나 길쭉하지 않게 죈다) viewBox를 거기 맞춘다
  const raw = Math.max(200, maxX - minX) / Math.max(160, maxY - minY)
  const ratio = Math.min(2.2, Math.max(1.1, raw))
  const h = Math.max(160, maxY - minY, (maxX - minX) / ratio) / zoom
  const w = h * ratio
  const cx = (minX + maxX) / 2 + pan.x
  const cy = (minY + maxY) / 2 + pan.y

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
    <div>
      <svg
        viewBox={`${cx - w / 2} ${cy - h / 2} ${w} ${h}`}
        width="100%"
        role="img"
        aria-label="이 객체와 이어진 것들의 관계 그림"
        // 끄는 중 커서는 CSS `:active`가 바꾼다. 여기서 ref를 읽으면 렌더 중 접근이 된다
        className="ego-graph"
        style={{ aspectRatio: `${ratio}`, touchAction: 'none' }}
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
              strokeOpacity={e.kind === 'rel' ? 0.35 : 0.15}
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
              r={R[n.kind]}
              fill="currentColor"
              fillOpacity={n.kind === 'center' ? 1 : n.kind === 'rel' ? 0.55 : 0.25}
            />
            {/* 이름은 그림에도 글자로 남는다. 픽셀로 굽지 않는 이유다 */}
            <text
              x={R[n.kind] + 4}
              y={4}
              fontSize={n.kind === 'center' ? 13 : 11}
              fill="currentColor"
              fillOpacity={n.kind === 'co' ? 0.55 : 0.85}
              onClick={() => n.href && (window.location.href = n.href)}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
