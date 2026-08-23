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
 * **받는 단위 셋으로 쪼갰다**(River #6, 2026-08-20). 앞 판은 「통째로 가져가는
 * 세 가지 방법」 한 절에 ZIP·깃·데이터폴더를 섞어 놓고 그 아래 포인트 목록을
 * 붙였는데, 그러면 `lib/nav.ts`에 걸 자식이 없어 **푸터 「가져가기」 칸이 통째로
 * 비었다**(River 스크린샷). 이제 사람이 받아 가는 실제 단위대로 나눈다 —
 * `bundle`(전체 한 묶음)·`data`(인물·관계 데이터만)·`points`(포인트별 표). 이 셋이
 * 곧 nav의 자식이라 사이드바·푸터에 그대로 걸린다(가져가기만 자식이 없던 비대칭 해소).
 *
 * 절 `id`는 **손으로 박는다** — `docSections`가 주는 `sec-1`은 순서가 곧 이름이라
 * nav 앵커(`/download#bundle`)로 쓰면 md 순서가 바뀔 때 조용히 깨진다.
 *
 * **표는 포인트마다 따로 굽는다.** 30포인트를 한 화면에 담으면 브라우저로 가는
 * 데이터가 수백 KB가 된다. 여기는 제목과 객체 수만 놓고 고르게 한다.
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

// md의 두 H2 = 받는 단위 둘(전체 한 묶음, 인물·관계 데이터만). 순서가 곧 이 매핑이다
const [bundleMd, dataMd] = mdSections

function sections(): DocSection[] {
  return [
    { id: 'bundle', title: bundleMd.title, body: <Markdown>{bundleMd.md}</Markdown> },
    { id: 'data', title: dataMd.title, body: <Markdown>{dataMd.md}</Markdown> },
    {
      id: 'points',
      title: '포인트별 표',
      body: (
        <>
          <Markdown>{POINTS_INTRO}</Markdown>
          {/* 카드 격자였을 때 스크롤이 세 배 길었다. 고르기만 하는 목록에 카드는 과하다 */}
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
        </>
      ),
    },
    // 「자료가 어떻게 생겼나」·「관계 한 건은 이렇게 생겼습니다」 — 표를 붙여 넣기 전에
    // 열이 뭘 뜻하는지 보는 참고 자료. `/use/data`와 같은 것을 쓴다(숫자 어긋남 방지)
    ...dataShapeSections(),
  ]
}

/** 「포인트별 표」 절의 들머리 — 앞 판은 md의 H2였는데, 이제 표 목록과 한 절로 묶는다 */
const POINTS_INTRO = `포인트를 고르시면 그 포인트에 나오는 인물·지명이 여섯 칸짜리 표로 나옵니다. 열은 **이름 · 종류 · 이 포인트에서 · 별칭 · 관계 · 등장 포인트**입니다. 표 위의 「시트에 붙여넣기용 복사」와 「CSV 내려받기」로 구글시트나 엑셀에 그대로 들어갑니다.`

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
