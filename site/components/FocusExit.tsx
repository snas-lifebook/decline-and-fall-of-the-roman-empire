'use client'

import { useSyncExternalStore } from 'react'
import { Button } from '@astryxdesign/core'

/**
 * 집중해서 읽기에서 나가는 길.
 *
 * **들어갈 길이 있으면 나올 길도 보여야 한다.** 앞 판은 Esc만 있었는데, 집중 모드가
 * 상단 바·좌패널·오른쪽 패널을 통째로 숨기므로 **그 설정을 연 톱니까지 같이 사라진다.**
 * River가 「포커스 모드를 해제할 수가 없다」고 한 것이 정확하다 — Esc가 듣더라도
 * 그걸 아는 사람만 나갈 수 있으면 나갈 길이 없는 것과 같다.
 *
 * 「Esc로 돌아옵니다」라는 안내문이 있긴 했는데, **그 안내문이 설정 패널 안에 있었다.**
 * 집중 모드에서는 그것도 안 보인다.
 *
 * 그래서 모드일 때만 뜨는 단추 하나를 오른쪽 위에 둔다. 평소에는 흐릿하고 마우스가
 * 가면 또렷해진다 — 읽는 것을 방해하지 않으면서 있다는 것은 알린다.
 */

const KEY = 'read-focus'
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
    return localStorage.getItem(KEY) ?? 'off'
  } catch {
    return 'off'
  }
}

/** 서버는 사용자 설정을 모른다. 정적 HTML은 늘 꺼진 채로 굽힌다 */
const readOnServer = () => 'off'

function leave() {
  document.documentElement.dataset.focus = 'off'
  try {
    localStorage.setItem(KEY, 'off')
  } catch {
    // 저장이 막혀도 이번 화면에서는 나가야 한다
  }
  watchers.forEach((w) => w())
}

export function FocusExit() {
  const on = useSyncExternalStore(subscribe, read, readOnServer) === 'on'
  if (!on) return null

  return (
    <div className="focus-exit">
      <Button size="sm" variant="secondary" label="집중 해제 (Esc)" onClick={leave} />
    </div>
  )
}
