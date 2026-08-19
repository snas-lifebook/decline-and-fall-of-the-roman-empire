/**
 * 바깥 링크 레지스트리. **주소는 여기 한 곳에만 산다.**
 *
 * 본문에서는 `[운영 시트](link:sheet)`처럼 id로 부른다 — `lib/doc.ts`의
 * `resolveLinkRefs()`가 실제 주소로 바꾼다. 마크다운을 안 깨면서도 주소가 한 군데에만
 * 있게 되고, 레포명이 바뀌어도 고칠 자리가 하나다.
 *
 * 카드 묶음이 필요하면 `components/LinkCards.tsx`가 `ids` 또는 `category`로 골라 온다.
 *
 * **텔레그램 방 주소는 넣지 않는다** (2026-08-14 결정). 볼트·레포 어디에도 초대 링크가
 * 없고, 문의는 전 화면 하단의 「한 줄 남기기」(텔레그램 공유)로 일원화했다.
 */

export const LINK_CATEGORIES = [
  '작업공간',
  '원본데이터',
  '원전',
  '발표',
  '디자인',
  '도구',
  '참고자료',
] as const

export type LinkCategory = (typeof LINK_CATEGORIES)[number]

export type SiteLink = {
  id: string
  href: string
  title: string
  desc: string
  category: LinkCategory
  /** 회차에 딸린 것. 회차가 늘면 이 표시가 붙은 것만 늘어난다 */
  perSession?: boolean
  /**
   * 카드에 붙는 서비스 아이콘. `public/` 기준 경로다 (예: `/icons/github.png`).
   *
   * **파일을 레포에 받아 둔다.** 런타임에 파비콘 서비스를 부르면 방문 한 번마다
   * 바깥으로 요청이 새고, 그쪽이 죽으면 우리 화면이 같이 빈다.
   *
   * 도메인이 같으면 파일 하나를 나눠 쓴다 — id가 아니라 서비스 이름으로 지은 이유다.
   * 파비콘이 없는 곳(자체 배포 pages.dev)은 **그냥 비운다.** 대신 그릴 것을
   * 지어내면 그게 더 헷갈린다.
   */
  icon?: string
}

export const REPO = 'https://github.com/snas-lifebook/decline-and-fall-of-the-roman-empire'
export const ZIP_URL = `${REPO}/archive/refs/heads/main.zip`

