import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  Stack,
  Heading,
  Text,
  Badge,
  Divider,
  Card,
  ClickableCard,
  CodeBlock,
  Collapsible,
  List,
  ListItem,
  Link,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { REPO } from '../../lib/links'
import { REPO_ROOT } from '../../lib/ontology'

/**
 * 활용하기. 세 화면 중 **초보자에게 제일 위험한 자리**다 — 표의 정보 밀도가 높아서
 * 처음 온 사람이 "그래서 나는 뭘 누르지"에서 멈춘다. 그래서 표보다 위에
 * **고를 것 하나**를 먼저 놓고, A(AI 없이)를 B(AI와 함께)보다 위에 둔다.
 *
 * 화면에서는 기계 용어를 쓰지 않는다 — 스킬은 「레시피」, 레포는 「깃허브」,
 * 온톨로지는 「자료」다. 폴더명(`point-context`)은 **코드블록 안에서만** 산다.
 * 붙여넣는 사람이 아니라 받는 AI가 읽을 글자이기 때문이다.
 *
 * astryx는 패키지 전체가 `'use client'` 다. 이 파일은 빌드 시점에 파일을 읽는
 * **서버 컴포넌트**라 경계로 **함수 prop을 하나도 넘기지 않는다** — Table을
 * children 모드로 쓰는 것도(`renderCell`이 함수라서), CodeBlock에 `onCopy`를
 * 안 주는 것도 그 때문이다. `tsc`는 이걸 못 잡는다.
 */

