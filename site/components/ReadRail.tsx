'use client'

import { useState } from 'react'
import { IconButton, Outline, Popover, Stack, Text, type OutlineItem } from '@astryxdesign/core'
import { ReadSettings } from './ReadSettings'

/**
 * 읽는 동안 오른쪽에 붙어 있는 것 — 목차와 설정.
 *
 * ## 왜 다시 오른쪽인가
 *
 * 8/18에 여백 카드를 넣으면서 목차를 본문 위 접힌 블록으로 내렸는데, River가
 * 「사이드에서 없어졌는데 스크롤 할 때 절도 뜨고 카드 뉴스도 떠야 좋을 것 같은데」
 * 라고 짚었다. 맞는 지적이다 — **목차는 「지금 어디쯤인가」에 답하는 물건이라 읽는
 * 내내 보여야 뜻이 있다.** 접어두면 펴는 사람만 보고, 펴는 사람은 거의 없다.
 *
 * ## 스크롤 스파이를 손으로 안 만든다
 *
 * astryx `Outline`이 **`useScrollSpy`를 이미 갖고 있다**(`dist/Outline/useScrollSpy`).
 * 지금 절이 어디인지 표시하고, 누르면 그리로 굴러간다. 헌장 3절 「astryx에 있는
 * 것을 손으로 다시 만들지 않는다」가 걸리는 자리다.
 *
 * 다만 **`parseOutlineFromMarkdown`은 안 쓴다**(헌장 3절). 슬러그를 `[^a-z0-9]+`로
 * 만들어서 한글 제목이 전부 빈 문자열이 되고 id가 통째로 겹친다. 항목은
 * `lib/doc.ts`의 `docSections()`가 만든 제대로 된 id를 받아서 넣는다.
 *
 * ## 붙어 있게 만드는 법 — 그리드의 함정
 *
 * **`position: sticky`인 그리드 항목은 자기 grid area 안에 갇힌다.** 1행에 두면 그
 * 행 높이만큼만 따라오다 떨어진다.
 *
 * 그래서 CSS에 `grid-row: 1 / -1`이라고 적어 뒀는데 **그게 안 듣는다.** 명시 행
 * (`grid-template-rows`)이 없으면 `-1`이 1번 줄로 풀려서 결국 `1 / 1`, 1행 한 칸이다.
 * 값은 두 번 치러졌다 — ①레일 키만큼 1행이 늘어 **첫 문단 아래에 빈 자리**가 생겼고
 * (지도를 이 안에 넣자 253px로 커져서 River가 바로 짚었다) ②붙어 있으라고 만든
 * `sticky`가 갈 데가 없었다.
 *
 * `repeat()`의 반복 횟수에는 변수를 못 쓰고 `grid-row-end`에는 `calc()`를 못 쓴다.
 * 그래서 **행 수를 여기서 받아 인라인으로 박는다**(`rowCount`가 센다).
 */
export function ReadRail({ items, rows }: { items: OutlineItem[]; rows?: number }) {
  const [open, setOpen] = useState(false)

  return (
    <aside
      className="read-rail"
      aria-label="읽기 도구"
      style={rows ? { gridRow: `1 / ${rows + 1}` } : undefined}
    >
      <Stack direction="vertical" gap={2} hAlign="start" width="100%">
        <Stack direction="horizontal" gap={2} vAlign="center" justify="between" width="100%">
          <Text size="sm" weight="semibold" color="secondary">
            이 포인트의 절
          </Text>
          {/*
            설정은 톱니 하나로 접어둔다. **읽는 사람 대부분은 기본값으로 읽고 끝낸다** —
            River가 처음부터 「사용자 관점에서 잘 설계해서 숨겨놓으면 좋을듯」이라고 한
            그 자리다. 평소엔 흐릿하고 패널에 마우스를 올리면 또렷해진다(CSS).
          */}
          <Popover
            isOpen={open}
            onOpenChange={setOpen}
            placement="below"
            alignment="end"
            width={300}
            label="읽기 설정"
            hasLightDismiss
            content={<ReadSettings />}
          >
            {(trigger) => (
              /*
                **여는 표시(`aria-haspopup`·`aria-expanded`)는 단추가 달아야 한다.**
                처음엔 `<span>`으로 감싸고 거기에 통째로 붙였는데, axe가 critical로
                잡았다 — 평범한 `<span>`은 그 속성을 가질 수 없다(2026-08-18).
                낭독기가 「눌러서 여는 것」이라고 말해 주려면 실제 단추에 있어야 한다.
              */
              <IconButton
                {...trigger}
                className="read-rail-gear"
                label="읽기 설정"
                size="sm"
                variant="ghost"
                icon={<GearIcon />}
              />
            )}
          </Popover>
        </Stack>

        {items.length > 1 ? (
          <Outline items={items} label="이 포인트의 절" density="compact" offset={24} />
        ) : (
          <Text size="sm" color="secondary">
            절이 나뉘지 않은 포인트입니다
          </Text>
        )}

        {/*
          지도가 「옆에」일 때 여기로 들어온다. **여기서 그리지 않는다** — 본문 쪽에
          이미 한 벌이 있고, `MapFollow`가 그 노드를 옮겨 온다. 두 벌을 그리면 한쪽을
          고칠 때 다른 쪽이 조용히 어긋난다.

          목차 **아래**인 것이 중요하다. River가 「이 포인트의 절 아래에서 해당 행의
          부근에 이르면」이라고 자리까지 짚었다.
        */}
        <div className="rail-map-slot" />
      </Stack>
    </aside>
  )
}

/**
 * 톱니. astryx `Icon`은 자체 이름 목록을 쓰는데 여기 필요한 것 하나를 위해 그 목록에
 * 기대지 않는다 — 인라인 SVG 한 줄이 더 싸고 색이 `currentColor`로 따라온다.
 */
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v1.7M8 12.8v1.7M14.5 8h-1.7M3.2 8H1.5M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2M12.6 12.6l-1.2-1.2M4.6 4.6L3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
