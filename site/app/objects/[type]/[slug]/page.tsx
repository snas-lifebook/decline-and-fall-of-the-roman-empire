import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  Collapsible,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { FocusExit } from '../../../../components/FocusExit'
import {
  EntityAside,
  EntityGraph,
  CoOccurred,
  CO_SHOWN,
} from '../../../../components/EntityAside'
import { loadEntities, loadLinks, type Entity } from '../../../../lib/ontology'
import { entityIndex, entitySlug, neighbors, coOccurring } from '../../../../lib/entity'
import { TYPE_KO } from '../../../../lib/export/table'
import { roleKo } from '../../../../lib/vocab'
import { navCrumbs } from '../../../../lib/nav'
import { pageMeta } from '../../../../lib/meta'
import { familyOf } from '../../../../lib/family/build'
import { portraitOf, lifespanOf } from '../../../../lib/read/people'
import { Faq } from '../../../../components/Faq'
import { faqFor } from '../../../../lib/faq'
import { timelineOf } from '../../../../lib/timeline/build'
import { RelationTimeline } from '../../../../components/RelationTimeline'

/**
 * 객체 한 장 × 644.
 *
 * 뼈대는 `DocPage`와 **똑같은 순서**다 — 빵부스러기 → 배지·제목 → 한 줄 소개 →
 * 페이지 복사 → 본문 → 우측 날개. 화면마다 이 순서가 같은 것이 「퀄리티」의 정체다.
 *
 * 본문은 "이게 무엇인가", 날개는 "무엇과 직접 이어져 있나"다 — 포인트별 서술 ·
 * 등장 포인트 · 동석 · 연표 · 속성이 본문이고, 관계망 그림과 관계 목록이 날개다.
 *
 * **예외 하나: 관계 연표는 본문에 있다** (2026-08-17). 관계인데도 날개가 아닌 이유는
 * 폭이다 — 로마의 연표는 2,200년을 가로로 펴야 하고, 300픽셀에 눌러 담으면 막대가
 * 전부 한 점으로 뭉친다. 관계망을 날개로 옮길 때 배운 것과 같은 계산이다.
 *
 * ## 2026-08-19 — 읽기 화면이 8/18에 정한 것을 여기까지 끌고 온다
 *
 * 읽기 화면을 이틀에 걸쳐 다시 짜는 동안 객체 644장은 검수를 안 받았고, 그래서
 * 세 군데가 **읽기 화면과 반대로** 서 있었다. 셋 다 실측으로 잡았다.
 *
 *   - **스크롤이 둘이었다.** 날개가 990px인데 상자가 852px이라 안에서 혼자 굴렀다.
 *     읽기 화면은 8/18에 이걸 하나로 줄였다. 넘치는 몫인 동석을 본문으로 내렸다
 *   - **「자주 묻는 것」이 본문 한가운데 461px 벽으로 펴져 있었다.** 읽기 화면은
 *     같은 것을 17px 접힌 줄로 맨 끝에 둔다. 그 벽 **뒤에** 「속성」이 있어서,
 *     이 객체의 사실이 사이트 공통 물음 아래로 밀려 있었다
 *   - **집중해서 읽기에서 나갈 길이 없었다.** `data-focus`는 화면을 안 가리는
 *     전역 설정이라 객체 화면에서도 상단 바·좌패널·푸터가 사라지는데, 그걸 되돌릴
 *     단추(`FocusExit`)도 Esc를 받는 `ReadCards`도 여기엔 없었다. 읽기에서 켜고
 *     본문 링크를 한 번 누르면 **644장 어디에서도 못 빠져나온다**
 *
 * 644장을 그린다. `loadEntities()`·`loadLinks()`는 **모듈에서 한 번**이다.
 * 페이지 함수 안에서 부르면 파일을 644번 읽고 zod로 41만 번 파싱한다.
 */

const ENTITIES = loadEntities()
const LINKS = loadLinks()
const INDEX = entityIndex()