export const SITE_LINKS: SiteLink[] = [
  // 작업공간
  {
    id: 'drive-01',
    href: 'https://drive.google.com/drive/folders/1_gyvcM2fODkgCI0jynVvDbL5FimcyR2T',
    title: '01회차 자료함',
    desc: '구글드라이브입니다. 그 회차에 쓴 자료가 모입니다',
    category: '작업공간',
    icon: '/icons/googledrive.png',
    perSession: true,
  },
  {
    id: 'sheet',
    href: 'https://docs.google.com/spreadsheets/d/12J8h12OY_DyqUNF3L6OdND4e9-K7hC0SEc8vYBDjTuk',
    title: '운영 스프레드시트',
    desc: '일정과 담당이 적히는 편데 운영 시트입니다',
    category: '작업공간',
    icon: '/icons/googlesheets.png',
  },

  // 원본데이터
  {
    id: 'repo',
    href: REPO,
    title: '깃허브',
    desc: '책 본문과 인물·지명 자료가 모여 있는 원본입니다',
    category: '원본데이터',
    icon: '/icons/github.png',
  },
  {
    id: 'zip',
    href: ZIP_URL,
    title: '전체 자료 ZIP',
    desc: '깃을 몰라도 됩니다. 눌러서 받고 압축을 풀면 끝입니다',
    category: '원본데이터',
    icon: '/icons/github.png',
  },
  {
    id: 'repo-ontology',
    href: `${REPO}/tree/main/ontology`,
    title: '인물·관계 데이터',
    desc: '객체 644개와 관계 667개가 들어 있는 폴더입니다',
    category: '원본데이터',
    icon: '/icons/github.png',
  },
  {
    id: 'repo-skills',
    href: `${REPO}/tree/main/.agent/skills`,
    title: 'AI 스킬 정의',
    desc: 'AI에게 시킬 일의 절차서 여덟 벌이 여기 있습니다',
    category: '원본데이터',
    icon: '/icons/github.png',
  },

  // 발표
  {
    id: 'campaign-01',
    href: 'https://roma-campaign.pages.dev/',
    title: '01회차 캠페인 사이트',
    desc: '발표 그 자리에서 함께 보는 화면입니다. 지도와 전투 브리핑, 표결까지',
    category: '발표',
    perSession: true,
  },
  {
    id: 'youtube-sans',
    href: 'https://www.youtube.com/@SanS_%EC%9D%B8%EC%83%9D%EC%B1%85',
    title: '산스 인생책 유튜브',
    desc: '지난 회차 발표 영상이 올라가는 채널입니다',
    category: '발표',
    icon: '/icons/youtube.png',
  },

  // 디자인
  {
    // node-id는 79-192(「프로그램 설치 및 기본 설정」)다. 81-38은 깃 주소가 적힌
    // 텍스트 한 줄이라 열어도 가이드가 안 보인다 — 2026-08-14 피그마 실측
    id: 'figma',
    href: 'https://www.figma.com/design/AgGpqrga65nbd1SpAfzm91/%EC%9D%B8%EC%83%9D%EC%B1%85%ED%8E%B8%EB%8D%B0?node-id=79-192',
    title: '피그마 — 옵시디언 설치 가이드',
    desc: '이 사이트의 설치 그림이 원래 있던 곳입니다',
    category: '디자인',
    icon: '/icons/figma.png',
  },

  // 도구
  {
    id: 'obsidian',
    href: 'https://obsidian.md/',
    title: '옵시디언',
    desc: '자료를 폴더째 열어 읽는 프로그램입니다. 무료이고 계정이 없어도 됩니다',
    category: '도구',
    icon: '/icons/obsidian.png',
  },

  // 참고자료
  /*
    원전 — **우리가 읽는 것은 줄인 판이다.**

    30포인트 편역본은 기번의 여섯 권을 서른 개 물음으로 압축한 것이라, 「원문은
    뭐라고 썼나」가 필요한 자리가 생긴다. 영문 원전은 레포 `source/`에 71장이
    다 들어 있지만, 그건 발표를 준비하는 사람에게 바로 읽을 수 있는 모양이 아니다.

    영문은 구텐베르크, 한국어는 종이책 두 종을 걸어 둔다. 한국어 완역본은 여섯
    권이라 다들 부담스러워하므로 **한 권으로 줄인 판**만 골랐다.
  */
  {
    id: 'gutenberg',
    href: 'https://www.gutenberg.org/ebooks/25717',
    title: '기번 원전 (영문)',
    desc: '여섯 권 전체와 밀먼 주석이 든 프로젝트 구텐베르크 판입니다',
    category: '원전',
  },
  {
    id: 'gutenberg-web',
    href: 'https://www.gutenberg.org/cache/epub/25717/pg25717-images.html',
    title: '기번 원전 — 웹으로 바로 읽기',
    desc: '내려받지 않고 브라우저에서 그대로 여는 판입니다. 그림이 함께 있습니다',
    category: '원전',
  },
  {
    id: 'book-kachi',
    href: 'https://www.yes24.com/product/goods/3822207',
    title: '로마 제국 쇠망사 (까치)',
    desc: '여섯 권을 한 권으로 줄인 축약본입니다. 608쪽, 그림이 함께 실려 있습니다',
    category: '원전',
  },
  {
    id: 'book-dongseo',
    href: 'https://www.yes24.com/product/goods/33150654',
    title: '로마제국쇠망사 (동서문화사)',
    desc: '544쪽 한 권짜리입니다',
    category: '원전',
  },
  {
    id: 'netflix-roman-empire',
    href: 'https://www.netflix.com/title/80096545',
    title: '넷플릭스 「로마 제국」',
    desc: '콤모두스·카이사르·칼리굴라를 한 시즌씩 다룬 다큐드라마입니다',
    category: '참고자료',
  },
  {
    id: 'yt-kingsandgenerals',
    href: 'https://www.youtube.com/@KingsandGenerals',
    title: 'Kings and Generals',
    desc: '전투 전개를 지도로 풀어주는 채널입니다',
    category: '참고자료',
    icon: '/icons/youtube.png',
  },
  {
    id: 'yt-historymarche',
    href: 'https://www.youtube.com/@HistoryMarche',
    title: 'HistoryMarche',
    desc: '포에니 전쟁 편이 특히 좋습니다',
    category: '참고자료',
    icon: '/icons/youtube.png',
  },
  {
    id: 'yt-epichistory',
    href: 'https://www.youtube.com/@EpichistoryTv',
    title: 'Epic History TV',
    desc: '영토 판도 변화를 한눈에 보여줍니다',
    category: '참고자료',
    icon: '/icons/youtube.png',
  },
]

export function linkById(id: string): SiteLink {
  const hit = SITE_LINKS.find((l) => l.id === id)
  // 조용히 빈 주소를 내보내면 화면에 죽은 링크가 남는다. 빌드에서 멈춘다
  if (!hit) throw new Error(`링크 레지스트리에 없는 id: ${id}`)
  return hit
}

export function linksByCategory(category: LinkCategory): SiteLink[] {
  return SITE_LINKS.filter((l) => l.category === category)
}
