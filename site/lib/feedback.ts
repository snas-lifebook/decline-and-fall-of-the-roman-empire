import { z } from 'zod'

/**
 * 한 줄 남기기.
 *
 * **앞 판은 텔레그램으로 던졌다.** 초안 문장에 화면 이름을 적어 보내면 사람이
 * 방을 골라 붙여넣는 방식이었고, 구조화 저장은 필수가 아니라고 정했었다(2026-08-14).
 * 그 판단을 뒤집는다(2026-08-17). 이유는 하나다 — **의견이 대화에 섞이면 사라진다.**
 * 단톡방에 흘러간 지적은 스무 줄 뒤에 묻히고, 어느 화면 이야기였는지는 더 빨리 묻힌다.
 *
 * 그래서 의견은 이제 **사이트 자신에게 쌓인다**(Cloudflare D1). 사람은 읽던 자리에서
 * 쓰고 남기면 끝이고, 계정도 이동도 없다.
 *
 * **주소는 사람이 안 적는다.** 적으라고 하면 안 적고, 안 적힌 의견은 고칠 수가 없다.
 * `window.location.pathname`을 붙여 보낸다 — 화면이 스스로 자기가 어디인지 안다.
 * `Shell`의 `path` 소품을 안 쓰는 이유도 이것이다. `/download/[point]` 30장이 전부
 * `path="/download"`로 적혀 있어서, 그걸 믿으면 서른 화면이 한 칸으로 뭉친다.
 */

export type FeedbackContext = {
  /** 어느 화면인가 — "포인트 03 인물 목록". 표를 눈으로 훑을 때 읽히는 이름이다 */
  where: string
  /** 무엇에 대한 것인가 — "하스드루발 (한니발의 동생)" */
  subject?: string
}

/** 넘으면 안 받는다. 이보다 긴 이야기는 여기 말고 단톡이나 이슈로 갈 것이다 */
export const MAX_BODY = 2000

/** 도배 판정 창. 이 시간 안에 `RATE_MAX`건을 채우면 그때부터 막는다 */
export const RATE_WINDOW_MIN = 10
export const RATE_MAX = 5

export const feedbackSchema = z.object({
  /** 실제 주소. **이게 이 기능의 전부라 비면 통과 못 한다** */
  path: z.string().min(1).max(200),
  where: z.string().min(1).max(100),
  subject: z.string().max(200).optional(),
  body: z.string().trim().min(1).max(MAX_BODY),
  /*
   * 벌통. 화면에서 안 보이는 칸이라 사람은 절대 안 채운다. 채워져 있으면 기계다.
   * 글자 수가 0이어야 통과하므로 `max(0)`이 곧 "비어 있을 것"이다.
   */
  trap: z.string().max(0).optional(),
})

export type Feedback = z.infer<typeof feedbackSchema>

/**
 * ponytail: 창 안 건수만 센다. 사람이 여럿 붙어 한꺼번에 남기는 날에는
 * 헐거울 수 있는데, 팀 안에서만 도는 주소라 그때 가서 조인다.
 */
export const isFlooding = (recent: number): boolean => recent >= RATE_MAX
