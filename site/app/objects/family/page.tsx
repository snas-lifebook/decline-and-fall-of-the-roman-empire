import { Stack, Heading, Text, Divider, List, ListItem } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { FamilyGap } from '../../../components/FamilyTree'
import { families } from '../../../lib/family/build'

/** 가문 목록. 개수를 라벨에 적는다 — "눌러도 되나"를 없앤다 (RESEARCH R-E) */
export default function FamilyIndex() {
  const all = families()
  return (
    <Shell path="/objects/family" where="가계도">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>가계도</Heading>
        <Text size="lg" color="secondary">
          누가 누구의 아버지고 누가 뒤를 이었는지 한 장에 폅니다. 같은 이름이 여럿일 때 여기서
          갈립니다.
        </Text>
      </Stack>

      <Divider />

      <List listStyle="none" density="spacious" hasDividers>
        {all.map((f) => (
          <ListItem
            key={f.slug}
            label={`${f.title} · ${f.people.length}명`}
            description={f.people
              .slice(0, 5)
              .map((p) => p.label)
              .join(' · ')}
            href={`/objects/family/${f.slug}`}
          />
        ))}
      </List>

      <FamilyGap />
    </Shell>
  )
}
