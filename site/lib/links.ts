/**
 * 바깥 작업 공간 링크. **한 곳에서만 관리한다.**
 *
 * 주소의 정본은 볼트 `Works/로마쇠망사_자료실/로마쇠망사_자료실.md`
 * 「바깥 작업 공간」이고 여기로 옮겨 적는다. 두 군데 손으로 쓰면 어긋난다.
 */

export type WorkspaceLink = {
  href: string
  title: string
  desc: string
  /** 회차에 딸린 것. 회차가 늘면 이쪽은 회차별 페이지로 옮긴다 */
  perSession?: boolean
}

export const REPO = 'https://github.com/snas-lifebook/decline-and-fall-of-the-roman-empire'

export const WORKSPACE_LINKS: WorkspaceLink[] = [
  {
    href: 'https://roma-campaign.pages.dev/',
    title: '01회차 캠페인 사이트',
    desc: '발표 그 자리에서 함께 보는 화면입니다. 지도와 전투 브리핑, 표결까지',
    perSession: true,
  },
  {
    href: 'https://drive.google.com/drive/folders/1_gyvcM2fODkgCI0jynVvDbL5FimcyR2T',
    title: '01회차 자료함',
    desc: '구글드라이브입니다. 그 회차에 쓴 자료가 모입니다',
    perSession: true,
  },
  {
    href: 'https://docs.google.com/spreadsheets/d/12J8h12OY_DyqUNF3L6OdND4e9-K7hC0SEc8vYBDjTuk',
    title: '운영 스프레드시트',
    desc: '편데 운영 시트입니다',
  },
  {
    href: REPO,
    title: '깃허브',
    desc: '책 본문과 인물·지명 자료가 모여 있는 원본입니다',
  },
  {
    // node-id는 79-192(「프로그램 설치 및 기본 설정」)다. 81-38은 깃 주소가 적힌
    // 텍스트 한 줄이라 열어도 가이드가 안 보인다 — 2026-08-14 피그마 실측으로 확인.
    href: 'https://www.figma.com/design/AgGpqrga65nbd1SpAfzm91/%EC%9D%B8%EC%83%9D%EC%B1%85%ED%8E%B8%EB%8D%B0?node-id=79-192',
    title: '피그마 — 옵시디언 설치 가이드',
    desc: '단계별 화면 스크린샷이 여기에 있습니다',
  },
]

/** 전체 자료를 통째로 받는 주소. 우리가 zip을 만들지 않는다 */
export const ZIP_URL = `${REPO}/archive/refs/heads/main.zip`
