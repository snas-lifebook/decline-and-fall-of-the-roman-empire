/**
 * 글자 폭을 재는 자. **DOM 없이, 빌드에서도 브라우저에서도 같은 값을 준다.**
 *
 * `lib/family/layout.ts`에 있던 것을 여기로 뺐다 — 관계망(`components/EgoGraph`)이
 * 같은 자가 필요한데, 그 파일은 `dagre`를 import하므로 클라이언트 컴포넌트가
 * 거기서 가져오면 **dagre가 통째로 브라우저 번들에 실린다.** 순수 함수만 따로 둔다.
 *
 * 한글 음절은 advance가 균일해서(Apple SD Gothic Neo 실측 0.865em) 정확히 나온다.
 * 라틴 가변폭보다 오히려 쉽다. 웹폰트를 바꾸면 이 값을 다시 잰다.
 */

const isHangul = (c: string) => c >= '가' && c <= '힣'

export const HANGUL_ADVANCE = 0.865

export function textWidth(s: string, fontSize: number, hangulAdvance: number = HANGUL_ADVANCE): number {
  return [...s].reduce((w, c) => {
    const adv = isHangul(c) ? hangulAdvance : /[0-9]/.test(c) ? 0.5 : /[A-Za-z]/.test(c) ? 0.55 : 0.35
    return w + fontSize * adv
  }, 0)
}
