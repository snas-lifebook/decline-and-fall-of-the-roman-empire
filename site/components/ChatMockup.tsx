import { renderChatMockupSvg } from '../lib/chatmockup'
import styles from './ChatMockup.module.css'

/**
 * AI 채팅창의 생김새 한 장. `lib/chatmockup.ts`가 빌드타임에 구운 SVG를 그대로
 * 낸다 — `FamilyTree`·`MapFollow`와 같은 방식(`dangerouslySetInnerHTML`).
 *
 * 안의 글자는 자리 표시(「AI가 여기에 답합니다」)이지 실제로 뜨는 답이 아니다.
 * 실제 프롬프트와 실제 결과는 바로 아래 카드(`RecipeCard`)가 보여준다 — 이
 * 그림은 그 카드가 창의 어느 자리에서 일어나는 일인지만 보여준다.
 */
export function ChatMockup() {
  return <div className={styles.wrap} dangerouslySetInnerHTML={{ __html: renderChatMockupSvg() }} />
}
