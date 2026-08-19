import {
  Stack,
  Text,
  Heading,
  CodeBlock,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import { repoTree, sampleLink, dataCounts } from '../lib/datashape'
import type { DocSection } from './DocShell'

/**
 * 「자료가 어떻게 생겼나」 — `/download`와 `/use/data`가 **같은 것을 쓴다.**
 *
 * 앞서 두 화면이 각자 적고 있었다. 같은 숫자(644·667)를 두 군데서 관리하면
 * 반드시 어긋난다. 게다가 둘 다 손으로 적은 값이라 데이터가 바뀌면 거짓말이
 * 됐다 — 이제 `lib/datashape.ts`가 **파일을 세어서** 만든다.
 *
 * 형태는 문서 사이트 여섯 곳을 조사해 정했다. 도식을 그리는 대신
 * **개수가 붙은 파일트리**(Astro 방식)와 **진짜 레코드 한 줄**(Stripe 방식)을
 * 쓴다 — 조사한 여섯 곳 중 Stripe와 OpenAI는 도식이 아예 0개인데도
 * 자기 데이터가 무엇인지 완전히 전달한다.
 */

export function RepoTree() {
  return (
    <Stack direction="vertical" gap={0} as="section">
      {repoTree().map((n) => (
        <Stack
          key={n.path}
          direction="horizontal"
          gap={3}
          wrap="wrap"
          vAlign="center"
          paddingBlock={1.5}
          // 하위는 한 단 들여쓴다. `ontology/`의 두 파일이 위 폴더의 다른 모양이라는 것이
          // 들여쓰기로 보인다 — 「두 벌로 들어 있다」를 글로 설명하기 전에 눈에 먼저 들어온다
          style={{ paddingLeft: n.depth * 24 }}
        >
          <Text as="span" weight="semibold">
            <code>{n.path}</code>
          </Text>
          <Text as="span" size="sm" color="secondary">
            {n.label}
          </Text>
          <Text as="span" size="sm">
            {n.count}
          </Text>
        </Stack>
      ))}
    </Stack>
  )
}

/**
 * 관계 한 건이 실제로 어떻게 생겼나.
 *
 * **추상 스키마가 아니라 진짜 값이다.** `ontology/links.jsonl`의 첫 줄을 그대로
 * 읽어 온다. 「필드가 있다」가 아니라 「값이 이렇게 생겼다」를 말하는 것이
 * 이 칸의 전부고, 테스트가 파일 첫 줄과 글자 단위로 대조한다.
 */
export function LinkAnatomy() {
  const { raw, fields } = sampleLink()
  return (
    <Stack direction="vertical" gap={3} as="section">
      <CodeBlock code={raw} title="ontology/links.jsonl 의 첫 줄" />
      <MetadataList columns="single" label={{ position: 'start', width: 104 }}>
        {fields.map((f) => (
          <MetadataListItem key={f.key} label={f.key}>
            <Stack direction="vertical" gap={0.5}>
              <Text as="span" weight="semibold">
                {f.value}
              </Text>
              <Text as="span" size="sm" color="secondary">
                {f.means}
              </Text>
            </Stack>
          </MetadataListItem>
        ))}
      </MetadataList>
    </Stack>
  )
}

/**
 * 두 절을 **데이터로** 낸다. 우측 목차가 이 배열을 먹어야 하기 때문이다.
 *
 * 앞 판은 `DataShape()`가 제목을 직접 그렸고, 그래서 이 두 절이 **화면에는 있는데
 * 목차에는 없었다**(2026-08-19 실측). 제목을 두 군데 적을 자리를 아예 없앤다.
 */
export function dataShapeSections(): DocSection[] {
  return [
    {
      id: 'sec-shape',
      title: '자료가 어떻게 생겼나',
      body: (
        <>
          <Text color="secondary">
            받아서 여셨을 때 그대로 보이는 이름입니다. 개수는 지금 자료를 센 값입니다.
          </Text>
          <RepoTree />
        </>
      ),
    },
    {
      id: 'sec-record',
      title: '관계 한 건은 이렇게 생겼습니다',
      body: (
        <>
          <Text color="secondary">
            설명이 아니라 <strong>진짜 첫 줄</strong>입니다. 이런 줄이{' '}
            {dataCounts().links.toLocaleString()}개 이어져 있다고 보시면 됩니다.
          </Text>
          <LinkAnatomy />
        </>
      ),
    },
  ]
}

/** 제목까지 붙여 한 덩어리로. **`DocShell`을 안 쓰는 화면**이 그대로 꽂아 쓴다 */
export function DataShape() {
  return (
    <>
      {dataShapeSections().map((s) => (
        <Stack key={s.id} direction="vertical" gap={0} as="section" id={s.id}>
          <Heading level={2}>{s.title}</Heading>
          {s.body}
        </Stack>
      ))}
    </>
  )
}
