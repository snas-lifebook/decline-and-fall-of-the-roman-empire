import { Stack, Heading, Text, Divider, Badge, Banner, Collapsible } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { changesByDate, changelog } from '../../lib/changelog'
import { UPDATES } from '../../lib/updates'
import { linkById } from '../../lib/links'
import { pageMeta } from '../../lib/meta'

/**
 * 바뀐 것 — learn.chatgpt whats-new 꼴(River #12).
 *
 * **다이제스트가 위, 커밋 원본이 아래.** 앞 판은 커밋을 날짜별로 그대로 쏟아냈는데
 * (「fix: 사이드바 회귀」…), 그건 정확하지만 편데 팀원에게는 안 읽힌다. 그래서 위에는
 * 사람이 골라 사람 말로 적은 다이제스트(`lib/updates.ts`)를 얹고, 커밋 전체는 「전체
 * 기록」으로 접는다 — 근거는 남기되 주역은 다이제스트다.
 */
export const metadata = pageMeta('바뀐 것')

export default function Changelog() {
  const groups = changesByDate()
  const repo = linkById('repo')

  return (
    <Shell path="/changelog" where="바뀐 것">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>바뀐 것</Heading>
        <Text size="lg" color="secondary">
          이 사이트가 언제 무엇이 좋아졌는지입니다. 자료 자체가 바뀐 날짜는 화면 아래 「자료
          기준일」에 있습니다.
        </Text>
      </Stack>

      <Divider />

      {/* 다이제스트. 날짜 칸 + 내용 — learn.chatgpt whats-new의 타임라인 꼴 */}
      <div className="update-list">
        {UPDATES.map((u) => (
          <div className="update-entry" key={`${u.date}-${u.title}`}>
            <Text size="sm" color="secondary">
              {u.date}
            </Text>
            <Stack direction="vertical" gap={1}>
              <Text weight="semibold">{u.title}</Text>
              <Text color="secondary">{u.body}</Text>
            </Stack>
          </div>
        ))}
      </div>

      <Divider />

      {/* 전체 기록 — 커밋 원본. 접어 둔다 */}
      {groups.length === 0 ? (
        <Banner
          status="info"
          title="기록을 못 읽었습니다"
          description="이 목록은 빌드할 때 커밋 기록에서 만듭니다. 지금 화면에서는 그걸 읽지 못했습니다."
        />
      ) : (
        <Collapsible defaultIsOpen={false} trigger={`전체 기록 (커밋 ${changelog().length}개)`}>
          <Stack direction="vertical" gap={4}>
            <Text size="sm" color="secondary">
              위 다이제스트에 안 담은 정리·수정까지 전부입니다. 처음 올린 날은{' '}
              {groups[groups.length - 1].date}입니다.
            </Text>
            {groups.map(({ date, items }) => (
              <Stack key={date} direction="vertical" gap={1.5}>
                <Text weight="semibold">{date}</Text>
                <Stack direction="vertical" gap={1.5}>
                  {items.map((c) => (
                    <Stack key={c.hash} direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                      <Badge variant="neutral" label={c.kind} />
                      <Text size="sm">{c.title}</Text>
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
          </Stack>
        </Collapsible>
      )}
    </Shell>
  )
}
