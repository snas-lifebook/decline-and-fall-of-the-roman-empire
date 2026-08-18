'use client'

import { useSyncExternalStore } from 'react'
import { Collapsible, Stack, Text, ToggleButton, ToggleButtonGroup } from '@astryxdesign/core'
import { CARD_TYPES, CARD_TYPE_KO } from '../lib/read/types'

/**
 * 읽기 설정 — 옆에 무엇을 세울지, 지도를 어떻게 볼지.
 *
 * **숨겨두되 찾으면 있다.** 읽는 사람 대부분은 기본값으로 읽고 끝낸다. 그래서 접어
 * 두고, 거슬리거나 더 보고 싶은 사람만 편다.
 *
 * **끄고 켜는 것은 CSS다.** 카드도 지도도 빌드 때 이미 다 그려져 있고, `<html>`의
 * `data-cards`·`data-map`이 무엇을 보여줄지 가른다. 자바스크립트가 하는 일은 그 값을
 * 바꾸고 기억하는 것뿐이라 켜고 끌 때 화면이 다시 그려지지 않는다.
 *
 * `ThemeToggle`과 같은 수법이다 — 고른 값이 리액트 밖(localStorage)에 살므로
 * `useState`가 아니라 `useSyncExternalStore`로 읽는다. 탭을 여러 개 열어도 같이 바뀐다.
 */

const CARDS_KEY = 'read-cards'
const MAP_KEY = 'read-map'

/**
 * 카드 기본은 **전부 켜짐**이다.
 *
 * 처음엔 인물·집단만 켜려 했는데, 그러면 저장값이 없는 사람에게 **화면과 단추가
 * 어긋난다** — 속성이 안 붙어 여섯 종이 다 보이는데 단추는 둘만 눌린 채다. 밀도
 * 상한(한 대목 14장·문단 셋에 하나)이 이미 여섯 종을 다 세어 정한 값이라 켜 둬도
 * 벽이 되지 않는다.
 */
const CARDS_DEFAULT: readonly string[] = CARD_TYPES

/**
 * 지도 기본은 **호버**다.
 *
 * 맨 아래에 두면 다 읽고 나서야 보이고, 맨 위에 두면 읽는 동안 화면 밖으로 나간다
 * (River가 둘 다 짚었다). 호버는 물어볼 때만 답하므로 읽는 흐름을 안 건드린다.
 * 마우스가 없는 기기를 위해 「본문 위」도 남겨 둔다.
 */
const MAP_DEFAULT = 'hover'

/**
 * 두 값을 한 문자열로 실어 나를 때 쓰는 구분자.
 *
 * **제어문자를 쓴다.** 처음엔 구분자 없이 이어 붙였다가 카드 목록과 지도 모드가
 * 통째로 뒤섞였다. 공백이나 `|`를 쓰면 카드 목록에 그 글자가 들어오는 날 조용히
 * 깨진다 — `lib/changelog.ts`가 같은 이유로 같은 수법을 쓴다.
 */
const SEP = '\u0001'

const MAP_MODES = [
  { id: 'hover', label: '지명에 올릴 때', hint: '본문에서 지명에 마우스를 올리면 오른쪽 아래에 뜹니다' },
  { id: 'top', label: '본문 위에', hint: '읽기 전에 한 번 훑고 들어갑니다. 손가락으로 읽을 때 좋습니다' },
  { id: 'off', label: '안 보기', hint: '지명은 눌러서 그 화면으로 갈 수 있습니다' },
] as const

const watchers = new Set<() => void>()

function subscribe(notify: () => void) {
  watchers.add(notify)
  window.addEventListener('storage', notify)
  return () => {
    watchers.delete(notify)
    window.removeEventListener('storage', notify)
  }
}

const FALLBACK = `${CARDS_DEFAULT.join(' ')}${SEP}${MAP_DEFAULT}`

function read(): string {
  try {
    const cards = localStorage.getItem(CARDS_KEY) ?? CARDS_DEFAULT.join(' ')
    const map = localStorage.getItem(MAP_KEY) ?? MAP_DEFAULT
    return `${cards}${SEP}${map}`
  } catch {
    return FALLBACK
  }
}

/** 서버는 사용자 설정을 모른다. 정적 HTML은 늘 기본값으로 굽힌다 */
const readOnServer = () => FALLBACK

/**
 * 화면에 칠한다. **컴포넌트 밖에 둔다** — 리액트 규칙이 렌더 안에서 바깥 것을 고치는
 * 것을 막는다. `ThemeToggle`의 `paint`와 같은 자리다.
 */
function paint(key: string, attr: 'cards' | 'map', value: string) {
  document.documentElement.dataset[attr] = value
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장이 막혀도 이번 화면에서는 바뀌어야 한다
  }
  watchers.forEach((w) => w())
}

export function ReadSettings() {
  const [cardsRaw, map] = useSyncExternalStore(subscribe, read, readOnServer).split(SEP)
  const cards = cardsRaw.split(' ').filter(Boolean)
  const mode = MAP_MODES.find((m) => m.id === map) ?? MAP_MODES[0]

  return (
    <Collapsible defaultIsOpen={false} trigger={`읽기 설정 — 카드 ${cards.length}종 · 지도 ${mode.label}`}>
      <Stack direction="vertical" gap={3} hAlign="start">
        <Stack direction="vertical" gap={1} hAlign="start">
          <Text size="sm" weight="semibold">
            옆에 세울 것
          </Text>
          <ToggleButtonGroup
            type="multiple"
            label="옆에 세울 객체 종류"
            size="sm"
            value={cards}
            onChange={(next: string[]) => paint(CARDS_KEY, 'cards', next.join(' '))}
          >
            {CARD_TYPES.map((t) => (
              <ToggleButton key={t} value={t} label={CARD_TYPE_KO[t] ?? t} />
            ))}
          </ToggleButtonGroup>
          {/* 지명이 목록에 없는 이유를 묻기 전에 답한다 */}
          <Text size="sm" color="secondary">
            지명은 카드로 안 세웁니다. 지도가 받습니다.
          </Text>
        </Stack>

        <Stack direction="vertical" gap={1} hAlign="start">
          <Text size="sm" weight="semibold">
            지도
          </Text>
          <ToggleButtonGroup
            type="single"
            label="지도를 어떻게 볼지"
            size="sm"
            value={mode.id}
            onChange={(next: string | null) => paint(MAP_KEY, 'map', next || MAP_DEFAULT)}
          >
            {MAP_MODES.map((m) => (
              <ToggleButton key={m.id} value={m.id} label={m.label} />
            ))}
          </ToggleButtonGroup>
          <Text size="sm" color="secondary">
            {mode.hint}
          </Text>
        </Stack>
      </Stack>
    </Collapsible>
  )
}
