// 첫 화면 홍보 영상 팝업(River 2026-09-27 「처음 보는 사람이나 익숙하지 않은 사람들이 볼 수 있게」).
// 첫 방문자가 첫 화면(/)에 왔을 때 한 번. ?promo=1은 강제, ?promo=0은 끈다. 크로노아틀라스 src/promo.ts와 같은 키를 쓴다.
export const PROMO_KEY = 'promo-seen-v1'

export function shouldShowPromo(path: string, search: string, seen: string | null): boolean {
  const q = new URLSearchParams(search)
  if (q.get('promo') === '1') return true
  if (q.get('promo') === '0') return false
  return path === '/' && !seen
}

/** 브라우저에서 지금 팝업이 뜰 차례인가. Tour가 이것을 보고 기다린다 */
export function promoPending(path: string): boolean {
  try {
    return shouldShowPromo(path, location.search, localStorage.getItem(PROMO_KEY))
  } catch {
    return false
  }
}
