import { notFound } from 'next/navigation'
import {
  Stack,
  Heading,
  Text,
  Divider,
  Button,
  List,
  ListItem,
  Breadcrumbs,
  BreadcrumbItem,
} from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { BookCover } from '../../../components/BookCover'
import { books, bookById, bookHref, type Book, type BookPart } from '../../../lib/book'
import { pointLead } from '../../../lib/text/point'
import { pageMeta } from '../../../lib/meta'

/**
 * 책 한 권의 문패 — **이게 무슨 책이고, 어디로 들어가나.**
 *
 * River: 「그 책을 눌러 들어갔을 때는 책과 저자에 대한 소개페이지가 있고, 바로 쉽게
 * 각 목차별로 들어갈 수 있게 해주시오」. 그래서 위는 소개, 아래는 통째로 차례다.
 *
 * **저자 소개를 여기서 길게 쓰지 않는다.** 이 책에 이미 있다 — 「책머리에」가 기번이
 * 어떤 사람이었는지를 5,000자로 쓴 글이고, 그게 곧 이 책의 저자 소개다. 여기서는
 * 세 문장으로 줄이고 그리로 보낸다. 같은 말을 두 군데 적으면 한쪽이 낡는다.
 *
 * **쪽수는 차례에서 읽어 온다**(`lib/book.ts`). 종이책을 펴 놓고 같은 자리를 찾는
 * 사람이 있고, 그 숫자를 화면에 손으로 옮겨 적으면 언젠가 어긋난다.
 */

export function generateStaticParams() {
  return books().map((b) => ({ id: b.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const b = bookById((await params).id)
  return b ? pageMeta(b.title, b.blurb) : pageMeta('읽기')
}

/** 차례 한 묶음. 세 덩어리가 같은 모양이라 한 번만 적는다 */
function Contents({ parts, lang }: { parts: BookPart[]; lang?: Book['lang'] }) {
  return (
    <List density="spacious" hasDividers>
      {parts.map((p) => (
        <ListItem
          key={p.href}
          href={p.href}
          /*
            번호는 **본문 30편에만** 붙는다. 여는 글과 닫는 글에 01을 붙이면 32편짜리
            책이 되어 버린다 — 번호가 있고 없는 것이 곧 본문과 그 밖을 가른다.
          */
          startContent={
            p.n ? (
              <span className="toc-n">{String(p.n).padStart(2, '0')}</span>
            ) : (
              <span className="toc-n toc-n-none" />
            )
          }
          label={lang ? <span lang={lang}>{p.title}</span> : p.title}
          /*
            **부제는 편역본에만 있다.** `p.n`으로 가르면 원전 31장이 자기 부제를
            `points/31_.md`에서 찾다가 빌드를 죽인다(실제로 죽였다) — 두 책이 번호를
            따로 쓰는데 번호만 보고 같은 서랍을 연 것이다. 종류로 가른다.
          */
          description={p.kind === 'point' ? pointLead(p.n!) || undefined : undefined}
          // 종이책 쪽수. 책을 펴 놓고 같은 자리를 찾을 수 있다
          endContent={
            p.page ? (
              <Text size="sm" color="secondary">
                {p.page}
              </Text>
            ) : undefined
          }
        />
      ))}
    </List>
  )
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const b = bookById((await params).id)
  if (!b) notFound()

  const front = b.parts.filter((p) => p.kind === 'front')
  const main = b.parts.filter((p) => p.kind === 'point' || p.kind === 'chapter')
  const back = b.parts.filter((p) => p.kind === 'back')
  const gibbon = b.id === 'gibbon'

  return (
    <Shell path={bookHref(b)} where={`읽기 ${b.title}`} maxWidth={880}>
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        <BreadcrumbItem href="/read">읽기</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{b.short}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="book-head">
        <BookCover book={b} size="lg" />
        <Stack direction="vertical" gap={2} hAlign="start">
          <Heading level={1}>{b.title}</Heading>
          {/* 원저를 같이 적는다 — 이 책이 무엇을 줄인 것인지가 제목만으로는 안 보인다 */}
          <Text size="sm" color="secondary">
            {b.original}
          </Text>
          <Text color="secondary">
            {b.by.map((x) => `${x.name} ${x.role}`).join(' · ')}
            {' · '}
            {b.publisher}
          </Text>
          <Text>{b.about}</Text>
          <Stack direction="horizontal" gap={2} wrap="wrap">
            <Button
              href={b.parts[0].href}
              variant="primary"
              size="sm"
              label="처음부터 읽기"
            />
            <Button href="/read/point/1" variant="secondary" size="sm" label="본문 01부터" />
          </Stack>
        </Stack>
      </div>

      <Divider />

      <Stack direction="vertical" gap={2}>
        <Heading level={2}>지은이</Heading>
        <Text>
          에드워드 기번은 1737년 런던 근교에서 태어나 병으로 학교를 거듭 그만두고 독서로
          자랐습니다. 열여섯에 가톨릭으로 개종했다가 아버지 손에 스위스 로잔으로 보내졌고,
          거기서 받은 고전 교육이 뒤에 스무 해에 걸친 여섯 권으로 돌아옵니다. 이 편역본이
          줄인 것이 그 여섯 권입니다.
        </Text>
        <Text color="secondary">
          <a href={b.parts.find((p) => p.title === '책머리에')?.href ?? '/read'}>
            책머리에서 기번의 생애를 자세히 읽습니다 →
          </a>
        </Text>
      </Stack>

      <Divider />

      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Heading level={2}>차례</Heading>
          {gibbon ? (
            <Text size="sm" color="secondary">
              한 장이 평균 12만 자입니다. 장 안에서는 오른쪽 목차의 부(Part)로 이동하시면
              됩니다.
            </Text>
          ) : (
            <Text size="sm" color="secondary">
              오른쪽 숫자는 종이책 쪽수입니다. 책을 펴 놓고 같은 자리를 찾을 수 있습니다.
            </Text>
          )}
        </Stack>

        <Stack direction="vertical" gap={2}>
          <Heading level={3}>여는 글</Heading>
          <Contents parts={front} lang={b.lang} />
        </Stack>

        <Stack direction="vertical" gap={2}>
          <Heading level={3}>
            {gibbon ? `본문 ${main.length}장` : `본문 ${main.length}포인트`}
          </Heading>
          <Contents parts={main} lang={b.lang} />
        </Stack>

        {back.length ? (
          <Stack direction="vertical" gap={2}>
            <Heading level={3}>닫는 글</Heading>
            <Contents parts={back} lang={b.lang} />
          </Stack>
        ) : null}
      </Stack>
    </Shell>
  )
}
