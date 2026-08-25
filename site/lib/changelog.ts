import { execFileSync } from 'node:child_process'
import { REPO_ROOT } from './ontology'

/**
 * 이 사이트가 언제 무엇이 바뀌었나.
 *
 * **손으로 적지 않는다.** 별도 CHANGELOG 파일을 두면 고치는 걸 잊는 순간
 * 거짓말이 되고, 결국 아무도 안 믿는 문서가 된다. 커밋 기록이 이미 정확한
 * 이력이므로 **빌드 때 읽어 온다** — `lib/datadate.ts`가 데이터 기준일에
 * 쓰는 것과 같은 수법이다.
 *
 * `site/`를 건드린 커밋만 센다. 데이터·문서 커밋은 화면이 안 바뀌므로
 * 「사이트 업데이트」에 넣으면 읽는 사람을 헷갈리게 한다.
 *
 * 커밋 앞머리(`feat:` 따위)는 개발자 말이라 화면에는 한국어로 바꿔 낸다.
 */

export type Change = {
  date: string
  hash: string
  /** 화면에 뜨는 갈래 */
  kind: string
  /** 앞머리를 뗀 제목 */
  title: string
}

/** 커밋 앞머리 → 사람 말. 없는 앞머리는 「바뀐 것」으로 떨어진다 */
const KIND: Record<string, string> = {
  feat: '새로 생긴 것',
  fix: '고친 것',
  refactor: '정리한 것',
  perf: '빨라진 것',
  docs: '문서',
  chore: '살림',
  test: '테스트',
  ci: '배포',
  style: '모양',
}

/**
 * 칸 구분자. 커밋 제목에 절대 안 들어가는 제어문자를 쓴다 — `|`나 탭을 쓰면
 * 제목에 그 글자가 있는 날 조용히 깨진다. **이스케이프로 적는다**: 제어문자를
 * 소스에 그대로 박으면 눈에 안 보여서 편집하다 지워도 모른다.
 */
const SEP = '\u0001'

function parse(line: string): Change | null {
  const [date, hash, ...rest] = line.split(SEP)
  const subject = rest.join(SEP).trim()
  if (!date || !hash || !subject) return null

  const m = /^([a-z]+)(?:\([^)]*\))?:\s*(.+)$/.exec(subject)
  // 화면에 뜨는 제목의 작대기는 콜론으로 바꾼다(River 표기 규칙). git 이력은 그대로 두고
  // 여기 렌더에서만 정규화하므로 과거 커밋과 앞으로의 커밋이 함께 정리된다.
  const rawTitle = m ? m[2] : subject
  return {
    date,
    hash,
    kind: m ? (KIND[m[1]] ?? '바뀐 것') : '바뀐 것',
    title: rawTitle.replace(/\s*(?:—|--)\s*/g, ': '),
  }
}

let cached: Change[] | undefined

export function changelog(): Change[] {
  if (cached) return cached
  try {
    const out = execFileSync(
      'git',
      ['log', `--pretty=format:%ad${SEP}%h${SEP}%s`, '--date=short', '--', 'site'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    )
    cached = out.split('\n').flatMap((l) => parse(l) ?? [])
  } catch {
    // 빌드 환경에 git이 없거나 레포가 아니다. 빈 목록이면 화면이 스스로 숨는다
    cached = []
  }
  return cached
}

/** 사이트가 마지막으로 바뀐 날. 푸터에 상시 뜬다 */
export function siteUpdated(): string | undefined {
  return changelog()[0]?.date
}

/** 날짜별로 묶는다. 하루에 여러 번 고친 날이 많다 */
export function changesByDate(): { date: string; items: Change[] }[] {
  const groups = new Map<string, Change[]>()
  for (const c of changelog()) {
    const list = groups.get(c.date)
    if (list) list.push(c)
    else groups.set(c.date, [c])
  }
  // `git log`가 이미 최신순이라 Map의 삽입 순서가 곧 표시 순서다
  return [...groups].map(([date, items]) => ({ date, items }))
}
