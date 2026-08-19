'use client'

import { useState } from 'react'
import { Stack, Text, Button, TextInput, useToast } from '@astryxdesign/core'
import { MAX_BODY, type FeedbackContext } from '../lib/feedback'

/**
 * 한 줄 남기기. 폼도 계정도 이동도 없다.
 *
 * **읽던 자리에서 쓰고 남기면 끝난다.** 앞 판은 텔레그램을 열어 방을 고르게
 * 했는데, 그러면 의견이 대화에 섞여 사라지고 어느 화면 이야기였는지가 먼저
 * 묻힌다. 이제 사이트 자신에게 쌓인다.
 *
 * **주소는 사람한테 안 묻는다** — `window.location.pathname`을 붙여 보낸다.
 * 사람이 쓸 것은 하고 싶은 말 하나뿐이다.
 *
 * ## 왜 늘 열려 있나 (2026-08-19)
 *
 * River: 「한줄 남기기 인터렉션이랄까 디자인이 뭔가 너무 쌩뚱맞다」. 앞 판은
 * **글자 링크 목록 사이에 고스트 단추가 하나 끼어** 있었고, 누르면 그 자리에서
 * 세 줄짜리 상자가 펼쳐지며 푸터 높이가 튀었다. 두 가지가 어긋나 있었다.
 *
 *   - **정체가 애매했다.** 옆의 것들은 「눌러서 가는 곳」인데 이것만 「눌러서
 *     여는 것」이라, 같은 모양으로 나란히 서 있으면 안 되는 물건이었다
 *   - **여는 값을 받고 얻는 게 없었다.** 상자 하나 보여주려고 클릭 한 번과
 *     화면이 밀리는 것을 치렀다
 *
 * 그래서 접는 것을 없앴다. 푸터 맨 위의 **제 줄**을 차지하고 늘 열려 있다.
 * 한 줄 쓰는 칸이니 한 줄짜리 입력이고(`TextInput`), 다 쓰면 옆의 단추를 누른다.
 * 보내고 나서도 **자리 크기가 그대로**라 화면이 안 튄다.
 *
 * ## 보낸 결과는 `Toast`로 안내한다 (2026-08-19)
 *
 * 앞 판은 상자 위 안내문을 "남겼습니다. 고맙습니다."로 갈아 끼웠는데, 그 줄은
 * 누르는 단추에서 멀고 색도 옅어서 **정말 보내졌는지 못 보고 지나치기 좋았다**
 * (태봉호님 요청, 2026-08-19). astryx `Toast`는 `useToast()`만으로 뜨고
 * (Provider가 없어도 자기 뜰 자리를 스스로 만든다) 화면 레이아웃을 안 밀어내니
 * "자리 크기가 그대로"라는 원래 원칙과도 안 부딪힌다. 실패는 기본이 자동으로
 * 안 닫히는 `error` 타입이라 — 성공만 알리고 실패는 조용한 폼이 되는 것을 막는다.
 */
type State = 'idle' | 'sending'

export function FeedbackBox({ where, subject }: FeedbackContext) {
  const [text, setText] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<State>('idle')
  const toast = useToast()

  const empty = !text.trim()

  async function send() {
    setState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          where,
          subject,
          path: window.location.pathname,
          body: text,
          trap,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast({ body: '남겼습니다. 고맙습니다.' })
      setText('')
    } catch {
      // 글은 상자에 그대로 둔다. 안 보내진 마당에 쓴 것까지 날리지 않는다
      toast({ body: '안 보내졌습니다. 쓴 글은 그대로 있으니 다시 눌러 주세요.', type: 'error' })
    } finally {
      setState('idle')
    }
  }

  return (
    <div className="leave-line">
      <Stack direction="vertical" gap={0.5} hAlign="start">
        <Text size="sm" weight="semibold">
          한 줄 남기기
        </Text>
        {/*
          **앞 판은 한국어가 아니었다.** 「틀린 것도, 있으면 좋겠는 것도. 어느 화면인지는
          {here}로 같이 갑니다.」 — 첫 문장은 서술어가 없고, 둘째 문장은 무생물이 주어라
          번역기를 돌린 것처럼 읽힌다(River 지적, 2026-08-19).

          고친 원칙 둘. **무엇을 써야 하는지를 먼저 말하고**, 화면 이름이 따라간다는
          사실은 **독자의 이득으로 뒤집어 적는다** — 「같이 갑니다」가 아니라 「따로
          적지 않으셔도 됩니다」다. 같은 기능을 말하지만 앞의 것은 시스템 사정이고
          뒤의 것은 읽는 사람 사정이다.
        */}
        <Text size="sm" color="secondary">
          잘못된 곳이나 있었으면 하는 기능을 알려 주세요. 어느 화면에서 보셨는지는 따로 적지
          않으셔도 됩니다.
        </Text>
        {/* 두 경로 다 열어 둔다 — 깃허브 이슈는 팀원 다수가 못 쓰는 도구라 뺐다(태봉호님, 2026-08-19) */}
        <Text size="sm" color="secondary">
          주용에게 직접 보내셔도 됩니다.
        </Text>
      </Stack>

      {/*
        입력과 단추가 한 줄이다. 좁아지면 CSS가 세로로 접는다 — 여기서 `wrap`을
        쓰지 않는 이유는 입력 칸이 늘 남은 폭을 다 먹어야 하기 때문이다
      */}
      <div className="leave-line-form">
        <TextInput
          label="한 줄 남기기"
          isLabelHidden
          size="sm"
          /*
            **시키지 않는다.** 「여기에 쓰세요」는 빈칸을 채우라는 지시고, 지시를
            받으면 안 쓴다. 문턱을 낮추는 말이어야 한다 — 한 줄이면 된다고 먼저
            말해주는 쪽이 실제로 한 줄을 받는다.
          */
          placeholder="한 줄이면 충분합니다"
          value={text}
          onChange={(v: string) => setText(v.slice(0, MAX_BODY))}
          width="100%"
        />
        {/*
          벌통. 사람 눈에도 낭독기에도 안 걸리고 탭으로도 안 닿는다.
          기계만 채우는 칸이라 채워져 오면 서버가 버린다.
        */}
        <input
          type="text"
          name="email"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />
        <Button
          label={state === 'sending' ? '남기는 중' : '남기기'}
          variant="secondary"
          size="sm"
          isDisabled={empty || state === 'sending'}
          onClick={send}
        />
      </div>
    </div>
  )
}
