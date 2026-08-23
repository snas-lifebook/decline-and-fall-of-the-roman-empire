import { Stack, Grid, Text, Link, ClickableCard, Markdown } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../components/DocShell'
import { FlipNumber } from '../../components/FlipNumber'
import { loadDoc, docSections } from '../../lib/doc'
import { typeCounts } from '../../lib/nav'
import { TYPE_KO } from '../../lib/export/table'
import { dataCounts } from '../../lib/datashape'
import { loadLinks } from '../../lib/ontology'
import { book } from '../../lib/book'
import { families } from '../../lib/family/build'
import { pageMeta } from '../../lib/meta'

/**
 * 이 자료실은 — 기업 제품소개 About처럼(#10, River 「고예산 About 느낌」).
 *
 * **앞 판은 `content/about.md`를 통째로 `DocPage`가 그렸다.** 내용·구성은 좋았지만
 * (볼트 롤모델_리서치: "문제는 자리, 푸터로만 도달") 「무엇이 들어 있나」가 마크다운
 * 표 한 장이라 「다루는 것」이 눈에 안 들어왔다. River가 짚은 것이 그것 — 무엇을
 * 다루는지 직관·시각적으로.
 *
 * **그래서 이 한 절만 화면으로 바꾼다.** 타입 일곱을 누를 수 있는 타일 격자로 세워
 * 「인물 262」가 자랑이 아니라 그 목록으로 가는 이정표가 되게 한다(Datasette·OWID
 * 문형, 헌장 0절). 나머지 산문은 마크다운 그대로다 — 특히 「아직 안 된 것」은 볼트
 * 리서치가 "무너뜨리지 말 것"으로 못박은 자산이라 한 글자도 손대지 않는다.
 *
 * `/download`·`/use/data`가 쓰는 것과 같은 방식(`DocShell`에 마크다운 절과 커스텀
 * 절을 섞는다). 숫자는 전부 빌드 때 자료를 세서 나온 값이라(`typeCounts`·`dataCounts`),
 * 사이드바 개수와 어긋나지 않는다.
 */
export const metadata = pageMeta('이 자료실은')

const doc = loadDoc('/about')
const { intro, sections: mdSections } = docSections(doc.body)
const byTitle = new Map(mdSections.map((s) => [s.title, s]))

/** 마크다운 절 하나를 그대로. 없으면 빈 절이 아니라 빠뜨림을 빌드 때 알게 던진다 */
function mdSection(id: string, title: string): DocSection {
  const s = byTitle.get(title)
  if (!s) throw new Error(`about.md에 「${title}」 절이 없습니다`)
  return { id, title: s.title, body: <Markdown>{s.md}</Markdown> }
}

const types = typeCounts().sort((a, b) => b.count - a.count)
const dc = dataCounts()
const points = book().parts.filter((p) => p.n).length
const relKinds = new Set(loadLinks().map((l) => l.rel)).size
const fam = families().length

function covers(): DocSection {
  return {
    id: 'covers',
    title: '다루는 것',
    body: (
      <Stack direction="vertical" gap={4}>
        <Text color="secondary">
          지금 이 자료실에 들어 있는 것들이에요. 숫자는 손으로 적은 값이 아니라 지금 자료를 센
          값이라, 자료가 늘면 이 화면도 같이 늘어요.
        </Text>
        {/* 타입 일곱을 누를 수 있는 타일로 — 개수는 자랑이 아니라 그 목록으로 가는 이정표 */}
        <Grid columns={{ minWidth: 180 }} gap={3}>
          {types.map(({ type, count }) => (
            <ClickableCard key={type} href={`/objects/${type}`} label={TYPE_KO[type]} padding={4}>
              <Stack direction="vertical" gap={0.5}>
                {/* 큰 숫자 한 벌 — 기업 About의 스탯 타일. h3로 재면 목차가 흔들려 span으로 */}
                <span className="about-stat-num">
                  <FlipNumber n={count} />
                </span>
                <Text size="sm" color="secondary">
                  {TYPE_KO[type]}
                </Text>
              </Stack>
            </ClickableCard>
          ))}
        </Grid>
        <Text color="secondary">
          이 인물·지명·사건{' '}
          <Link href="/objects">
            <FlipNumber n={dc.entities} />개
          </Link>
          가 서로 맺은 관계가{' '}
          <Link href="/use/data">
            <FlipNumber n={dc.links} />건
          </Link>
          , 종류는 {relKinds}가지예요. 관계에는 전부 포인트 번호가 붙어 있어서 &ldquo;그거 어디
          나온 얘기야&rdquo;에 답할 수 있어요. 읽을거리는 편역본{' '}
          <Link href="/read">
            <FlipNumber n={points} />포인트
          </Link>
          와 기번 원전{' '}
          <Link href="/read">
            <FlipNumber n={dc.source} />장
          </Link>
          이고, 인물 관계는{' '}
          <Link href="/objects/family">
            <FlipNumber n={fam} />가문
          </Link>
          의 가계도로도 볼 수 있어요.
        </Text>
      </Stack>
    ),
  }
}

/** 누가 굴리나 (#10, 실명 없이). 접근 사실은 위 「어떻게 만들어지나」에 있으니 겹치지 않는다 */
function who(): DocSection {
  return {
    id: 'who',
    title: '누가 굴리나',
    body: (
      <Stack direction="vertical" gap={2}>
        <Text>
          편데 운영팀 한 사람이 AI 에이전트와 같이 만들고 있어요. 회사가 만든 제품이 아니라
          독서 모임이 쓰려고 만든 도구예요.
        </Text>
        <Text color="secondary">
          그래서 서버도 로그인도 없고, 위에 적은 것처럼 주소를 아는 사람만 조용히 봅니다. 발표
          화면에 띄우는 물건이 아니라 준비하면서 옆에 켜두는 물건이에요.
        </Text>
      </Stack>
    ),
  }
}

function sections(): DocSection[] {
  return [
    covers(),
    mdSection('use', '무엇을 할 수 있나'),
    mdSection('how', '어떻게 만들어지나'),
    mdSection('todo', '아직 안 된 것'),
    who(),
    mdSection('feedback', '틀린 것을 발견하시면'),
    mdSection('credits', '출처와 저작권'),
  ]
}

export default function About() {
  return (
    <DocShell
      href="/about"
      title="이 자료실은"
      summary={doc.summary}
      intro={<Markdown>{intro}</Markdown>}
      sections={sections()}
    />
  )
}
