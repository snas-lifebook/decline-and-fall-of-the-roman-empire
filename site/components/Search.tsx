'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  CommandPalette,
  CommandPaletteFooter,
  CommandPaletteInput,

  Stack,
  Text,
} from '@astryxdesign/core'
import { searchItems, type SearchItem } from '../lib/search/match'
import { SearchIcon } from './icons'

/**
 * 이름으로 찾기 (T3.4) — `⌘K`.
 *
 * **팔레트를 손으로 만들지 않는다.** astryx `CommandPalette`가 대화상자·키보드
 * 이동·묶음·빈 상태를 다 준다(헌장 15). 우리가 넣는 것은 **한국어로 맞히는 법**
 * 하나뿐이고 그건 `lib/search.ts`에 있다.
 *
 * 색인은 **처음 열 때 한 번** 받는다(124KB). 컴포넌트에 import하면 739장 전부의
 * 번들에 붙으므로 정적 파일로 굽고 `fetch`한다. 두 번째부터는 캐시에서 온다.
 *
 * **트리거는 겉모습만 둘, 팔레트는 하나**(River #9). 진짜 입력을 하나 더 만들면
 * 상태·초성매칭이 갈라지니, 겉만 입력창처럼 보이는 단추로 같은 팔레트를 연다
 * (Stripe·Algolia DocSearch가 쓰는 방식).
 *
 * `variant="box"`는 상단 바에 서는 검색 박스다(River: 「검색은 맨 위 라인에 있어야
 * 할듯」). 앞서 첫 화면 본문 한복판에 큰 박스를 뒀다가 상단 바로 올렸다 — 검색은
 * 화면 전체에 대한 행동이라 밝기·글자크기와 같은 줄에 선다. `button`(ghost)은 남겨
 * 두되 지금은 안 쓴다.
 */

type Item = { id: string; label: string; auxiliaryData: SearchItem }

const toItem = (s: SearchItem): Item => ({ id: s.id, label: s.name, auxiliaryData: s })

export function Search({ variant = 'button' }: { variant?: 'button' | 'box' }) {
  const [isOpen, setIsOpen] = useState(false)
  const index = useRef<SearchItem[] | null>(null)
  const [ready, setReady] = useState(false)

  // 팔레트를 처음 열 때 색인을 받는다. 안 열면 한 바이트도 안 받는다
  useEffect(() => {
    if (!isOpen || index.current) return
    let alive = true
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data: SearchItem[]) => {
        if (!alive) return
        index.current = data
        setReady(true)
      })
      .catch(() => {
        // 색인을 못 받으면 조용히 빈 결과가 된다. 사이트 나머지는 멀쩡하다
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((v) => !v)
        return
      }

      /*
       * **치고 나서 바로 엔터가 안 먹던 것.**
       *
       * astryx `useCombobox`는 `highlightedIndex`를 -1로 시작하고, 그걸 채우는
       * 곳이 트리거 클릭뿐이다(검색 입력이 있으면 그마저 건너뛴다). 그래서 이름을
       * 치고 엔터를 누르면 **아무 일도 안 일어나고**, 먼저 ↓를 눌러야 했다.
       * 사람은 치고 엔터를 친다.
       *
       * 골라둔 것이 있으면 손대지 않는다 — `aria-activedescendant`가 그 신호다.
       * 비어 있을 때만 **첫 결과로** 보낸다. astryx의 처리와 겹치지 않는다.
       */
      if (e.key !== 'Enter' || !isOpen) return
      const input = document.querySelector<HTMLInputElement>('dialog[open] input')
      if (!input || input.getAttribute('aria-activedescendant')) return
      const first = index.current ? searchItems(index.current, input.value)[0] : undefined
      if (!first) return
      e.preventDefault()
      window.location.href = first.href
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  // `useRef(...).current`를 렌더에서 읽으면 eslint가 막는다(react-hooks/refs).
  // `useMemo`로 한 번만 만들고, ref는 **호출 시점에** 클로저 안에서 읽는다
  const searchSource = useMemo(
    () => ({
      search: (q: string) => (index.current ? searchItems(index.current, q).map(toItem) : []),
      bootstrap: () => [],
    }),
    [],
  )

  const go = useCallback((value: string) => {
    const hit = index.current?.find((i) => i.id === value)
    if (hit) window.location.href = hit.href
  }, [])

  return (
    <>
      {variant === 'box' ? (
        <button
          type="button"
          className="search-box"
          onClick={() => setIsOpen(true)}
          aria-keyshortcuts="Meta+K Control+K"
          aria-label="이름으로 찾기"
        >
          <SearchIcon />
          <span className="search-box-ph">검색</span>
          {/* 초성도 된다는 것을 팔레트를 열기 전 귀띔 — 좁으면 CSS가 감춘다 */}
          <kbd className="search-box-kbd" aria-hidden="true">
            ⌘K
          </kbd>
        </button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          label="찾기"
          onClick={() => setIsOpen(true)}
          aria-keyshortcuts="Meta+K Control+K"
        />
      )}
      <CommandPalette<Item>
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        searchSource={searchSource}
        onValueChange={go}
        label="이름으로 찾기"
        input={<CommandPaletteInput placeholder="인물·지명·포인트 이름 (초성도 됩니다)" />}
        /*
          기본 꼬리말이 「Navigate / Select / Close」 영문이라 우리가 쓴다.
          **`Kbd`를 안 쓴다** — 그 컴포넌트는 낭독기용 이름을 `Up arrow`·`Enter`처럼
          영어로 하드코딩하고 있고, 그 문자열은 로케일 카탈로그에 없어서 한국어
          오버라이드로 못 덮는다(2026-08-17 실측). 화면 전체가 한국어인데 키 이름
          넷만 영어로 남았다. 글자로 쓰면 그 문제가 통째로 사라진다.
        */
        footer={
          <CommandPaletteFooter>
            <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
              <Text size="sm" color="secondary">
                위아래 화살표로 이동 · Enter로 열기 · Esc로 닫기
              </Text>
            </Stack>
          </CommandPaletteFooter>
        }
        emptyBootstrapText="인물·지명·포인트 이름을 치세요. 초성도 됩니다 (ㅋㅇㅅㄹ)"
        emptySearchText={ready ? '그런 이름은 없습니다' : '자료를 불러오는 중입니다'}
        renderItem={(item) => (
          <Stack direction="horizontal" gap={1.5} vAlign="center" justify="between" width="100%">
            <Text>{item.label}</Text>
            {/* 「기독교」가 둘 있다. 무엇인지 옆에 안 적으면 어느 쪽인지 모른다 */}
            <Text size="sm" color="secondary">
              {item.auxiliaryData.group}
            </Text>
          </Stack>
        )}
      />
    </>
  )
}
