'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { IconButton, Stack, Text } from '@astryxdesign/core'
import { SIZE_DEFAULT, SIZE_STEPS } from '../lib/read/fonts'

/**
 * 글자 크기 — 상단 바 오른쪽.
 *
 * River: 「전체적인 글자 크기를 조금 크게 … `-` `=` 로 오른쪽 상단에서 설정할 수
 * 있도록」.
 *
 * ## 설정 패널에 이미 있는데 왜 또 내나
 *
 * 크기는 **읽는 도중에 만지는 것**이라서다. 글꼴이나 바탕은 한 번 정하면 끝이지만
 * 크기는 「지금 좀 작네」 하는 순간에 손이 간다. 그 순간에 톱니를 찾아 패널을 열고
 * 슬라이더를 끄는 것은 세 동작이다. 여기서는 한 번이다.
 *
 * 그래서 **패널의 슬라이더를 없애지 않는다.** 같은 값을 두 자리에서 만지고, 둘이
 * `storage` 이벤트로 서로를 따라간다.
 *
 * ## `-` `=` 를 그대로 쓴다
 *
 * 브라우저 확대가 쓰는 그 두 키다(`⌘-`·`⌘=`). 사람이 이미 아는 손가락이라 배울
 * 것이 없다. 다만 **글을 쓰는 중에는 안 듣는다** — 「한 줄 남기기」에 하이픈을 치는
 * 사람의 글자를 우리가 키우면 안 된다.
 */

const KEY = 'read-size'

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
    return localStorage.getItem(KEY) ?? String(SIZE_DEFAULT)
  } catch {
    return String(SIZE_DEFAULT)
  }
}

/** 서버는 사용자 설정을 모른다. 정적 HTML은 늘 기본값으로 굽힌다 */
const readOnServer = () => String(SIZE_DEFAULT)

/** 저장값(배율)을 단계로. 사이에 없는 값이 들어와도 가장 가까운 단계로 떨어뜨린다 */
function stepOf(raw: string): number {
  const v = Number(raw)
  let best = 0
  for (let i = 1; i < SIZE_STEPS.length; i += 1) {
    if (Math.abs(SIZE_STEPS[i] - v) < Math.abs(SIZE_STEPS[best] - v)) best = i
  }
  return best
}

/**
 * 화면에 칠하고 기억한다. **`ReadSettings`의 `paint`와 같은 일을 한다** — 두 자리가
 * 같은 값을 만지므로, 여기서 바꾼 것을 저쪽이 알아야 슬라이더가 따라 움직인다.
 * 그 통로가 `storage` 이벤트다(`FocusExit`가 쓰는 것과 같다).
 */
function paint(scale: number) {
  const v = String(scale)
  document.documentElement.dataset.size = v
  document.documentElement.style.setProperty('--read-scale', v)
  try {
    localStorage.setItem(KEY, v)
  } catch {
    // 저장이 막혀도 이번 화면에서는 바뀌어야 한다
  }
  watchers.forEach((w) => w())
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }))
}

export function ReadSize() {
  const step = stepOf(useSyncExternalStore(subscribe, read, readOnServer))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      /*
       * **글을 쓰는 중에는 안 듣는다.** 「한 줄 남기기」와 「찾기」가 입력칸이라,
       * 거기서 `-`를 치면 글자가 아니라 화면이 커진다.
       */
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return

      const dir = e.key === '-' || e.key === '_' ? -1 : e.key === '=' || e.key === '+' ? 1 : 0
      if (!dir) return
      e.preventDefault()

      const now = stepOf(read())
      const next = Math.min(SIZE_STEPS.length - 1, Math.max(0, now + dir))
      if (next !== now) paint(SIZE_STEPS[next])
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const move = (dir: -1 | 1) => {
    const next = Math.min(SIZE_STEPS.length - 1, Math.max(0, step + dir))
    if (next !== step) paint(SIZE_STEPS[next])
  }

  return (
    <Stack className="read-size" direction="horizontal" gap={0.5} vAlign="center">
      <IconButton
        label="글자 작게 (-)"
        size="sm"
        variant="ghost"
        isDisabled={step === 0}
        onClick={() => move(-1)}
        icon={<Glyph d="M4 8h8" />}
      />
      {/* 지금 몇 퍼센트인지. 눌러 놓고 되돌릴 자리를 알아야 마음 놓고 누른다 */}
      <Text size="sm" color="secondary">
        {Math.round(SIZE_STEPS[step] * 100)}%
      </Text>
      <IconButton
        label="글자 크게 (=)"
        size="sm"
        variant="ghost"
        isDisabled={step === SIZE_STEPS.length - 1}
        onClick={() => move(1)}
        icon={<Glyph d="M8 4v8M4 8h8" />}
      />
    </Stack>
  )
}

/** 빼기·더하기 두 개뿐이라 아이콘 목록을 부르지 않는다. `ReadRail`의 톱니와 같은 판단 */
function Glyph({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
