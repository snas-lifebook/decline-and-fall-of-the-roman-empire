'use client'

import { useSyncExternalStore } from 'react'
import { IconButton } from '@astryxdesign/core'

/**
 * 왼쪽 패널 접기.
 *
 * River: 「왼쪽 패널은 그 요즘에 많이 나오는 토글 펼치기 가리기 아이콘으로 추가해
 * 주시오. 글을 집중해서 읽고 싶을 수도 있다.」
 *
 * **읽기 화면 전용이 아니다.** 전 화면에 걸린다 — 왼쪽 목록이 거슬리는 자리는
 * 읽기 화면만이 아니고, 화면마다 다르게 굴면 그게 더 헷갈린다. 「집중해서 읽기」
 * (`data-focus`)와는 별개다. 그쪽은 상단 바와 오른쪽까지 통째로 접는 큰 스위치이고,
 * 이건 왼쪽 하나만 여닫는 작은 손잡이다.
 *
 * `ThemeToggle`과 같은 수법 — 고른 값이 리액트 밖에 살아서 `useSyncExternalStore`로
 * 읽고, 칠하는 것은 컴포넌트 밖 `paint`가 한다.
 */

const KEY = 'read-rail'
const watchers = new Set<() => void>()

function subscribe(notify: () => void) {
  watchers.add(notify)
  window.addEventListener('storage', notify)
  return () => {
    watchers.delete(notify)
    window.removeEventListener('storage', notify)
  }
}

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? 'on'
  } catch {
    return 'on'
  }
}

/** 서버는 사용자 설정을 모른다. 정적 HTML은 늘 펼친 채로 굽힌다 */
const readOnServer = () => 'on'

function paint(value: string) {
  document.documentElement.dataset.rail = value
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // 저장이 막혀도 이번 화면에서는 바뀌어야 한다
  }
  watchers.forEach((w) => w())
}

export function RailToggle() {
  const open = useSyncExternalStore(subscribe, read, readOnServer) !== 'off'

  return (
    <IconButton
      label={open ? '왼쪽 목록 접기' : '왼쪽 목록 펼치기'}
      size="sm"
      variant="ghost"
      onClick={() => paint(open ? 'off' : 'on')}
      icon={<PanelIcon open={open} />}
    />
  )
}

/**
 * 패널 아이콘. 왼쪽 칸이 채워졌는지로 지금 상태를 말한다 — 화살표만 쓰면
 * 「지금 접힌 건가 접겠다는 건가」가 안 읽힌다.
 */
function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line x1="6.5" y1="2.5" x2="6.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" />
      {open ? <rect x="2.5" y="3.5" width="3" height="9" rx="1" fill="currentColor" /> : null}
    </svg>
  )
}
