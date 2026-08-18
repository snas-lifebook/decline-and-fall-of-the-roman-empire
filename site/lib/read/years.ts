/**
 * 생몰 연대를 한국어 한 줄로.
 *
 * **우리 데이터에는 없다.** 인물 262명 중 `attrs.birth`가 1명, `death`가 3명이고
 * 그중 둘은 연도가 아니라 「battle」·「execution」이다(실측 2026-08-18). 그래서
 * 위키데이터(P569·P570)에서 받아 `data/people.json`에 담아 둔다.
 *
 * 기원전은 음수다 — 이 저장소의 불변식과 같다(AGENTS 3).
 *
 * **「기원전」을 두 번 안 적는다.** 「기원전 100~기원전 44」는 카드 한 줄에 안 들어가고
 * 읽기도 나쁘다. 둘 다 기원전이면 앞에만 적는다. 시대를 걸치면 양쪽을 다 적어야
 * 뜻이 통한다 — 「기원전 63~서기 14」.
 */

const bc = (y: number) => `기원전 ${-y}`

export function lifespan(born: number | null, died: number | null): string | null {
  if (born === null && died === null) return null

  if (born !== null && died !== null) {
    if (born < 0 && died < 0) return `${bc(born)}~${-died}`
    if (born < 0) return `${bc(born)}~서기 ${died}`
    return `${born}~${died}`
  }

  // 한쪽만 아는 것도 값이 있다. 없는 쪽을 지어내지 않는다
  if (born !== null) return born < 0 ? `${bc(born)} 태어남` : `${born}년 태어남`
  return died! < 0 ? `${bc(died!)} 죽음` : `${died}년 죽음`
}
