import { Markdown, List, ListItem } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../components/DocShell'
import { dataShapeSections } from '../../components/DataShape'
import { loadDoc, docSections } from '../../lib/doc'
import { loadEntities } from '../../lib/ontology'
import { pointList } from '../../lib/points'
import { pageMeta } from '../../lib/meta'

/**
 * 가져가기 — 발표 준비자가 포인트 하나를 표로 뽑아 가는 화면.
 *
 * **형제 넷(읽기·찾아보기·활용하기·시작하기)보다 본문이 길다 — 의도된 예외다.**
 * 실측(2026-08-19)에서 이 화면이 형제 평균의 여러 배였고, 볼트 `PLAN.md`의
 * 「섹션 랜딩은 목록이지 설명 페이지가 아니다」를 어기고 있었다. 설명을 자식
 * 페이지로 내리는 안도 검토했지만, 여기서는 반대 논리가 이긴다 — **무엇을
 * 받을지 고르기 전에 자료가 어떻게 생겼는지 알아야 한다**(헌장 0-1 「헷갈림을
 * 덜어주는 만큼만」). 클릭을 하나 더 시켜 그 정보를 감추면 오히려 헷갈림이 는다.
 * 자식 페이지를 만들어도 `lib/nav.ts`가 이번 작업 범위 밖이라 사이드바에 걸
 * 방법이 없다는 것도 이유다 — 가져가기만 사이드바에 자식이 없는 비대칭은
 * 이번에 못 고쳤다.
 *
 * 대신 길이는 줄였다 — 「무엇을 고르시겠어요」 절을 지웠다(`content/download.md`).
 * `DocShell`의 「다음 단계」가 같은 안내(활용하기로 이어짐)를 이미 자동으로 낸다.
 *
 * **표는 포인트마다 따로 굽는다.** 30포인트를 한 화면에 담으면 브라우저로 가는
 * 데이터가 수백 KB가 된다. 여기는 제목과 객체 수만 놓고 고르게 한다 — 그래서
 * 포인트 목록은 `sections` 배열의 마지막 항목으로 붙는다.
 */

// 모듈 수준에서 한 번만. 빌드 때 한 번 읽고 끝난다
const doc = loadDoc('/download')
const { intro, sections: mdSections } = docSections(doc.body)
const entities = loadEntities()

const points = pointList().map((p) => ({
  ...p,
  count: entities.filter((e) => e.points.includes(p.n)).length,
}))

const two = (n: number) => String(n).padStart(2, '0')

export const metadata = pageMeta('가져가기')

function sections(): DocSection[] {
  return [
    // 「자료가 어떻게 생겼나」·「관계 한 건은 이렇게 생겼습니다」. `/use/data`와
    // 같은 것을 쓴다 — 한쪽만 고치면 두 화면의 숫자가 어긋난다
    ...dataShapeSections(),
    ...mdSections.map((s) => ({ id: s.id, title: s.title, body: <Markdown>{s.md}</Markdown> })),
    {
      id: 'points',
      title: '포인트별 표',
      body: (
        // 카드 격자였을 때 스크롤이 세 배 길었다. 고르기만 하는 목록에 카드는 과하다
        <List density="spacious" hasDividers>
          {points.map((p) => (
            <ListItem
              key={p.n}
              label={`${two(p.n)} ${p.title}`}
              description={`객체 ${p.count}개`}
              href={`/download/${p.n}`}
            />
          ))}
        </List>
      ),
    },
  ]
}

export default function DownloadIndex() {
  // 붙여넣는 사람은 이게 무슨 문서인지부터 알아야 한다. 제목과 부제를 같이 싣는다
  const copyMarkdown = `# ${doc.title}\n\n${doc.summary}\n\n${doc.body}\n`

  return (
    <DocShell
      href="/download"
      title={doc.title}
      summary={doc.summary}
      sections={sections()}
      intro={intro ? <Markdown>{intro}</Markdown> : undefined}
      copyMarkdown={copyMarkdown}
    />
  )
}
