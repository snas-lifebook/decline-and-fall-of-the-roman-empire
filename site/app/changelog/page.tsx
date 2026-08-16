import { Stack, Heading, Text, Divider, Badge, Banner } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { changesByDate, changelog } from '../../lib/changelog'
import { linkById } from '../../lib/links'

/**
 * 바뀐 것 — 이 사이트가 언제 무엇이 달라졌나.
 *
 * **손으로 적은 목록이 아니다.** 커밋 기록을 빌드 때 읽어 온다. 별도 파일을
 * 두면 고치는 걸 잊는 순간 거짓말이 되고, 결국 아무도 안 믿는 문서가 된다.
 *
 * 읽는 사람은 개발자가 아니라 편데 팀원이다. 그래서 커밋 앞머리(`feat:`)를
 * 한국어로 바꾸고, 해시는 눌러서 실제 변경을 볼 수 있는 자리로만 남긴다.
 */
export default function Changelog() {
  const groups = changesByDate()
  const repo = linkById('repo')

  return (
    <Shell path="/changelog" where="바뀐 것">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>바뀐 것</Heading>
        <Text size="lg" color="secondary">
          이 사이트가 언제 무엇이 달라졌는지입니다. 자료 자체가 바뀐 날짜는 화면 아래 「데이터
          기준일」에 있습니다.
        </Text>
      </Stack>

      <Divider />

      {groups.length === 0 ? (
        <Banner
          status="info"
          title="기록을 못 읽었습니다"
          description="이 목록은 빌드할 때 커밋 기록에서 만듭니다. 지금 화면에서는 그걸 읽지 못했습니다."
        />
      ) : (
        <>
          <Text color="secondary">
            모두 {changelog().length}번 고쳤습니다. 처음 올린 날은{' '}
            {groups[groups.length - 1].date}입니다.
          </Text>

          {groups.map(({ date, items }) => (
            <Stack key={date} direction="vertical" gap={2} as="section">
              <Heading level={2}>{date}</Heading>
              <Stack direction="vertical" gap={2}>
                {items.map((c) => (
                  <Stack key={c.hash} direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                    <Badge variant="neutral" label={c.kind} />
                    <Text>{c.title}</Text>
                    {/* 해시는 실제로 무엇이 바뀌었는지 보러 가는 자리다 */}
                    <Text size="sm" color="secondary">
                      <a href={`${repo.href}/commit/${c.hash}`} target="_blank" rel="noreferrer">
                        {c.hash}
                      </a>
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          ))}
        </>
      )}
    </Shell>
  )
}
