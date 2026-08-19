import { Grid, Stack, Text, Badge, ClickableCard } from '@astryxdesign/core'
import { linkById, linksByCategory, type LinkCategory } from '../lib/links'
import styles from './LinkCards.module.css'

/**
 * 바깥 링크 카드 묶음. **주소는 안 받는다** — `lib/links.ts`의 id만 받는다.
 *
 * `ids`를 주면 준 순서대로, `category`를 주면 그 분류 전부를 그린다. 순서를 손으로
 * 정해야 하는 자리(회차에 딸린 것 먼저)가 있어 둘 다 둔다.
 *
 * 없는 id는 `linkById`가 빌드에서 던진다. 화면에 죽은 링크가 남는 것보다 낫다.
 */
export function LinkCards({ ids, category }: { ids?: string[]; category?: LinkCategory }) {
  const links = ids ? ids.map(linkById) : category ? linksByCategory(category) : []

  return (
    <Grid
      columns={{ minWidth: 280 }}
      gap={3}
      // 컨테이너 쿼리 기준점. `LinkCards.module.css`의 `@container`가 이 이름을 잰다
      style={{ containerType: 'inline-size', containerName: 'link-cards' }}
    >
      {links.map((l, i) => {
        /*
         * 이 그리드는 최대 2열이다(컨테이너 폭·minWidth=280 조합상). 카드가 홀수
         * 개면 마지막 줄에 하나만 남아 1열에 붙고 오른쪽이 통째로 빈다 —
         * "카드가 왼쪽에 몰려 있다"는 지적이 이 자리였다. 실제로 2열이 되는
         * 폭에서만 그 카드를 줄 전체로 펼치고 가운데 둔다.
         *
         * **뷰포트가 아니라 컨테이너 폭을 잰다.** 이 화면은 사이드바를 접고 펼
         * 수 있어(`RailToggle`) 같은 뷰포트에서도 그리드 실제 폭이 바뀐다.
         * `@media`는 뷰포트만 보고 이 변화를 못 본다 — `@container`만 본다.
         */
        const isLoneLastRow = i === links.length - 1 && links.length % 2 === 1
        return (
          // 바깥으로 나가는 링크다. 읽던 자리를 뺏지 않게 새 탭으로 연다
          <ClickableCard
            key={l.id}
            href={l.href}
            target="_blank"
            label={l.title}
            padding={4}
            className={isLoneLastRow ? styles.loneLastRow : undefined}
          >
            <Stack direction="vertical" gap={0.5} hAlign="start">
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                {/*
                 * 아이콘은 있을 때만 그린다. 없는 자리를 빈 칸으로 맞춰 두면 그 칸이
                 * "뭔가 안 뜬 것"처럼 보인다 — 아예 없는 편이 조용하다.
                 *
                 * `alt=""`인 이유: 제목이 바로 옆에 있어 아이콘은 순수한 장식이다.
                 * 읽어 주면 같은 말을 두 번 듣는다.
                 *
                 * `width`/`height`를 박는 이유: 그림이 늦게 와도 줄이 안 밀린다.
                 */}
                {/* eslint-disable-next-line @next/next/no-img-element -- 20px 파비콘이다. next/image의 리사이즈·lazy가 얻을 게 없고, 정적 export라 최적화도 안 돈다 */}
                {l.icon ? <img src={l.icon} alt="" width={20} height={20} /> : null}
                <Text weight="semibold">{l.title}</Text>
                {/* ponytail: 회차 번호는 지금 하나뿐이라 문자열로 박는다. 02회차가 생기면
                    `lib/links.ts`와 여기 한 줄이 같이 바뀐다 */}
                {l.perSession ? <Badge variant="neutral" label="01회차" /> : null}
              </Stack>
              <Text size="sm" color="secondary">
                {l.desc}
              </Text>
            </Stack>
          </ClickableCard>
        )
      })}
    </Grid>
  )
}
