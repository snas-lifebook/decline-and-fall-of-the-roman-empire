/**
 * 한 줄 남기기.
 *
 * 폼을 안 쓴다. 폼은 "웹·코딩 모르는 사람이 가장 쉽게"와 반대 방향이고,
 * 팀은 이미 하루 종일 텔레그램에 들어가 있다. **맥락은 폼 필드가 아니라
 * 문장으로 실린다** — 어느 화면에서 남기는지가 초안에 이미 적혀 있으니
 * 사람은 하고 싶은 말만 쓰면 된다.
 *
 * 구조화 저장은 포기했다. 필수가 아니라고 정했다(2026-08-14).
 */

export type FeedbackContext = {
  /** 어느 화면인가 — "포인트 03 인물 목록" */
  where: string
  /** 무엇에 대한 것인가 — "하스드루발 (한니발의 동생)" */
  subject?: string
}

export function feedbackDraft({ where, subject }: FeedbackContext): string {
  const head = subject ? `${where} · ${subject}` : where
  return `[자료실] ${head}\n\n`
}

/**
 * 텔레그램 공유 주소. **봇도 사용자명도 필요 없다** — 텔레그램이 열리고
 * 어느 방에 보낼지 사용자가 고른다.
 */
export function telegramShareUrl(text: string): string {
  return `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`
}
