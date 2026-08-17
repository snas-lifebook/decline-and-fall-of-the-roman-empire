import { choseong } from './search/match'

/**
 * 가나다 색인 — 긴 목록을 초성으로 끊는다.
 *
 * **인물 262명·지명 225곳이 폰에서 20화면이었다**(16,707px). 걸러낼 방법이
 * 화면 안에 없어서 「가나다순」이라는 라벨만 있고 262명을 훑을 수밖에 없었다.
 * 상단 「찾기」가 있긴 하지만, **목록에 들어온 사람은 훑어보려고 들어온 것**이라
 * 거기서 검색으로 되돌리는 건 동선이 어긋난다.
 *
 * 초성 추출은 이미 `search/match.ts`가 갖고 있다 — 유니코드 산술 한 줄이라
 * `es-hangul`을 안 넣었던 그 함수다(헌장 「라이브러리 추가 규칙」). 여기서 다시
 * 만들지 않고 그대로 쓴다.
 *
 * 클라이언트 JS는 0줄이다. 빌드 때 묶고 앵커로 뛴다.
 */

export type Bucket<T> = { key: string; items: T[] }

/** 초성이 아닌 것(로마자·숫자로 시작하는 이름)이 가는 칸 */
const OTHER = '그 밖'

/**
 * 이름 첫 글자의 초성으로 묶는다. **순서는 들어온 순서를 지킨다** — 부르는 쪽이
 * 이미 가나다로 정렬해 놓았고, 여기서 다시 정렬하면 그 결정을 덮어쓴다.
 */
export function byChoseong<T>(items: T[], nameOf: (t: T) => string): Bucket<T>[] {
  const out: Bucket<T>[] = []
  const at = new Map<string, Bucket<T>>()

  for (const item of items) {
    const first = nameOf(item).trim()[0] ?? ''
    const cho = choseong(first)
    // 한글이 아니면 `choseong`이 글자를 그대로 돌려준다. 그건 초성 칸이 아니다
    const key = /^[ㄱ-ㅎ]$/.test(cho) ? cho : OTHER
    let b = at.get(key)
    if (!b) {
      b = { key, items: [] }
      at.set(key, b)
      out.push(b)
    }
    b.items.push(item)
  }
  return out
}

/** 앵커 id. 한글은 주소에서 퍼센트 인코딩되므로 순번으로 짧게 간다 */
export const bucketId = (i: number) => `cho-${i + 1}`
