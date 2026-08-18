'use client'

import { useSyncExternalStore } from 'react'
import { Collapsible, Stack, Text, ToggleButton, ToggleButtonGroup } from '@astryxdesign/core'
import { CARD_TYPES, CARD_TYPE_KO } from '../lib/read/types'

/**
 * 옆에 무엇을 세울지 고르기.
 *
 * **숨겨두되 찾으면 있다.** 읽는 사람 대부분은 기본값으로 읽고 끝낸다. 그래서 접어
 * 두고, 카드가 거슬리거나 종류를 줄이고 싶은 사람만 편다.
 *
 * **끄고 켜는 것은 CSS다.** 카드는 빌드 때 이미 다 그려져 있고, `<html data-cards>`에
 * 무엇이 적혔는지에 따라 보이거나 안 보인다(`globals.css`). 자바스크립트가 하는 일은
 * 그 한 글자를 바꾸고 기억하는 것뿐이라 켜고 끌 때 화면이 다시 그려지지 않는다.
 *
 * `ThemeToggle`과 같은 수법이다 — 고른 값이 리액트 밖(localStorage)에 살므로
 * `useState`가 아니라 `useSyncExternalStore`로 읽는다. 탭을 여러 개 열어도 같이 바뀐다.
 */

const KEY = 'read-cards'

/**
 * 기본은 **전부 켜짐**이다.
 *
 * 처음엔 인물·집단만 켜려 했는데, 그러면 저장값이 없는 사람에게 **화면과 단추가
 * 어긋난다** — 속성이 안 붙어 여섯 종이 다 보이는데 단추는 둘만 눌린 채다. 게다가
 * 밀도 상한(한 대목 14장·문단 셋에 하나)은 이미 여섯 종을 다 세어 정한 값이라 켜
 * 둬도 벽이 되지 않는다. 그래서 「기본으로 덜 보여주고 찾으면 더」가 아니라
 * **「기본으로 다 보여주고 거슬리면 끄기」**로 간다.
 */
const DEFAULT: readonly string[] = CARD_TYPES

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
    return localStorage.getItem(KEY) ?? DEFAULT.join(' ')
  } catch {
    return DEFAULT.join(' ')
  }
}

/** 서버는 사용자 설정을 모른다. 정적 HTML은 늘 기본값으로 굽힌다 */
const readOnServer = () => DEFAULT.join(' ')

/**
 * 화면에 칠한다. **컴포넌트 밖에 둔다** — 리액트 규칙이 렌더 함수 안에서 바깥 것을
 * 고치는 것을 막는다. `ThemeToggle`의 `paint`와 같은 자리다.
 */
function paint(value: string) {
  document.documentElement.dataset.cards = value
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // 저장이 막혀도 이번 화면에서는 바뀌어야 한다
  }
  watchers.forEach((w) => w())
}

export function CardFilter() {
  const on = useSyncExternalStore(subscribe, read, readOnServer).split(' ').filter(Boolean)

  return (
    <Collapsible defaultIsOpen={false} trigger={`옆에 세울 것 ${on.length}종`}>
      <Stack direction="vertical" gap={1.5} hAlign="start">
        {/* 묶음이 눌린 값을 관리한다. 우리는 그 결과를 화면과 저장소에 옮길 뿐이다 */}
        <ToggleButtonGroup
          type="multiple"
          label="옆에 세울 객체 종류"
          size="sm"
          value={on}
          onChange={(next: string[]) => paint(next.join(' '))}
        >
          {CARD_TYPES.map((t) => (
            <ToggleButton key={t} value={t} label={CARD_TYPE_KO[t] ?? t} />
          ))}
        </ToggleButtonGroup>
        {/* 지명이 목록에 없는 이유를 묻기 전에 답한다 */}
        <Text size="sm" color="secondary">
          지명은 카드로 안 세웁니다. 이 대목의 지명은 아래 지도가 받습니다.
        </Text>
      </Stack>
    </Collapsible>
  )
}