/** `타입/주소이름` → 객체. 644장 × 644개를 매번 훑지 않는다 */
const BY_SLUG = new Map(ENTITIES.map((e) => [`${e.type}/${entitySlug(e.name)}`, e]))

/**
 * attrs는 자유 필드고 키가 영문이다. **화면에는 원시 키를 절대 내지 않는다**
 * (DESIGN P8 — rel 라벨과 같은 규율). 사전에 없는 키는 조용히 뺀다.
 */
const ATTR_KO: Record<string, string> = {
  role: '역할',
  region: '지역',
  type: '종류',
  reign: '재위',
  period: '시대',
  origin: '기원',
  relation: '관계',
  year: '연도',
  title: '칭호',
  location: '장소',
  status: '지위',
  modern: '지금 이름',
  participants: '참여',
  age: '나이',
  original: '원어',
  founder: '창건',
  parent: '부모',
  date: '시점',
  ancient: '옛 이름',
  duration: '기간',
  years: '연대',
  empire: '제국',
  death: '사망',
  birth: '출생',
  born: '출생',
  died: '사망',
  birthplace: '출생지',
  language: '언어',
  country: '나라',
  note: '비고',
  achievement: '업적',
  population: '인구',
  description: '설명',
  importance: '중요성',
  author: '지은이',
  creator: '만든 이',
  designer: '설계',
  builder: '건립',
  founded: '건립',
  founding: '건립 시기',
  fall: '멸망',
  completed: '완공',
  members: '구성원',
  leader: '지도자',
  dynasty: '왕조',
  lifespan: '존속',
  occupation: '직업',
  descent: '가계',
  affiliation: '소속',
  successor: '후계',
  work: '저작',
  personality: '성품',
  area: '면적',
  dimensions: '규모',
  current: '현재',
  history: '내력',
  significance: '의의',
  chapters: '장 수',
}

const pad = (n: number) => String(n).padStart(2, '0')


/** 기원전은 음수로 들어 있다 (AGENTS 불변식 3). 화면에는 사람이 읽는 꼴로 낸다 */
const yearText = (n: number) => (n < 0 ? `기원전 ${-n}년` : `${n}년`)

const YEAR_KEYS = new Set(['birth', 'death', 'year', 'founded', 'from_year', 'to_year'])

const attrText = (k: string, v: string | number | string[]): string => {
  if (Array.isArray(v)) return v.map((x) => attrText(k, x)).join(', ')
  // 연도가 숫자로도 문자열로도 들어 있다(`-100`과 `"-100"`이 섞여 있다)
  if (YEAR_KEYS.has(k) && /^-?\d+$/.test(String(v))) return yearText(Number(v))
  return typeof v === 'number' ? String(v) : roleKo(v)
}

export function generateStaticParams() {
  return ENTITIES.map((e) => ({ type: e.type, slug: entitySlug(e.name) }))
}

/** 644장이 같은 탭 제목을 달고 있었다. 이름과 종류를 밖으로 낸다 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}) {
  const { type, slug } = await params
  const e = BY_SLUG.get(`${type}/${decodeURIComponent(slug)}`)
  if (!e) return pageMeta('객체')
  return pageMeta(`${e.name} (${TYPE_KO[e.type] ?? e.type})`, e.desc || undefined)
}

/**
 * 붙여넣는 사람에게 1KB짜리 설명만 주면 쓸모가 없다. 관계까지 한 덩어리로 묶는다.
 *
 * `descs`는 **화면과 같은 것**을 받는다 — 한 줄 소개와 글자까지 같은 서술은 이미
 * 걸러진 상태다. 화면에서만 걸러내면 복사한 덩어리에는 같은 문장이 두 번 들어가고,
 * AI에 물리는 사람이 그 중복을 그대로 먹는다.
 */
