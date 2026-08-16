import type { Entity } from '../ontology'

/**
 * 남녀 구분.
 *
 * **데이터에 성별 필드가 없다.** 그래서 서술에 이미 적힌 관계어에서만 읽는다 —
 * 「~의 딸」「미망인」「황비」처럼 그 사람이 누구인지를 말하는 말들이다.
 * 추측하지 않는다. 근거가 없으면 **미상**으로 두고 색을 안 칠한다
 * (`family/족보_표기_설계.md`의 채널 배정: 청록=남 · 보라=여 · 무색=미상).
 *
 * 여성 규칙을 먼저 본다. 「남동생」이 「동생」에 걸리거나 「여제」가 「황제」에
 * 걸리는 식의 오분류를 순서로 막는다.
 */

export type Sex = 'm' | 'f' | undefined

const F =
  /여왕|황후|황비|여제|왕비|미망인|귀부인|공녀|차녀|의 딸|의 아내|의 어머니|의 여동생|의 누나|의 언니|의 며느리|의 손녀|된 여성|결혼한 여성|empress|queen|noblewoman|wife of|sister of|^daughter|^mother/i

const M =
  /의 아들|의 아버지|의 조부|의 백부|의 숙부|의 증조부|의 남동생|의 형|장남|양자|황제|황자|부제|왕으로|의 조카|emperor|king|prince|consul|general|senator|heir|prophet|tribal leader|uncle|ancestor|beast_keeper|^son|^father/i

export function sexOf(e: Entity): Sex {
  // 이름·역할·설명을 한 덩어리로 본다. 어디에 적혀 있든 근거는 근거다
  const hay = `${e.name} ${String(e.attrs?.role ?? '')} ${e.desc ?? ''}`
  if (F.test(hay)) return 'f'
  if (M.test(hay)) return 'm'
  return undefined
}
