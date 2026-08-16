import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { EntityAside, EntityGraph } from '../../../../components/EntityAside'
import { loadEntities, loadLinks, type Entity } from '../../../../lib/ontology'
import { entityIndex, entitySlug, neighbors, coOccurring } from '../../../../lib/entity'
import { TYPE_KO } from '../../../../lib/export/table'
import { roleKo } from '../../../../lib/vocab'
import { navCrumbs } from '../../../../lib/nav'
import { familyOf } from '../../../../lib/family/build'

/**
 * 객체 한 장 × 644.
 *
 * 뼈대는 `DocPage`와 **똑같은 순서**다 — 빵부스러기 → 배지·제목 → 한 줄 소개 →
 * 페이지 복사 → 본문 → 우측 날개. 화면마다 이 순서가 같은 것이 「퀄리티」의 정체다.
 *
 * 본문은 셋뿐이다. 포인트별 서술 · 등장 포인트 · 속성. 관계는 전부 우측 날개로
 * 보낸다 — 본문은 "이게 무엇인가", 날개는 "무엇과 이어져 있나"다.
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

/** 붙여넣는 사람에게 1KB짜리 설명만 주면 쓸모가 없다. 관계까지 한 덩어리로 묶는다 */
function toMarkdown(e: Entity, nbrs: ReturnType<typeof neighbors>): string {
  const parts = [`# ${e.name} (${TYPE_KO[e.type] ?? e.type})`]
  if (e.desc) parts.push(e.desc)
  if (e.descs.length)
    parts.push(
      ['## 포인트별 서술', ...e.descs.map((d) => `- 포인트 ${d.point}: ${d.desc}`)].join('\n'),
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
  const co = coOccurring(e, ENTITIES, 12)
  // 자기 타입 목록까지가 빵부스러기다. 마지막 한 칸은 자기 이름
  const crumbs = navCrumbs(`/objects/${type}`)
  const attrs = Object.entries(e.attrs).filter(([k]) => ATTR_KO[k])
  const family = familyOf(e.id)

  return (
    <Shell path={href} where={`객체 ${e.name}`} aside={<EntityAside nbrs={nbrs} co={co} />}>
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
        <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label={ko} />
        </Stack>
        <Heading level={1}>{e.name}</Heading>
        {e.desc ? (
          <Text size="lg" color="secondary">
            {e.desc}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1}>
          <CopyPageButton markdown={toMarkdown(e, nbrs)} />
        </Stack>
      </Stack>

      <Divider />

      {e.descs.length ? (
        <Stack direction="vertical" gap={2} as="section">
          <Heading level={2}>포인트별 서술</Heading>
          {e.descs.map((d) => (
            <Stack key={d.point} direction="vertical" gap={0.5}>
              <Text size="sm" color="secondary">
                포인트 {pad(d.point)}
              </Text>
              {/* 원문에 마크다운이 없다. `Markdown`을 태우면 없는 문법을 발명하게 된다 */}
              <Text>{d.desc}</Text>
            </Stack>
          ))}
        </Stack>
      ) : null}

      {e.points.length ? (
        <Stack direction="vertical" gap={2} as="section">
          <Heading level={2}>등장 포인트</Heading>
          {/* 여기서 본문으로 되돌아간다. 「이거 어디 나온 얘기야」의 답이다 */}
          <Stack direction="horizontal" gap={2} wrap="wrap">
            {e.points.map((p) => (
              <Text key={p} size="sm">
                <a href={`/read/point/${p}`}>포인트 {pad(p)}</a>
              </Text>
            ))}
          </Stack>
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

      <EntityGraph e={e} nbrs={nbrs} co={co} />

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
    </Shell>
  )
}
