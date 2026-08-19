import { Stack, Heading, Text, Divider, ClickableCard } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { BookCover } from '../../components/BookCover'
import { books, bookHref, type Book } from '../../lib/book'
import { pageMeta } from '../../lib/meta'

/**
 * 읽기 — **책장이다.**
 *
 * 앞 판은 30개가 평평하게 늘어선 목록이었다. River: 「읽기에는 여러 텍스트를 큰 책
 * 단위로 묶어보자 … 마치 디지털에서 책인것처럼 효과를 줘서 텍스트를 하나로
 * 패키징하자」.
 *
 * 목록이 왜 부족했나 — **그 30개는 흩어진 글이 아니라 한 권의 차례다.** 목록으로
 * 두면 화면이 그 사실을 말하지 않고, 그러면 일러두기·책머리에·옮기고 나서가 갈
 * 자리도 없다(실제로 셋 다 걸려 있지 않았다).
 *
 * **그릇을 만든 값이 바로 돌아왔다.** 두 번째 권을 얹는 데 든 것은 로더 하나뿐이다 —
 * 기번 원전 72편이 `source/`에 이미 있었고, 없던 것은 그것을 책으로 볼 자리였다.
 */

export const metadata = pageMeta('읽기')

/** 무게를 숫자로 말한다. 「오늘 한 편을 읽을 수 있나」에 대한 답이 이것이다 */
function heft(b: Book) {
  const main = b.parts.filter((p) => p.kind === 'point' || p.kind === 'chapter').length
  const unit = b.id === 'gibbon' ? '장' : '편'
  const last = b.parts[b.parts.length - 1]
  const pages = b.id === 'gibbon' ? '' : last.page ? ` · 종이책 ${last.page}쪽` : ''
  return `본문 ${main}${unit} · 앞뒤 글까지 ${b.parts.length}${unit}${pages}`
}

export default function Read() {
  return (
    <Shell path="/read" where="읽기" maxWidth={960}>
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>읽기</Heading>
        <Text size="lg" color="secondary">
          본문을 여기서 그대로 보실 수 있습니다. 내려받으실 것도 로그인하실 것도 없습니다.
        </Text>
      </Stack>

      <Divider />

      {/*
        책 전체가 하나의 누를 것이다. 표지만 누르게 하면 「어디를 눌러야 하나」를
        사람이 재야 한다 — 물건 하나면 과녁도 하나다.

        두 권이 세로로 선다. 격자로 깔지 않는 이유는 **책마다 할 말의 길이가 다르기
        때문**이다 — 칸을 맞추면 짧은 쪽이 텅 비고 긴 쪽이 잘린다.
      */}
      <div className="shelf">
        {books().map((b) => (
          <ClickableCard
            key={b.id}
            href={bookHref(b)}
            label={`${b.title} 펼치기`}
            padding={5}
            variant="transparent"
          >
            <div className="shelf-book">
              <BookCover book={b} size="lg" />
              <Stack direction="vertical" gap={2} hAlign="start">
                <Heading level={2}>
                  {b.lang ? <span lang={b.lang}>{b.title}</span> : b.title}
                </Heading>
                <Text color="secondary">
                  {b.by.map((x) => `${x.name} ${x.role}`).join(' · ')}
                  {' · '}
                  {b.publisher}
                </Text>
                <Text>{b.blurb}</Text>
                <Text size="sm" color="secondary">
                  {heft(b)}
                </Text>
              </Stack>
            </div>
          </ClickableCard>
        ))}
      </div>
    </Shell>
  )
}
