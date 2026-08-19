import { Stack, Heading, Text, Divider, Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { FamilyTree } from '../../../../components/FamilyTree'
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { FocusExit } from '../../../../components/FocusExit'
import { families, familyBySlug } from '../../../../lib/family/build'
import { entityHref } from '../../../../lib/entity'
import { loadEntities } from '../../../../lib/ontology'
import { pageMeta } from '../../../../lib/meta'

const ENTITIES = loadEntities()
const BY_ID = new Map(ENTITIES.map((e) => [e.id, e]))

export function generateStaticParams() {
  return families().map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const f = familyBySlug((await params).slug)
  return pageMeta(f ? `${f.title} 가계도` : '가계도')
}

export default async function FamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug)
  const f = familyBySlug(slug)
  if (!f) throw new Error(`가문 없음: ${slug}`)

  const md = [
    `# ${f.title} (${f.people.length}명)`,
    f.people.map((p) => `- ${p.label}${p.note ? ` (${p.note})` : ''}`).join('\n'),
  ].join('\n\n')

  return (
    <Shell path={`/objects/family/${slug}`} where={`가계도 ${f.title}`} maxWidth={1100}>
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        <BreadcrumbItem href="/objects">찾아보기</BreadcrumbItem>
        <BreadcrumbItem href="/objects/family">가계도</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{f.title}</BreadcrumbItem>
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>{f.title}</Heading>
        <Text size="lg" color="secondary">
          {f.people.length}명 · 관계 {f.links.length}건
        </Text>
        <Stack direction="horizontal" gap={1}>
          <CopyPageButton markdown={`${md}\n`} />
        </Stack>
      </Stack>

      <Divider />

      <FamilyTree family={f} />

      <Stack direction="vertical" gap={2} as="section">
        <Heading level={2}>이 가문의 사람들</Heading>
        <Stack direction="horizontal" gap={2} wrap="wrap">
          {f.people.map((p) => {
            const e = BY_ID.get(p.id)
            return (
              <Text key={p.id} size="sm">
                {e ? (
                  <a href={entityHref({ id: e.id, type: e.type, name: e.name })}>{p.label}</a>
                ) : (
                  p.label
                )}
              </Text>
            )
          })}
        </Stack>
      </Stack>

      {/* 집중해서 읽기에서 나가는 길. 사연은 `app/objects/[type]/[slug]/page.tsx`에 적었다 */}
      <FocusExit />
    </Shell>
  )
}