function toMarkdown(
  e: Entity,
  nbrs: ReturnType<typeof neighbors>,
  descs: Entity['descs'],
): string {
  const parts = [`# ${e.name} (${TYPE_KO[e.type] ?? e.type})`]
  if (e.desc) parts.push(e.desc)
  if (descs.length)
    parts.push(
      ['## 포인트별 서술', ...descs.map((d) => `- 포인트 ${d.point}: ${d.desc}`)].join('\n'),
    )
  if (nbrs.length)
    parts.push(
      [
        '## 관계',
        ...nbrs.map((n) => `- ${n.label} — ${n.ref.name} (포인트 ${n.point})`),
      ].join('\n'),
    )
  if (e.points.length) parts.push(`## 등장 포인트\n${e.points.join(', ')}`)
  return `${parts.join('\n\n')}\n`
}

export default async function ObjectPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>
}) {
  const { type, slug: raw } = await params
  // 이름이 한글이라 정적 내보내기가 퍼센트 인코딩된 slug를 준다. 되돌려서 찾는다
  const slug = decodeURIComponent(raw)
  const e = BY_SLUG.get(`${type}/${slug}`)
  if (!e) throw new Error(`객체 없음: ${type}/${slug}`)

  const href = `/objects/${type}/${slug}`
  const ko = TYPE_KO[e.type] ?? e.type
  const nbrs = neighbors(e.id, LINKS, INDEX)
  // 자르기 전 전체를 받아 개수를 세고 나서 자른다 — 화면이 자른 사실을 말해야 한다
  const coAll = coOccurring(e, ENTITIES)
  const co = coAll.slice(0, CO_SHOWN)
  // 자기 타입 목록까지가 빵부스러기다. 마지막 한 칸은 자기 이름
  const crumbs = navCrumbs(`/objects/${type}`)
  const attrs = Object.entries(e.attrs).filter(([k]) => ATTR_KO[k])
  const family = familyOf(e.id)
  /*
   * **한 줄 소개와 글자까지 같은 포인트 서술은 안 낸다.** 실측(2026-08-17):
   * 객체 644개 중 618개(96%)에서 `desc`가 `descs` 중 하나와 완전히 같고,
   * **458개는 서술이 그것 하나뿐이라 한 화면에 같은 문장이 두 번 찍혔다.**
   * 폰에서는 두 문단이 한눈에 같이 들어와서 더 눈에 띈다.
   *
   * 지워도 잃는 것이 없다 — 어느 포인트에 나오는지는 바로 아래 「등장 포인트」가
   * 이미 말한다.
   */
  const descs = e.descs.filter((d) => d.desc.trim() !== (e.desc ?? '').trim())
  // 날짜 붙은 관계가 2건 미만이면 `null`이다 — 빈 상자를 내보내지 않는다
  const tl = timelineOf(e.id, LINKS, INDEX)
  const portrait = portraitOf(e.id)
  const years = e.type === 'person' ? lifespanOf(e.id) : null

  return (
    <Shell
      path={href}
      where={`객체 ${e.name}`}
      asideWidth={300}
      /*
        관계망은 날개다 (River 요청, 2026-08-16).

        **관계가 0이면 날개를 아예 안 넘긴다.** 객체 217개(33.7%)가 그렇다. 앞 판은
        그 217장에도 300px 칸을 세우고 동석만 넣었는데, 동석이 본문으로 내려간
        지금은 **빈 칸을 하나 세우는 것**이 된다. `Shell`은 `aside`가 없으면 2단을
        안 만들므로, 그 화면들은 본문 한 칸으로 조용히 넓어진다.

        `.entity-aside`는 CSS가 잡는 손잡이다 — `Shell`이 붙박이·높이·폭을
        **인라인으로** 박아서 좁은 화면에서 그걸 풀려면 이름이 하나 있어야 한다.
      */
      aside={
        nbrs.length ? (
          <Stack className="entity-aside" direction="vertical" gap={4}>
            <EntityGraph e={e} nbrs={nbrs} co={co} />
            <EntityAside nbrs={nbrs} />
          </Stack>
        ) : undefined
      }
    >
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c) => (
          <BreadcrumbItem key={c.href} href={c.href}>
            {c.title}
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem isCurrent>{e.name}</BreadcrumbItem>
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5}>
        <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label={ko} />
          {/* 생몰 연대. 위키데이터가 아는 사람만 뜬다 — 없는 것을 지어내지 않는다 */}
          {years ? (
            <Text size="sm" color="secondary">
              {years}
            </Text>
          ) : null}
        </Stack>
        {/*
          초상. 262명 중 164명에게만 있어서(실측 2026-08-18) 없으면 그냥 안 그린다 —
          자리를 비워두면 화면마다 높이가 달라져 목록처럼 훑을 때 눈이 흔들린다.
        */}
        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="entity-face" src={portrait.file} alt={`${e.name} 초상`} loading="lazy" />
        ) : null}
        <Heading level={1}>{e.name}</Heading>
        {e.desc ? (
          <Text size="lg" color="secondary">
            {e.desc}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1}>
          <CopyPageButton markdown={toMarkdown(e, nbrs, descs)} />
        </Stack>
      </Stack>

      <Divider />

      {descs.length ? (
        <Stack direction="vertical" gap={2} as="section">
          <Heading level={2}>포인트별 서술</Heading>
          {descs.map((d) => (
            <Stack key={d.point} direction="vertical" gap={0.5}>
              <Text size="sm" color="secondary">
                포인트 {pad(d.point)}
              </Text>
              {/* 원문에 마크다운이 없다. `Markdown`을 태우면 없는 문법을 발명하게 된다 */}
              {/*
                **읽기 본문과 같은 크기로 읽힌다.** astryx `Text` 기본은 14px/1.7이고
                읽기 화면의 문단은 16px/1.8이다(`.doc .astryx-markdown-paragraph`).
                같은 책에서 뽑은 같은 한국어 산문인데 두 픽셀 작고 다섯 픽셀 좁게
                조판돼 있었다 — 그 규칙의 근거("14px는 한국어 문서 본문으로 작다")가
                마크다운이라서 성립하는 게 아니다. 클래스만 달고 값은 `globals.css`가
                읽기 문단과 **같은 자리에서** 정한다.
              */}
              <Text className="entity-desc">{d.desc}</Text>
            </Stack>
          ))}
        </Stack>
      ) : null}

      {/*
        **포인트 0은 링크하지 않는다.** 읽기는 01~30만 굽는데 데이터에는 `point: 0`이
        있다 — 기번 본인·흄·볼테르·애덤 스미스와 로마 관직 7종이 책 앞부분(일러두기·
        해제)에서 나온 것이다. 잘못된 값이 아니라 **화면이 없는 진짜 값**이라,
        지우지 않고 링크만 뗀다. 앞 판은 11장이 `/read/point/0` 404로 보냈다.
      */}
      {e.points.length ? (
        <Stack direction="vertical" gap={2} as="section">
          <Heading level={2}>등장 포인트</Heading>
          {/* 여기서 본문으로 되돌아간다. 「이거 어디 나온 얘기야」의 답이다 */}
          <Stack direction="horizontal" gap={2} wrap="wrap">
            {e.points.map((p) => (
              <Text key={p} size="sm">
                {p === 0 ? (
                  '책 앞부분'
                ) : (
                  <a href={`/read/point/${p}`}>포인트 {pad(p)}</a>
                )}
              </Text>
            ))}
          </Stack>
        </Stack>
      ) : null}

      {/*
        「이게 어디 나왔나」 바로 뒤에 「거기 또 누가 있었나」가 온다. 둘 다 **같은
        대목**이라는 한 축이라 붙여 둔다. 날개에서 여기로 내려온 경위는
        `EntityAside.tsx`의 `CoOccurred`에 적었다.
      */}
      <CoOccurred co={co} coTotal={coAll.length} />

      {/*
        관계를 시간 위에 깔아 놓는다. **날개가 아니라 본문인 이유는 폭이다** —
        2,200년을 300픽셀에 눌러 담으면 막대가 전부 한 점으로 뭉친다.
      */}
      {tl ? (
        <Stack direction="vertical" gap={2} as="section">
          <Heading level={2}>관계 연표</Heading>
          <RelationTimeline tl={tl} name={e.name} />
        </Stack>
      ) : null}

      {/* 가문에 속한 사람이면 여기서 가계도로 넘어간다. 동명이인이 갈리는 자리다 */}
      {family ? (
        <Stack direction="vertical" gap={1.5} as="section">
          <Heading level={2}>가계도</Heading>
          <Text color="secondary">
            <a href={`/objects/family/${family.slug}`}>
              {family.title} ({family.people.length}명) 보기
            </a>
          </Text>
        </Stack>
      ) : null}

      {/*
        **속성이 FAQ 뒤에 있었다.** 이 객체에 대해 우리가 아는 사실(재위·지역·출생)이
        사이트 공통 물음 열 줄 아래로 밀려 있었다는 뜻이다. 461px 벽 뒤라 실제로는
        안 읽혔다. 딸린 자료보다 본문이 먼저다 — 읽기 화면이 앞뒤 링크를 딸린 자료
        위로 올린 것과 같은 규칙이다.
      */}
      {attrs.length ? (
        <Stack direction="vertical" gap={2} as="section">
          <Heading level={2}>속성</Heading>
          <MetadataList columns="single">
            {attrs.map(([k, v]) => (
              <MetadataListItem key={k} label={ATTR_KO[k]}>
                {attrText(k, v)}
              </MetadataListItem>
            ))}
          </MetadataList>
        </Stack>
      ) : null}

      <Divider />

      {/*
        **객체 화면에 FAQ가 없었다.** 644장 어디에도 안 떴다 — 「이름 뒤 괄호는 뭔가」·
        「사진이 없는데 자료가 부실한 건가」처럼 **바로 이 화면에서 나오는 물음**들이
        `/faq` 목록에만 있었다(2026-08-18 실측: 이 파일에 `faqFor` 호출 0건).
      */}
      {/*
        **접어 둔다.** 붙일 때 접는 걸 잊었다 — 물음 하나하나는 이미 접혀 있어도
        제목 열 줄이 그대로 서서 **461px 벽**이 됐고, 644장에 똑같은 벽이 하나씩
        붙었다. 가벼운 객체(가비니우스, 본문 961px)에서는 그 벽이 화면의 절반이다.
        읽기 화면이 같은 것을 17px 접힌 줄로 두는 것을 그대로 따른다.

        제목은 `Faq`에 안 맡기고 토글 이름으로 단다 — 안 그러면 「자주 묻는 것」이
        두 번 나온다(읽기 화면이 밟고 적어 둔 함정이다).
      */}
      <Collapsible defaultIsOpen={false} trigger="자주 묻는 것">
        <Faq items={faqFor('/objects')} title={null} />
      </Collapsible>

      {/*
        **저작자를 적어야 하는 그림이 대부분이다.** 퍼블릭 도메인 70장을 빼면 나머지는
        CC 계열이라 표기가 조건이다. 카드(48px)에는 못 적으므로 여기 한 줄로 적는다.
      */}
      {portrait ? (
        <Text size="sm" color="secondary">
          초상: <a href={portrait.source} target="_blank" rel="noreferrer">위키미디어</a>
          {portrait.license ? ` · ${portrait.license}` : ''}
          {portrait.author ? ` · ${portrait.author}` : ''}
        </Text>
      ) : null}

      {/*
        집중해서 읽기에서 나가는 길. **`data-focus`는 화면을 안 가리는 전역 설정이라
        객체 화면에서도 크롬이 통째로 사라진다.** 읽기에서 켜고 본문의 인물 링크를
        누르면 여기로 오는데, 앞 판에는 이 단추도 Esc를 받는 `ReadCards`도 없어서
        **644장 어디에서도 못 빠져나왔다.** River가 읽기 화면에서 짚었던 그 사고가
        (「포커스 모드를 해제할 수가 없다」) 여기 그대로 남아 있었다.

        모드가 꺼져 있으면 아무것도 안 그린다 — 평소 화면에는 없는 것과 같다.
      */}
      <FocusExit />
    </Shell>
  )
}
