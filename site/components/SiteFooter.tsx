import { Stack, Text, Divider } from '@astryxdesign/core'
import { FeedbackBox } from './FeedbackBox'
import { dataDate } from '../lib/datadate'
import { siteUpdated, changelog } from '../lib/changelog'
import { linkById } from '../lib/links'

/**
 * 화면 맨 아래 — 이게 무엇이고, 언제 것이고, 어디서 왔나.
 *
 * 앞 판은 「데이터 기준일」 한 줄과 「한 줄 남기기」뿐이었다. 처음 들어온 사람이
 * **누가 만든 무엇인지, 지금 보는 게 언제 것인지**를 알 자리가 없었다.
 *
 * 날짜를 **둘 다** 적는 것이 요점이다. 자료가 바뀐 날과 화면이 바뀐 날은 서로
 * 다르고, 둘을 하나로 합치면 "어제 갱신"이라 적혀 있는데 인물 데이터는 두 주
 * 전 것인 상황이 생긴다. 둘 다 커밋 기록에서 읽어 오므로 손으로 고칠 일이 없다.
 *
 * 검색에 안 걸린다는 것도 적는다 — 암호 없이 열리는 주소라(헌장 경계 3) 링크를
 * 받은 사람이 「이거 아무나 보는 거 아닌가」를 먼저 궁금해한다.
 */
export function SiteFooter({ where }: { where: string }) {
  const updated = siteUpdated()
  const repo = linkById('repo')

  return (
    <Stack direction="vertical" gap={3} as="footer">
      <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
        <Text size="sm" weight="semibold">
          산스 인생책 편데
        </Text>
        <Text size="sm" color="secondary">
          기번 『로마제국쇠망사』 편역본과 인물·관계 자료를 발표와 토론에 쓰려고 모아둔 곳입니다.
        </Text>
      </Stack>

      <Divider />

      <Stack direction="horizontal" gap={4} wrap="wrap">
        <Text size="sm" color="secondary">
          자료 기준일 <strong>{dataDate()}</strong>
        </Text>
        {updated ? (
          <Text size="sm" color="secondary">
            화면 갱신 <strong>{updated}</strong> · <a href="/changelog">바뀐 것 {changelog().length}건</a>
          </Text>
        ) : null}
        <Text size="sm" color="secondary">
          자료 원본{' '}
          <a href={repo.href} target="_blank" rel="noreferrer">
            깃허브
          </a>
        </Text>
        <Text size="sm" color="secondary">
          <a href="/about">이 자료실은</a>
        </Text>
      </Stack>

      <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
        <FeedbackBox where={where} />
        {/* 링크를 받은 사람이 제일 먼저 궁금해하는 것이다 */}
        <Text size="sm" color="secondary">
          암호 없이 열리지만 검색에는 안 걸립니다.
        </Text>
      </Stack>
    </Stack>
  )
}
