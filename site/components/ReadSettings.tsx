'use client'

import { useSyncExternalStore } from 'react'
import {
  Divider,
  SegmentedControl,
  SegmentedControlItem,
  Slider,
  Stack,
  Switch,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@astryxdesign/core'
import { CARD_TYPES, CARD_TYPE_KO } from '../lib/read/types'
import { FONT_DEFAULT, READ_FONTS, SIZE_DEFAULT, SIZE_STEPS } from '../lib/read/fonts'
import { LAYERS_DEFAULT } from '../lib/place/layers'

/**
 * 읽기 설정 — 어떻게 읽을지 한 자리에 모았다.
 *
 * **앞 판은 본문 위에 떠 있었다.** River: 「설정 토글이 디자인적으로 맞는 자리도
 * 아닌 것 같고 일관성이 없어서」. 맞다 — 본문 위에 뜬 컨트롤은 읽는 것도 고치는
 * 것도 아닌 어중간한 자리다. 이제 오른쪽 패널(`ReadRail`)의 톱니가 이걸 연다.
 *
 * **흩어져 있던 것을 다 데려왔다.** 밝기는 상단 바에, 카드·지도는 본문 위에 있었다.
 * 「읽는 방식」에 대한 것이면 전부 여기다 — 그게 일관성이다.
 *
 * ## 어떻게 도는가
 *
 * **끄고 켜는 것은 CSS다.** 화면은 빌드 때 이미 다 그려져 있고, `<html>`의
 * `data-*` 하나가 무엇을 보여줄지 가른다. 자바스크립트가 하는 일은 그 값을 바꾸고
 * 기억하는 것뿐이라 설정을 만져도 화면이 다시 그려지지 않는다.
 *
 * 고른 값이 리액트 밖(localStorage)에 살므로 `useState`가 아니라
 * `useSyncExternalStore`로 읽는다. 탭을 여러 개 열어도 같이 바뀐다.
 *
 * **저장 키는 `lib/read/boot.ts`가 정본이다.** 첫 페인트 스크립트가 같은 목록을 돌려
 * 칠하므로, 여기서만 키를 새로 지으면 새로고침에 설정이 사라진다 — `read-map`이
 * 실제로 그렇게 빠져 있었다(2026-08-18).
 */

const KEY = {
  cards: 'read-cards',
  map: 'read-map',
  font: 'read-font',
  size: 'read-size',
  tone: 'read-tone',
  focus: 'read-focus',
  layers: 'read-layers',
} as const

/**
 * 카드 기본은 **전부 켜짐**이다.
 *
 * 처음엔 인물·집단만 켜려 했는데, 그러면 저장값이 없는 사람에게 **화면과 단추가
 * 어긋난다** — 속성이 안 붙어 여섯 종이 다 보이는데 단추는 둘만 눌린 채다.
 */
const CARDS_DEFAULT: readonly string[] = CARD_TYPES

/**
 * 지도 기본은 **호버**다. 맨 아래에 두면 다 읽고 나서야 보이고, 맨 위에 두면 읽는
 * 동안 화면 밖으로 나간다(River가 둘 다 짚었다). 호버는 물어볼 때만 답한다.
 */
const MAP_DEFAULT = 'hover'

/** 앞 판의 「본문 위에」를 쓰던 사람들. River가 위쪽도 아니라고 해서 아래로 옮긴다 */
const MOVED: Record<string, string> = { top: 'bottom' }

const MAP_MODES = [
  { id: 'hover', label: '올릴 때', hint: '본문에서 지명에 마우스를 올리면 오른쪽 아래에 뜹니다' },
  { id: 'side', label: '옆에', hint: '오른쪽에 붙박이로 둡니다. 읽는 내내 곁에 두고 싶을 때' },
  { id: 'bottom', label: '본문 아래', hint: '다 읽고 한 번에 훑습니다. 손가락으로 읽을 때 좋습니다' },
  { id: 'off', label: '안 보기', hint: '지명은 눌러서 그 화면으로 갈 수 있습니다' },
] as const

/**
 * 지도에 그릴 지명 종류.
 *
 * **넓은 것이 기본에서 빠져 있다.** `region`·`sea`·`river`는 점 하나로 찍혀 있는데
 * 그 점이 대개 그 지역 대표 도시 위다 — `아프리카`가 `카르타고`에서 300m,
 * `카파도키아`와 `카이사레아`는 좌표가 아예 같다. 켜면 도시 이름이 가려진다.
 *
 * 끄면 최근접 두 지명이 12px 미만인 대목이 **29/30 → 8/30**으로 준다(실측).
 */
const LAYERS = [
  { id: 'city', label: '도시' },
  { id: 'building', label: '건물' },
  { id: 'battlefield', label: '전장' },
  { id: 'island', label: '섬' },
  { id: 'mountain', label: '산' },
  { id: 'cape', label: '곶' },
  { id: 'region', label: '지역' },
  { id: 'sea', label: '바다' },
  { id: 'river', label: '강' },
] as const

const TONES = [
  { id: 'auto', label: '기본', hint: '기기 설정을 따릅니다' },
  { id: 'sepia', label: '회색', hint: '종이에 가까운 미색입니다. 흰 바탕이 눈부실 때' },
] as const

/**
 * 값 여섯 개를 한 문자열로 실어 나를 때 쓰는 구분자.
 *
 * **제어문자를 쓴다.** 처음엔 구분자 없이 이어 붙였다가 카드 목록과 지도 모드가
 * 통째로 뒤섞였다. 공백이나 `|`를 쓰면 카드 목록에 그 글자가 들어오는 날 조용히
 * 깨진다 — `lib/changelog.ts`가 같은 이유로 같은 수법을 쓴다.
 */
const SEP = '\u0001'

const DEFAULTS = [
  CARDS_DEFAULT.join(' '),
  MAP_DEFAULT,
  FONT_DEFAULT,
  String(SIZE_DEFAULT),
  'auto',
  'off',
  LAYERS_DEFAULT.join(' '),
]

const watchers = new Set<() => void>()

function subscribe(notify: () => void) {
  watchers.add(notify)
  window.addEventListener('storage', notify)
  return () => {
    watchers.delete(notify)
    window.removeEventListener('storage', notify)
  }
}

const FALLBACK = DEFAULTS.join(SEP)

function read(): string {
  try {
    const get = (k: string, d: string) => localStorage.getItem(k) ?? d
    const map = get(KEY.map, MAP_DEFAULT)
    return [
      get(KEY.cards, DEFAULTS[0]),
      MOVED[map] ?? map,
      get(KEY.font, FONT_DEFAULT),
      get(KEY.size, String(SIZE_DEFAULT)),
      get(KEY.tone, 'auto'),
      get(KEY.focus, 'off'),
      get(KEY.layers, LAYERS_DEFAULT.join(' ')),
    ].join(SEP)
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
function paint(key: string, attr: string, value: string) {
  document.documentElement.dataset[attr] = value
  if (attr === 'size') document.documentElement.style.setProperty('--read-scale', value)
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장이 막혀도 이번 화면에서는 바뀌어야 한다
  }
  watchers.forEach((w) => w())
}

export function ReadSettings() {
  const [cardsRaw, map, font, sizeRaw, tone, focus, layersRaw] = useSyncExternalStore(
    subscribe,
    read,
    readOnServer,
  ).split(SEP)

  const cards = cardsRaw.split(' ').filter(Boolean)
  const layers = layersRaw.split(' ').filter(Boolean)
  const mode = MAP_MODES.find((m) => m.id === map) ?? MAP_MODES[0]
  const toneNow = TONES.find((t) => t.id === tone) ?? TONES[0]
  // 저장값은 배율(1.12)이지만 슬라이더는 단계(0~4)를 다룬다. 사이에 없는 값이
  // 들어와도 가장 가까운 단계로 떨어뜨린다
  const step = Math.max(
    0,
    SIZE_STEPS.findIndex((s) => Math.abs(s - Number(sizeRaw)) < 0.01),
  )
  const fontNow = READ_FONTS.find((f) => f.id === font) ?? READ_FONTS[0]

  return (
    <Stack direction="vertical" gap={3} hAlign="start">
      {/* ── 글 자체 ────────────────────────────────────── */}
      <Stack direction="vertical" gap={1} hAlign="start" width="100%">
        <Text size="sm" weight="semibold">
          글꼴
        </Text>
        <SegmentedControl
          label="본문 글꼴"
          size="sm"
          value={fontNow.id}
          onChange={(next: string) => paint(KEY.font, 'font', next || FONT_DEFAULT)}
        >
          {READ_FONTS.map((f) => (
            <SegmentedControlItem key={f.id} value={f.id} label={f.label} />
          ))}
        </SegmentedControl>
        <Text size="sm" color="secondary">
          {fontNow.kind} · {fontNow.hint}
        </Text>
      </Stack>

      <Stack direction="vertical" gap={1} hAlign="start" width="100%">
        <Slider
          label={`글자 크기 ${Math.round(SIZE_STEPS[step] * 100)}%`}
          min={0}
          max={SIZE_STEPS.length - 1}
          step={1}
          value={step}
          valueDisplay="none"
          onChange={(v: number) => paint(KEY.size, 'size', String(SIZE_STEPS[v]))}
        />
      </Stack>

      <Stack direction="vertical" gap={1} hAlign="start" width="100%">
        <Text size="sm" weight="semibold">
          바탕
        </Text>
        <SegmentedControl
          label="바탕 색"
          size="sm"
          value={toneNow.id}
          onChange={(next: string) => paint(KEY.tone, 'tone', next || 'auto')}
        >
          {TONES.map((t) => (
            <SegmentedControlItem key={t.id} value={t.id} label={t.label} />
          ))}
        </SegmentedControl>
        <Text size="sm" color="secondary">
          {toneNow.hint}
        </Text>
      </Stack>

      <Switch
        label="집중해서 읽기"
        value={focus === 'on'}
        onChange={(on: boolean) => paint(KEY.focus, 'focus', on ? 'on' : 'off')}
      />
      <Text size="sm" color="secondary">
        좌우를 접고 본문만 남깁니다. Esc로 돌아옵니다.
      </Text>

      <Divider />

      {/* ── 옆에 무엇을 세울지 ──────────────────────────── */}
      <Stack direction="vertical" gap={1} hAlign="start">
        <Text size="sm" weight="semibold">
          옆에 세울 것
        </Text>
        <ToggleButtonGroup
          type="multiple"
          label="옆에 세울 객체 종류"
          size="sm"
          value={cards}
          onChange={(next: string[]) => paint(KEY.cards, 'cards', next.join(' '))}
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
        <SegmentedControl
          label="지도를 어떻게 볼지"
          size="sm"
          value={mode.id}
          onChange={(next: string) => paint(KEY.map, 'map', next || MAP_DEFAULT)}
        >
          {MAP_MODES.map((m) => (
            <SegmentedControlItem key={m.id} value={m.id} label={m.label} />
          ))}
        </SegmentedControl>
        <Text size="sm" color="secondary">
          {mode.hint}
        </Text>
      </Stack>

      <Stack direction="vertical" gap={1} hAlign="start">
        <Text size="sm" weight="semibold">
          지도에 그릴 것
        </Text>
        <ToggleButtonGroup
          type="multiple"
          label="지도에 그릴 지명 종류"
          size="sm"
          value={layers}
          onChange={(next: string[]) => paint(KEY.layers, 'layers', next.join(' '))}
        >
          {LAYERS.map((l) => (
            <ToggleButton key={l.id} value={l.id} label={l.label} />
          ))}
        </ToggleButtonGroup>
        {/* 왜 지역이 꺼져 있는지 묻기 전에 답한다 */}
        <Text size="sm" color="secondary">
          지역·바다·강은 점 하나로 찍혀 있어 도시 이름을 가립니다. 그래서 기본으로
          꺼 뒀습니다.
        </Text>
      </Stack>
    </Stack>
  )
}
