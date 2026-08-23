'use client'

import { useSyncExternalStore } from 'react'
import { Button } from '@astryxdesign/core'

/**
 * 밝게 / 어둡게 / 시스템.
 *
 * astryx 테마가 `html[data-theme]`로 이미 두 벌을 갖고 있다 — 우리가 하는 일은
 * 그 속성을 바꾸고 고른 것을 기억하는 것뿐이다. 색을 새로 정하지 않는다.
 *
 * **세 상태인 이유**: 둘로 두면 한 번 누르는 순간 시스템 설정으로 돌아갈 길이
 * 없어진다. 낮에 밝게 보다가 밤에 기기가 어두워져도 사이트만 밝은 채로 남는다.
 *
 * **첫 칠은 여기서 안 한다.** `layout.tsx`의 인라인 스크립트가 첫 페인트 전에
 * 끝낸다 — 안 그러면 어둡게 쓰는 사람이 페이지마다 흰 화면을 한 번 본다.
 *
 * 고른 값은 **리액트 밖에 산다**(localStorage + 기기 설정). 그래서 `useState`가
 * 아니라 `useSyncExternalStore`로 읽는다. 덤으로 탭을 여러 개 열어둬도 같이 바뀐다.
 */

type Mode = 'system' | 'light' | 'dark'

const LABEL: Record<Mode, string> = { system: '시스템', light: '밝게', dark: '어둡게' }

/**
 * 다음 상태. **고정 순서(system→light→dark)로 두면 헛클릭이 생긴다** —
 * 밝은 기기를 쓰는 사람은 첫 번째 누름에서 화면이 그대로라 버튼이 고장 난 줄
 * 안다(검수 실측: 라이트 OS에서 클릭 전후 배경 `rgb(241,244,247)` 동일).
 * 사무실 윈도우는 대개 밝은 설정이라 팀원 대부분이 그 자리를 밟는다.
 *
 * 그래서 **시스템에서는 지금 보이는 것의 반대로 간다.** 첫 누름이 늘 화면을
 * 바꾸고, 두 번째가 나머지 하나, 세 번째가 시스템으로 돌아온다.
 */
function nextOf(mode: Mode, systemIsDark: boolean): Mode {
  if (mode === 'system') return systemIsDark ? 'light' : 'dark'
  return mode === (systemIsDark ? 'light' : 'dark') ? (systemIsDark ? 'dark' : 'light') : 'system'
}

const KEY = 'theme'
const watchers = new Set<() => void>()

function subscribe(notify: () => void) {
  watchers.add(notify)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  // 시스템을 따르는 동안 기기 설정이 바뀌면 같이 따라간다
  const onSystem = () => {
    if (read() === 'system') paint('system')
    notify()
  }
  mq.addEventListener('change', onSystem)
  window.addEventListener('storage', notify)
  return () => {
    watchers.delete(notify)
    mq.removeEventListener('change', onSystem)
    window.removeEventListener('storage', notify)
  }
}

const read = (): Mode => {
  try {
    return (localStorage.getItem(KEY) as Mode | null) ?? 'system'
  } catch {
    return 'system'
  }
}

/** 서버는 사용자 설정을 모른다. 정적 HTML은 늘 이 값으로 굽힌다 */
const readOnServer = (): Mode => 'system'

function paint(mode: Mode) {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, read, readOnServer)

  const click = () => {
    const next = nextOf(mode, window.matchMedia('(prefers-color-scheme: dark)').matches)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // 사생활 모드 등으로 저장이 막혀도 이번 화면에서는 바뀌어야 한다
    }
    paint(next)
    watchers.forEach((w) => w())
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      label={LABEL[mode]}
      onClick={click}
      // 「시스템」만으로는 지금 밝은지 어두운지를 안 알려준다(검수 지적)
      aria-label={`화면 밝기: 지금 ${LABEL[mode]}${mode === 'system' ? ' (기기 설정을 따릅니다)' : ''}. 눌러서 바꿉니다`}
    />
  )
}
