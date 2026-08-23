/**
 * 목적 카드에 붙는 라인 아이콘. **손으로 그린 path만 있다.**
 *
 * 아이콘 패키지를 안 붙인 이유: 다섯 개 쓰자고 수백 개짜리 의존성을 들이면 번들도
 * 늘고 판올림도 따라다녀야 한다. 그림 다섯 장은 그냥 그리는 게 싸다.
 *
 * **이모지는 안 쓴다** (헌장). 이모지는 기기마다 다르게 그려지고 제 색을 고집해서
 * 글자와 같이 늙지 않는다. `stroke="currentColor"`인 선 아이콘은 글자색을 따라간다.
 *
 * 전부 24×24 viewBox에 1.5 두께. 굵기가 섞이면 다섯 개가 한 벌로 안 보인다.
 */

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      // 옆에 제목이 그대로 있다. 읽어 주면 같은 말을 두 번 듣는다
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** 읽기 — 펼친 책 */
export function BookIcon() {
  return (
    <Icon>
      <path d="M3.5 5.5c3-1 5.5-.8 8.5 1.2v12c-3-2-5.5-2.2-8.5-1.2z" />
      <path d="M20.5 5.5c-3-1-5.5-.8-8.5 1.2v12c3-2 5.5-2.2 8.5-1.2z" />
    </Icon>
  )
}

/** 찾아보기 — 돋보기 */
export function SearchIcon() {
  return (
    <Icon>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </Icon>
  )
}

/** 가져가기 — 받아서 내려놓기 */
export function DownloadIcon() {
  return (
    <Icon>
      <path d="M12 3.5v11" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M4.5 19.5h15" />
    </Icon>
  )
}

/** 활용하기 — 반짝임. AI를 사람 얼굴이나 로봇으로 그리지 않는다 */
export function SparkIcon() {
  return (
    <Icon>
      <path d="M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7z" />
      <path d="M17.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </Icon>
  )
}

/** 시작하기 — 깃발 */
export function FlagIcon() {
  return (
    <Icon>
      <path d="M5.5 20.5V4" />
      <path d="M5.5 5c3.5-1.5 6.5 1.5 10 0v7.5c-3.5 1.5-6.5-1.5-10 0z" />
    </Icon>
  )
}

/* 활용 사례 갈래 아이콘 (#17). 같은 24×24·1.5 두께 규약을 상속한다 */

/** 발표 준비 — 화면과 받침 */
export function PresentIcon() {
  return (
    <Icon>
      <rect x="3.5" y="4.5" width="17" height="11" rx="1.5" />
      <path d="M12 15.5v3" />
      <path d="M8.5 20.5l3.5-2 3.5 2" />
    </Icon>
  )
}

/** 인물 확인 — 두 사람(앞뒤로 겹친다) */
export function PeopleIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 14.6c2.2.5 3.5 2.3 3.5 4.9" />
    </Icon>
  )
}

/** 사실 확인 — 원 안의 체크(대조해 맞음) */
export function VerifyIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </Icon>
  )
}

/** 흐름 잡기 — 이어진 관계 노드(ego 그래프 계열) */
export function FlowIcon() {
  return (
    <Icon>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="6" cy="17" r="2.2" />
      <circle cx="17.5" cy="12" r="2.2" />
      <path d="M8 8.2l7.5 2.9M8 15.8l7.5-2.9" />
    </Icon>
  )
}

/** AI에 줄 자료 — 모서리 접힌 문서에 줄 */
export function DocIcon() {
  return (
    <Icon>
      <path d="M6 3.5h7l5 5v12H6z" />
      <path d="M13 3.5v5h5" />
      <path d="M9 13h6M9 16.5h6" />
    </Icon>
  )
}
