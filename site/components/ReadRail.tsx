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
 * **`position: sticky`인 그리드 항목은 자기 grid area 안에 갇힌다.** 이걸 1행에 두면
 * 그 행 높이만큼만 따라오다가 떨어진다. `grid-row: 1 / -1`로 열 전체를 차지하게
 * 하고 `align-self: start`로 내용 높이만 쓰게 해야 끝까지 따라온다. CSS 쪽에 적어뒀다.
 */
export function ReadRail({ items }: { items: OutlineItem[] }) {
  const [open, setOpen] = useState(false)

  return (
    <aside className="read-rail" aria-label="읽기 도구">
      <Stack direction="vertical" gap={2} hAlign="start" width="100%">
        <Stack direction="horizontal" gap={2} vAlign="center" justify="between" width="100%">
          <Text size="sm" weight="semibold" color="secondary">
            이 대목의 절
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
              <span {...trigger} className="read-rail-gear">
                <IconButton
                  label="읽기 설정"
                  size="sm"
                  variant="ghost"
                  icon={<GearIcon />}
                  aria-hidden={false}
                />
              </span>
            )}
          </Popover>
        </Stack>

        {items.length > 1 ? (
          <Outline items={items} label="이 대목의 절" density="compact" offset={24} />
        ) : (
          <Text size="sm" color="secondary">
            절이 나뉘지 않은 대목입니다
          </Text>
        )}
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