const repoShort = REPO.replace(/^https:\/\//, '')

type Row = { id: string; use: string; why: string; done: string }

/**
 * 「해봄」이 마지막 칸이라 묻히기 쉽다. Badge를 앞에 세워 눈이 먼저 걸리게 한다.
 *
 * ponytail: 열 너비를 지정하지 않는다 — children 모드엔 `columns`가 없고,
 * 너비를 잡으려면 `stylex.create`를 불러야 하는데 헌장 3절이 그 선을 막는다.
 * 너비가 실제로 문제가 되면 `columns`+`data` 평문 모드로 내리고 Badge를 포기한다.
 */
function UseTable({ rows }: { rows: Row[] }) {
  return (
    <Table density="spacious" dividers="rows" verticalAlign="top" textOverflow="wrap">
      <TableHeader>
        <TableRow>
          <TableHeaderCell> </TableHeaderCell>
          <TableHeaderCell>쓰임</TableHeaderCell>
          <TableHeaderCell>왜 값이 큰가</TableHeaderCell>
          <TableHeaderCell>해봄</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Text weight="semibold">{r.id}</Text>
            </TableCell>
            <TableCell>
              <Text>{r.use}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm" color="secondary">
                {r.why}
              </Text>
            </TableCell>
            <TableCell>
              <Stack direction="vertical" gap={1}>
                <Badge variant="neutral" label="해봄" />
                <Text size="sm">{r.done}</Text>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** 「왜 값이 큰가」는 준 문장을 그대로 옮긴다 — 존댓말로 고치지 않는다 */
const WITHOUT_AI: Row[] = [
  {
    id: 'A1',
    use: '가계도로 같은 이름을 가른다',
    why: '하스드루발이 넷, 한노가 둘이다. 이름만으로는 절대 안 갈린다. 뒤로 갈수록 인물이 늘어 이 문제가 커진다',
    done: '2026-08-13, 한 사람인 줄 알았던 「카토」가 대 카토(포인트 4)와 소 카토(포인트 7·8) 두 사람이었던 것을 이 방식으로 갈랐다',
  },
  {
    id: 'A2',
    use: '내 포인트에 누가 나오는지 목록으로 본다',
    why: '준비 범위가 첫 화면에서 잡힌다. 책을 다시 훑지 않아도 된다',
    done: '8/13 미팅 인물 파트가 이 목록으로 준비됐다',
  },
  {
    id: 'A3',
    use: '한 인물이 어느 포인트들에 걸쳐 있는지 본다',
    why: '카이사르는 8개 포인트에 나온다. 내 장의 그가 전체에서 어느 국면인지를 알아야 발표가 앞뒤와 이어진다. 4개 이상 포인트에 걸친 인물이 14명 있다',
    done: '「인물 한 명 훑기」 레시피',
  },
  {
    id: 'A4',
    use: '연표에서 내 구간의 앞뒤를 본다',
    why: '내 장이 시작되기 직전에 무슨 일이 있었는지가 도입부 배경지식이 된다',
    done: '연표 자료 82행',
  },
  {
    id: 'A5',
    use: '지명을 지도에서 확인한다',
    why: '메시나·아그리젠토가 어디인지 모르면 전황이 안 그려진다. 좌표 220곳',
    done: '아틀라스 프로토타입',
  },
]

const WITH_AI: Row[] = [
  {
    id: 'B1',
    use: '포인트 하나를 통째로 물려 발표 대본 초안',
    why: '본문·등장 객체·관계가 한 덩어리로 간다. 팀의 실제 병목이 여기다',
    done: '「포인트 자료 모으기」 레시피',
  },
  {
    id: 'B2',
    use: '레드팀: 책 서술을 사료와 대조',
    why: '편역본에 오류가 있다. 포인트 01·02에서 45건이 나왔고 그중 심각이 6건이다. 승패가 뒤집힌 서술이 두 장에 하나씩 있었다',
    done: '「사료와 대조하기」 레시피, 2026-08-12',
  },
  {
    id: 'B3',
    use: '미싱링크: 본문에 있는데 데이터에 없는 것 찾기',
    why: '발표 6트랙 중 미싱링크 역할이 실제로 하는 일',
    done: '밀라이 해전이 이렇게 발견됐다. 로마 최초의 해전 승리인데 자료에 없었다',
  },
  {
    id: 'B4',
    use: '동명이인 판별',
    why: '이름·설명 유사도로는 안 된다. 12쌍 중 4쌍이 별개 인물이었다',
    done: '「동명이인 가리기」 레시피',
  },
  {
    id: 'B5',
    use: '연도 구간으로 잘라 흐름 뽑기',
    why: '"기원전 264~241년에 무슨 일이"',
    done: '「연도 구간 잘라 보기」 레시피',
  },
  {
    id: 'B6',
    use: '관계 조건으로 뽑기',
    why: '"카르타고 장군 가계", "로마가 적대한 세력 전부"',
    done: '「관계로 찾기」 레시피',
  },
]

/**
 * 레시피 8개. `slug`는 폴더명이자 **코드블록 안에서만 보이는 이름**이고,
 * `title`·`what`은 화면에 나가는 한국어다.
 *
 * `what`을 원문 설명 대신 손으로 쓴 이유: 원문 설명은 에이전트에게 하는 말이라
 * "온톨로지", "entities.jsonl" 같은 말로 차 있다. 초보자 화면 규칙과 정면으로 부딪힌다.
 */
const RECIPES = [
  {
    slug: 'point-context',
    title: '포인트 자료 모으기',
    what: '맡은 포인트의 본문과 등장인물, 관계를 한 덩어리로 모아 줍니다.',
    task: '포인트 03 자료를 모아줘.',
  },
  {
    slug: 'entity-lookup',
    title: '인물 한 명 훑기',
    what: '인물 한 명이 어디에 어떻게 나오는지를 전부 모아 줍니다.',
    task: '카이사르가 어느 포인트들에 걸쳐 나오는지 정리해줘.',
  },
  {
    slug: 'relation-query',
    title: '관계로 찾기',
    what: '누가 누구와 어떤 사이였는지를 조건으로 걸러 줍니다.',
    task: '카르타고 장군 가계를 뽑아줘.',
  },
  {
    slug: 'timeline-slice',
    title: '연도 구간 잘라 보기',
    what: '연도 구간을 정하면 그 시기에 무슨 일이 있었는지 모아 줍니다.',
    task: '기원전 264~241년에 무슨 일이 있었는지 뽑아줘.',
  },
  {
    slug: 'fact-check',
    title: '사료와 대조하기',
    what: '책 서술이 실제 사료와 맞는지 문장 단위로 따져 줍니다.',
    task: '포인트 03 본문을 사료와 대조해 오류를 찾아줘.',
  },
  {
    slug: 'homonym-check',
    title: '동명이인 가리기',
    what: '같은 이름이 한 사람인지 두 사람인지 판정해 줍니다.',
    task: '카토가 한 사람인지 두 사람인지 판정해줘.',
  },
  {
    slug: 'propose-change',
    title: '고칠 것 제안하기',
    what: '자료에서 틀린 것을 찾았을 때 고침 제안을 만들어 줍니다.',
    task: '밀라이 해전을 자료에 더하는 제안을 만들어줘.',
  },
  {
    slug: 'regenerate',
    title: '자료 다시 만들기',
    what: '자료를 다시 만들 때 무엇을 어떤 순서로 돌릴지 알려 줍니다.',
    task: '좌표 자료가 새로 들어왔을 때 무엇을 어떤 순서로 다시 돌려야 하는지 알려줘.',
  },
]

/**
 * 레시피 문서 맨 위 `---` 블록에서 이름 한 줄만 뽑는다. 빌드 시점에 한 번 돈다.
 *
 * 이게 값을 하는 지점: 레시피 폴더가 사라지거나 이름이 바뀌면 **빌드가 그 자리에서
 * 죽는다.** 이름을 화면에 박아두면 죽은 깃허브 링크와 엉뚱한 지시문이 조용히 나간다.
 * ponytail: 정규식 두 줄. 우리가 읽는 건 스칼라 하나가 전부다.
 */
function recipeName(slug: string) {
  const md = readFileSync(join(REPO_ROOT, '.agent/skills', slug, 'SKILL.md'), 'utf8')
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md)?.[1] ?? ''
  return /^name:\s*(.+)$/m.exec(fm)?.[1].trim() || slug
}

const WATERFALL = [
  '이름 표기 확인',
  '별칭으로 찾기',
  '특정 연도에 뭐가 있었나',
  '이 지명의 현대 지명',
  '이 객체가 몇 건의 관계를 갖는가',
]

export default function UsePage() {
  return (
    <Shell where="활용하기" path="/use">
      <Stack direction="vertical" gap={6}>
        <Stack direction="vertical" gap={2}>
          <Heading level={1}>이 자료를 어떻게 쓰나</Heading>
          <Text color="secondary">
            여기 있는 것은 <Text weight="semibold">전부 실제로 해본 것</Text>입니다. 표의 「해봄」
            칸이 그 증거입니다.
          </Text>
          <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
            <Badge variant="neutral" label="해봄" />
            <Text size="sm" color="secondary">
              실제로 돌려서 결과가 나온 것만 표시합니다.
            </Text>
          </Stack>
        </Stack>

        {/*
          초보자가 표를 만나기 전에 **고를 것 하나**를 먼저 준다.
          셋을 주면 고르는 일 자체가 부담이 된다 — 그래서 한 개다.
        */}
        <ClickableCard href="/download" label="가져가기로 이동" padding={4}>
          <Stack direction="vertical" gap={1}>
            <Heading level={2}>처음이시면 여기부터</Heading>
            <Text>맡은 포인트에 누가 나오는지부터 보세요. AI도 설치도 필요 없습니다.</Text>
            <Text weight="semibold" color="accent">
              가져가기로 이동
            </Text>
          </Stack>
        </ClickableCard>

        <Stack direction="vertical" gap={3}>
          <Heading level={2}>A. AI 없이 — 열어보기만 해도 되는 것</Heading>
          <Text color="secondary">
            <Text weight="semibold">AI를 안 쓰셔도 됩니다.</Text> 준비물이 없습니다. 계정도 설치도
            프롬프트도 필요 없고, AI를 안 쓰는 팀원도 그대로 씁니다.
          </Text>
          <UseTable rows={WITHOUT_AI} />
        </Stack>

        <Divider />

        <Stack direction="vertical" gap={3}>
          <Heading level={2}>B. AI와 함께 — 데이터를 재료로 넘길 때</Heading>
          <Text color="secondary">
            아래는 AI를 쓰는 방법입니다.{' '}
            <Text weight="semibold">쓰던 ChatGPT 그대로면 됩니다.</Text> 새로 뭘 깔 필요 없습니다.
          </Text>
          <Text color="secondary">
            <Text weight="semibold">핵심은 AI에게 무엇을 주느냐입니다.</Text> 깃허브 주소만 던지면
            AI가 폴더를 헤매다 엉뚱한 것을 읽습니다. 이 자료실이 하는 일은{' '}
            <Text weight="semibold">줄 것을 골라 한 덩어리로 만들어주는 것</Text>입니다.
          </Text>
          <UseTable rows={WITH_AI} />
          <Text size="sm" color="secondary">
            <Text weight="semibold">AI 도구를 가리지 않습니다.</Text> 클로드·코덱스뿐 아니라 쓰던
            ChatGPT에도 통해야 합니다. 레시피는 특정 도구의 기능이 아니라{' '}
            <Text weight="semibold">붙여넣을 텍스트</Text>로 씁니다.
          </Text>
        </Stack>

        <Divider />

        <Stack direction="vertical" gap={4}>
          <Stack direction="vertical" gap={2}>
            <Heading level={2}>붙여넣을 문장</Heading>
            <Card variant="muted" padding={3}>
              <Text weight="semibold">
                아래 상자를 복사해서 쓰던 AI에 그대로 붙여넣으세요. 포인트 번호만 바꾸면 됩니다.
              </Text>
            </Card>
          </Stack>

          {RECIPES.map(({ slug, title, what, task }) => (
            <Stack key={slug} direction="vertical" gap={1.5}>
              <Stack direction="vertical" gap={0.5}>
                <Text weight="semibold">{title}</Text>
                <Text size="sm" color="secondary">
                  {what}
                </Text>
              </Stack>
              <CodeBlock
                title={title}
                code={`로마제국쇠망사 깃허브(${repoShort})의\n${recipeName(slug)} 레시피 절차를 따라 ${task}`}
                hasCopyButton
                isWrapped
                width="100%"
                size="sm"
              />
              <Link
                href={`${REPO}/blob/main/.agent/skills/${slug}/SKILL.md`}
                isExternalLink
                size="sm"
              >
                「{title}」 자세히 보기 (깃허브)
              </Link>
            </Stack>
          ))}
        </Stack>

        <Divider />

        {/*
          제목이 Collapsible 밖에 있는 이유: astryx의 trigger는 `<button>` 안에
          들어간다. h2를 거기 넣으면 button의 콘텐츠 모델(phrasing content)을
          어기고 문서 개요에서도 빠진다.
        */}
        <Stack direction="vertical" gap={2}>
          <Heading level={2}>C. 워터폴 — 자잘하지만 자주 쓰는 것</Heading>
          <Collapsible defaultIsOpen={false} trigger={<Text size="sm">목록 펼쳐 보기</Text>}>
            <List listStyle="disc" density="compact">
              {WATERFALL.map((item) => (
                <ListItem key={item} label={item} />
              ))}
            </List>
          </Collapsible>
        </Stack>
      </Stack>
    </Shell>
  )
}
