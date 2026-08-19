import { Markdown } from '@astryxdesign/core'
import { DocShell } from './DocShell'
import { loadDoc, docSections } from '../lib/doc'

/**
 * `content/**` 마크다운 한 장을 문서 뼈대에 얹는다.
 *
 * **뼈대는 여기 없다 — `DocShell`에 있다.** 이 파일이 하는 일은 마크다운을 읽어
 * 절로 자르는 것뿐이다. 둘을 가른 이유는 `DocShell` 주석에 적어뒀다: 뼈대가 이
 * 로더에 붙어 있는 동안 본문이 TSX인 화면은 뼈대를 쓸 방법이 아예 없었다.
 *
 * 본문은 `content/**\/*.md`가 정본이고 여기는 조립만 한다. 우측 목차와 본문 제목이
 * `docSections()` 하나에서 나오므로 둘이 어긋날 수 없다.
 */
export function DocPage({ href }: { href: string }) {
  const doc = loadDoc(href)
  const { intro, sections } = docSections(doc.body)

  // 붙여넣는 사람은 이게 무슨 문서인지부터 알아야 한다. 제목과 부제를 같이 싣는다
  const markdown = `# ${doc.title}\n\n${doc.summary}\n\n${doc.body}\n`

  return (
    <DocShell
      href={href}
      title={doc.title}
      summary={doc.summary}
      copyMarkdown={markdown}
      intro={intro ? <Markdown>{intro}</Markdown> : undefined}
      sections={sections.map((s) => ({
        id: s.id,
        title: s.title,
        body: <Markdown>{s.md}</Markdown>,
      }))}
    />
  )
}
